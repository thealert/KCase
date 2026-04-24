package com.xiaoju.framework.handler;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.xiaoju.framework.CaseServerApplication;
import com.xiaoju.framework.entity.dto.SesssionInfoDto;
import com.xiaoju.framework.entity.persistent.CaseBackup;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.ExecRecordMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.service.impl.DemoImpl;
import com.xiaoju.framework.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.*;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

@Component
@ComponentScan(basePackageClasses = {CaseServerApplication.class})
public class MyWebSocketHandler implements WebSocketHandler {




    public static ConcurrentHashMap<String, ConcurrentHashMap<String, WebSocketSession>> roomSessionsMap = new ConcurrentHashMap<>();

    private static final Logger LOGGER = LoggerFactory.getLogger(MyWebSocketHandler.class);

    @Value("${session.previous-version-history-size:5}")
    private int previousVersionHistorySize;


    static ConcurrentHashMap<WebSocketSession, SessionRoomEntity> clientRoomMap = new ConcurrentHashMap<>();


    private ExecRecordMapper recordMapper;


    private TestCaseMapper caseMapper;


    private CaseBackupMapper caseBackupMapper;


    private StringRedisTemplate redisTemplate;

    ObjectMapper jsonMapper = new ObjectMapper();
    JsonNodeFactory FACTORY = JsonNodeFactory.instance;


    public static void setRoomContent(Long roomid, String content) {
        for (SessionRoomEntity room : clientRoomMap.values()) {
            LOGGER.info("setRoomContent:" + room.roomId + " || " + roomid.toString());
            if (room.roomId.equals(roomid.toString())) {
                room.setCaseContent(content);
            }
        }
    }


    private ExecutorService executorIngressService = Executors.newFixedThreadPool(2);

    // 消息转发
    private ExecutorService executorEgressService = Executors.newFixedThreadPool(1);


    private Logger log = LoggerFactory.getLogger(MyWebSocketHandler.class);


    public MyWebSocketHandler(TestCaseMapper tc, ExecRecordMapper ec, CaseBackupMapper cb,StringRedisTemplate rt) {
        caseMapper = tc;
        recordMapper = ec;
        caseBackupMapper = cb;
        redisTemplate=rt;
    }

    public boolean judgeuser(WebSocketSession session, ClientEntity clientEntity, String username) {

        try {
            if (null == clientEntity.getRecordId()) {
                SessionRoomEntity roomEntity = SessionRoomFactory.getRoom(clientEntity.getRoomId(), clientEntity.getCaseId(), caseMapper, caseBackupMapper, previousVersionHistorySize);
                if (roomEntity.userInRoom(username)) {
                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("inroom", "")));
                    return true;
                }
            } else {
                SessionRecordEntity recordEntity = SessionRecordFactory.getRoom(clientEntity.getRoomId(), clientEntity.getCaseId(), caseMapper, caseBackupMapper, clientEntity.getRecordId(), recordMapper, previousVersionHistorySize);
                if (recordEntity.userInRoom(username)) {
                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("inroom", "")));
                    return true;
                }
            }
        } catch (Exception e) {
            LOGGER.info("judgeuser fail: " + e.toString());
            return true;
        }
        return false;
    }


    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("与客户端建立连接...");

//        redisTemplate.opsForValue().set("mycase_vals", "11111",3600, TimeUnit.SECONDS);
//        String redis_val=redisTemplate.opsForValue().get("mycase_vals");
//        LOGGER.info("redis_val:"+redis_val);

//        redisTemplate.opsForValue().set("mycase_vals", "11111",30, TimeUnit.SECONDS);
//        String redis_val=redisTemplate.opsForValue().get("mycase_vals");
//        LOGGER.info("redis_val:"+redis_val);
        //连接成功时调用该方法
        System.out.println("WebSocket connected: " + session.getId());

        String historyId = SeeeionUtil.getQueryParam(session, "historyId");
        if (historyId != null && !historyId.equals("undefined")) {
            LOGGER.info("Goto History Logic " + historyId);
            try {
                CaseBackup caseBackup = caseBackupMapper.selectByBackupId(Long.parseLong(historyId));
                caseBackup.setCaseContent(caseBackup.getMergeCaseContent());
                executorEgressService.submit(new SessionAckEgressTask("open_event",
                        caseBackup.getCaseContent(), session));
            } catch (Exception e) {
                LOGGER.error("History Logic Error: " + e.toString());
            }
            return;
        }

        ClientEntity clientEntity = getRoomFromSessionClient(session);
        String roomId = clientEntity.getRoomId();
        String username = SeeeionUtil.getQueryParam(session, "user");

        //一人一窗口
//        if(judgeuser(session,clientEntity,username)){
//            return;
//        }

        ConcurrentHashMap<String, WebSocketSession> roomSessions = roomSessionsMap.get(roomId);
        if (roomSessions == null) {
            roomSessions = new ConcurrentHashMap<>();
            roomSessionsMap.put(roomId, roomSessions);
        }
        // 将WebSocketSession与房间号关联
        roomSessions.put(session.getId(), session);


        if (null == clientEntity.getRecordId()) {
            SessionRoomEntity roomEntity = SessionRoomFactory.getRoom(roomId, clientEntity.getCaseId(), caseMapper, caseBackupMapper, previousVersionHistorySize);

            roomEntity.addClient(session);
            clientRoomMap.put(session, roomEntity);

            LOGGER.info("add case client room map size: " + clientRoomMap.keySet().size());
            executorEgressService.submit(new SessionAckEgressTask("open_event",
                    roomEntity.getCaseContent(), roomEntity.testCase.getCase_extype().toString(), session));
            if (roomEntity.isLockedByClient()) {
                LOGGER.info("add client, case is locked by others");
                executorEgressService.submit(new SessionAckEgressTask("lock", "0", session));
            }

            executorEgressService.submit(new SessionNotifyEgressTask("connect_notify_event",
                    roomEntity.getClientName(), roomSessionsMap.get(roomId)));

            LOGGER.info("connected caseId: " + clientEntity.getCaseIdStr() + ", roomId: " + roomId);

        } else {
            SessionRecordEntity recordEntity = SessionRecordFactory.getRoom(roomId, clientEntity.getCaseId(), caseMapper, caseBackupMapper, clientEntity.getRecordId(), recordMapper, previousVersionHistorySize);
            recordEntity.addClient(session);
            clientRoomMap.put(session, recordEntity);

            LOGGER.info("add record client room map size: " + clientRoomMap.keySet().size());
            executorEgressService.submit(new SessionAckEgressTask("open_event",
                    recordEntity.getCaseContent(), recordEntity.testCase.getCase_extype().toString(), session));

            if (recordEntity.isLockedByClient()) {
                LOGGER.info("add client, record is locked by others");
                executorEgressService.submit(new SessionAckEgressTask("lock", "0", session));
            }
            executorEgressService.submit(new SessionNotifyEgressTask("connect_notify_event",
                    recordEntity.getClientName(), roomSessionsMap.get(roomId)));

            LOGGER.info("connected caseId: " + clientEntity.getCaseIdStr() + ", recordid: " + clientEntity.getRecordId());
//            String content = recordEntity.getCaseContent();
//            session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("open_event",content)));
//            LOGGER.info("add record client room map size: " + clientRoomMap.keySet().size());
//            LOGGER.info("connected caseId: " + clientEntity.getCaseIdStr() + ", recordid: " + clientEntity.getRecordId());
        }


    }

    private static ClientEntity getRoomFromSessionClient(WebSocketSession session) {
        ClientEntity clientEntity = new ClientEntity();
        URI uri = session.getUri();

        String caseId = SeeeionUtil.getQueryParam(session, "caseId");
        String recordId = SeeeionUtil.getQueryParam(session, "recordId");
        clientEntity.setCaseIdStr(caseId);
        clientEntity.setCaseId(Long.valueOf(caseId));
        if (!recordId.equals("undefined")) {
            clientEntity.setRecordId(Long.valueOf(recordId));
            clientEntity.setRecordIdStr(recordId);
            clientEntity.setRoomId(String.valueOf(BitBaseUtil.mergeLong(clientEntity.getRecordId(), clientEntity.getCaseId())));
        } else {
            clientEntity.setRoomId(caseId);
        }

        return clientEntity;
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        // 获取客户端发送的消息
        //System.out.println("客户端ID: " + session.getId() + " 发送消息: " + message.getPayload());

        try {
            String payload = (String) message.getPayload();
            
            // 检查并解压缩消息（如果需要）
            String decompressedPayload = GzipUtils.decompressIfNeeded(payload);
            
            JSONObject msgjson = JSON.parseObject(decompressedPayload);
            session.getAttributes().put("hb",System.currentTimeMillis());
            switch (msgjson.getString("type")) {
                case "HB"://心跳

                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("HB", "")));
                    break;
                case "sycase":

                    ClientEntity clientEntity_case = getRoomFromSessionClient(session);
                    if (null == clientEntity_case.getRecordId()) {
                        String roomId_case = clientEntity_case.getRoomId();
                        SessionRoomEntity roomEntity = SessionRoomFactory.getRoom(roomId_case, clientEntity_case.getCaseId(), caseMapper, caseBackupMapper, previousVersionHistorySize);

                        TestCase testcase = caseMapper.selectOne(clientEntity_case.getCaseId());

                        // JSONObject testcase_jsonObject = JSONObject.parseObject(testcase.getCaseContent());
                        //JSONObject testcasebackup_jsonObject = msgjson.getJSONObject("data").getJSONObject("caseContent");
                        //testcasebackup_jsonObject.put("base",testcase_jsonObject.getInteger("base")+1);
                        String testcasebackup_str = msgjson.getJSONObject("data").getString("caseContent");
                        if (roomEntity != null) {
                            roomEntity.setCaseContent(testcasebackup_str);
                        }
                        testcase.setCaseContent(testcasebackup_str);
                        caseMapper.update(testcase);
                    }
                    break;
                case "syrecord":
                    String command_data = msgjson.getString("data");
                    ClientEntity clientEntity = getRoomFromSessionClient(session);
                    String roomId = clientEntity.getRoomId();
                    SessionRecordEntity recordEntity = SessionRecordFactory.getRoom(roomId, clientEntity.getCaseId(), caseMapper, caseBackupMapper, clientEntity.getRecordId(), recordMapper, previousVersionHistorySize);
                    recordEntity.synDB(session);
                    if (command_data.equals("forcap"))
                        session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("syforcapok", "")));
                    break;
                case "edit":
                    LOGGER.info("Handler Edit Message Client{} Server{}",msgjson.getLong("ts"),System.currentTimeMillis());
                    EditMessage editdata = JSONObject.toJavaObject(msgjson.getJSONObject("data"), EditMessage.class);
                    executorIngressService.submit(new SessionEditIngressTask(session, clientRoomMap.get(session), executorEgressService, editdata, caseBackupMapper));
                    break;
                case "case_design_event":
                    CaseDesignMessage casedata = JSONObject.toJavaObject(msgjson.getJSONObject("data"), CaseDesignMessage.class);
                    executorIngressService.submit(new SessionCaseDesignIngressTask(session, clientRoomMap.get(session), executorEgressService, casedata));
                    break;
                case "lock":
                    PushMessage pushdata = JSONObject.toJavaObject(msgjson.getJSONObject("data"), PushMessage.class);
                    executorIngressService.submit(new SessionLockIngressTask(session, clientRoomMap.get(session), executorEgressService, pushdata));
                    break;
                case "save":
                    EditMessage editdata1 = JSONObject.toJavaObject(msgjson.getJSONObject("data"), EditMessage.class);
                    executorIngressService.submit(new SessionSaveIngressTask(session, clientRoomMap.get(session), executorEgressService, editdata1, caseBackupMapper));
                    break;
                case "record_clear":
                    executorIngressService.submit(new SessionRecordClearIngressTask(session, clientRoomMap.get(session), executorEgressService));
                    break;

                case "undo":
                    PushMessage pushdata1 = JSONObject.toJavaObject(msgjson.getJSONObject("data"), PushMessage.class);
                    executorIngressService.submit(new SessionUndoIngressTask(session,clientRoomMap.get(session),executorEgressService,pushdata1));
                    break;
                case "redo":
                    PushMessage pushdata2 = JSONObject.toJavaObject(msgjson.getJSONObject("data"), PushMessage.class);
                    executorIngressService.submit(new SessionRedoIngressTask(session,clientRoomMap.get(session),executorEgressService,pushdata2));
                    break;
            }
        } catch (Exception e) {
            LOGGER.error("Socket handleMessage error : " + e.toString());
        }

    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        if (exception instanceof java.io.EOFException) {
            log.info("客户端连接断开 sessionId={}", session != null ? session.getId() : "null");
        } else {
            log.error("连接异常 sessionId={}", session != null ? session.getId() : "null", exception);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        System.out.println("WebSocket closed: " + session.getId());
        log.info("与客户端断开连接...");

        String historyId = SeeeionUtil.getQueryParam(session, "historyId");
        if (historyId != null && !historyId.equals("undefined")) {
            try { session.close(); } catch (Exception ignored) {}
            return;
        }

        ClientEntity clientEntity = null;
        String roomId = null;
        try {
            clientEntity = getRoomFromSessionClient(session);
            roomId = clientEntity.getRoomId();

            if (null == clientEntity.getRecordId()) {
                SessionRoomEntity roomEntity = SessionRoomFactory.getRoom(roomId, clientEntity.getCaseId(), caseMapper, caseBackupMapper, previousVersionHistorySize);
                if (roomEntity.lockByClient(session)) {
                    LOGGER.info("remove client who has lock, case unlock");
                    executorEgressService.submit(new SessionNotifyEgressTask("lock", "1", roomSessionsMap.get(roomId)));
                    roomEntity.clientUnlock();
                }
                roomEntity.removeClient(session);
                if (roomEntity.getClientNum() == 0) {
                    SessionRoomFactory.clearRoom(roomId);
                }

                LOGGER.info("remove case client room map size: " + clientRoomMap.keySet().size());

                executorEgressService.submit(new SessionNotifyEgressTask("connect_notify_event",
                        roomEntity.getClientName(), roomSessionsMap.get(roomId)));

                for (WebSocketSession ws : clientRoomMap.keySet()) {
                    SessionRoomEntity sre = clientRoomMap.get(ws);
                    if (sre.getCaseId().equals(clientEntity.getCaseId()) && (sre instanceof SessionRecordEntity)) {
                        SessionRecordEntity curRecord = (SessionRecordEntity) sre;
                        curRecord.mergeCaseToRecord(curRecord.recordId, roomEntity.testCase.getCaseContent(), recordMapper);
                        LOGGER.info("syn case to record Caseid: " + curRecord.caseId + " Recordid: " + curRecord.recordId);
                    }
                }

            } else {
                SessionRecordEntity recordEntity = SessionRecordFactory.getRoom(roomId, clientEntity.getCaseId(), caseMapper, caseBackupMapper, clientEntity.getRecordId(), recordMapper, previousVersionHistorySize);
                if (recordEntity.lockByClient(session)) {
                    LOGGER.info("remove client who has lock, record unlock");
                    executorEgressService.submit(new SessionNotifyEgressTask("lock", "1", roomSessionsMap.get(roomId)));
                    recordEntity.clientUnlock();
                }
                recordEntity.removeClient(session);
                if (recordEntity.getClientNum() == 0) {
                    SessionRecordFactory.clearRoom(roomId);
                }
                LOGGER.info("remove record client room map size: " + clientRoomMap.keySet().size());
                executorEgressService.submit(new SessionNotifyEgressTask("connect_notify_event",
                        recordEntity.getClientName(), roomSessionsMap.get(roomId)));
            }
        } catch (Exception e) {
            LOGGER.error("afterConnectionClosed 业务清理异常 sessionId={}", session.getId(), e);
        } finally {
            clientRoomMap.remove(session);
            if (roomId != null) {
                Map<String, WebSocketSession> roomSessions = roomSessionsMap.get(roomId);
                if (roomSessions != null) {
                    roomSessions.remove(session.getId());
                    if (roomSessions.isEmpty()) {
                        roomSessionsMap.remove(roomId);
                    }
                }
            }
            try { session.close(); } catch (Exception ignored) {}
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

//    @Scheduled(fixedRate = 30000) // 每X秒执行一次
//    public  void socketConnectChecker(){
//
////        LOGGER.info("socketConnectChecker test timer");
//        for (WebSocketSession session : clientRoomMap.keySet()) {
//                if(session.getAttributes().get("hb")!=null){
//                    long ts=(long)session.getAttributes().get("hb");
//                    long curTs = System.currentTimeMillis();
//
//                    if((curTs-ts)>22000){
//                        String caseId = SeeeionUtil.getQueryParam(session, "caseId");
//                        String username = SeeeionUtil.getQueryParam(session, "user");
//                        LOGGER.error("Socket Time out! caseId: "+caseId+" username:"+username+" ts:"+(curTs-ts));
//
//                        try {
//                            afterConnectionClosed(session,CloseStatus.GOING_AWAY);
//                        } catch (Exception e) {
//                            throw new RuntimeException(e);
//                        }
//                    }
//                }
//        }
//    }


    public static List<SesssionInfoDto> getWebsocketInfo() {

        List<SesssionInfoDto> sessioninfos = new ArrayList<>();
        for (WebSocketSession session : clientRoomMap.keySet()) {

            try{
                String caseId = SeeeionUtil.getQueryParam(session, "caseId");
                String recordId = SeeeionUtil.getQueryParam(session, "recordId");
                String username = SeeeionUtil.getQueryParam(session, "user");

                if (recordId.equals("undefined")) {
                    SessionRoomEntity room = clientRoomMap.get(session);
                    sessioninfos.add(new SesssionInfoDto(caseId, recordId, username,
                            room.testCase.getTitle(), "",
                            session.getId(),
                            (String) session.getAttributes().get("TC"),
                            Double.parseDouble(String.format("%.2f", (session.getTextMessageSizeLimit() / 1000000.0)))));
                } else {
                    SessionRecordEntity recordentity = (SessionRecordEntity) clientRoomMap.get(session);

                    sessioninfos.add(new SesssionInfoDto(caseId, recordId, username,
                            recordentity.testCase.getTitle(), recordentity.record.getTitle(),
                            session.getId(),
                            (String) session.getAttributes().get("TC"),
                            Double.parseDouble(String.format("%.2f", (session.getTextMessageSizeLimit() / 1000000.0)))));
                }
            }catch (Exception e){
                try{
                    if(!session.isOpen()){
                        clientRoomMap.remove(session);
                        ClientEntity clientEntity = getRoomFromSessionClient(session);
                        String roomId = clientEntity.getRoomId();
                        Map<String, WebSocketSession> roomSessions = roomSessionsMap.get(roomId);
                        if (roomSessions != null) {
                            // 移除与房间号关联的WebSocketSession
                            roomSessions.remove(session.getId());

                            // 如果房间中没有其他WebSocketSession了，移除房间
                            if (roomSessions.isEmpty()) {
                                roomSessionsMap.remove(roomId);

                            }
                        }
                    }
                }catch (Exception e1){

                }

            }


        }
        return sessioninfos;
    }

    @PreDestroy
    private void shutdown() {

        LOGGER.info("MyWebSocketHandler PreDestroy handle");

        for (WebSocketSession session : clientRoomMap.keySet()) {
            ClientEntity clientEntity = getRoomFromSessionClient(session);

            if (null == clientEntity.getRecordId()) {
                TestCase testcase = caseMapper.selectOne(clientEntity.getCaseId());
                SessionRoomEntity roomEntity = SessionRoomFactory.getRoom(clientEntity.getRoomId(), clientEntity.getCaseId(), caseMapper, caseBackupMapper, previousVersionHistorySize);
                testcase.setCaseContent(roomEntity.getCaseContent());
                caseMapper.update(testcase);
                LOGGER.info("Case save todb");

            } else {
                SessionRecordEntity recordEntity = SessionRecordFactory.getRoom(clientEntity.getRoomId(), clientEntity.getCaseId(), caseMapper, caseBackupMapper, clientEntity.getRecordId(), recordMapper, previousVersionHistorySize);
                recordEntity.synDB(session);
                LOGGER.info("Record save todb");
            }
        }

        LOGGER.info("MyWebSocketHandler PreDestroy handle Done");
    }
}
