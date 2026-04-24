package com.xiaoju.framework.handler;

import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.flipkart.zjsonpatch.JsonDiff;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.util.SeeeionUtil;
import com.xiaoju.framework.util.TreeUtil;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.WebSocketSession;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;
public class SessionRoomEntity {
    protected static final Logger LOGGER = LoggerFactory.getLogger(RoomEntity.class);
    String roomId;
    Long caseId;
    Map<String, String> clientMap;

    List<WebSocketSession> socketSessionList;
    TestCase testCase;
    TestCaseMapper caseMapper;

    CaseBackupMapper caseBackupMapper;
    WebSocketSession lockClient;
    ObjectMapper jsonMapper;
    JsonNodeFactory FACTORY;
    ReentrantLock lock= new ReentrantLock();

    int dataVersion;
    
    // 保存最近若干个版本的内容，用于三方合并冲突检测
    NavigableMap<Integer, String> versionContentHistory;
    int previousVersionHistorySize;

    public SessionRoomEntity(String roomId, Long caseId, TestCaseMapper caseMapper,CaseBackupMapper caseBackupMapper, int previousVersionHistorySize) {
        this.roomId = roomId;
        this.caseMapper = caseMapper;
        this.caseBackupMapper=caseBackupMapper;
        this.caseId = caseId;
        this.testCase = caseMapper.selectOne(caseId);
        this.clientMap = new HashMap<>();
        this.jsonMapper = new ObjectMapper();
        this.FACTORY = JsonNodeFactory.instance;
        this.socketSessionList=new CopyOnWriteArrayList<>();
        this.versionContentHistory = new TreeMap<>();
        this.previousVersionHistorySize = Math.max(1, previousVersionHistorySize);
        String res = testCase == null ? null : testCase.getCaseContent();
        if (StringUtils.isEmpty(res)) {
            LOGGER.error(Thread.currentThread().getName() + ": 用例内容为空");
            // todo: 此处需要走异常处理流程
        } else {
            // 加载时立即检测并持久化去重结果，确保数据库不残留重复 ID
            String dedupContent = TreeUtil.deduplicateCaseContent(res);
            if (!dedupContent.equals(res)) {
                LOGGER.warn("SessionRoomEntity 初始化：检测到重复节点ID，已自动修复并回写数据库, caseId: {}", caseId);
                testCase.setCaseContent(dedupContent);
                testCase.setGmtModified(new Date(System.currentTimeMillis()));
                caseMapper.update(testCase);
            }
        }

        // 初始化版本快照，用于支持三方合并
        cacheVersionContent(testCase == null ? null : testCase.getCaseContent());
        LOGGER.info("SessionRoomEntity 初始化 - roomId: {}, caseId: {}, versionHistorySize: {}", roomId, caseId, this.previousVersionHistorySize);
    }

    public int getDataVersion() {
        return dataVersion;
    }

    public void setDataVersion(int dataVersion) {
        this.dataVersion = dataVersion;
    }

    public synchronized String getPreviousVersionContent() {
        return versionContentHistory.isEmpty() ? null : versionContentHistory.lastEntry().getValue();
    }

    public synchronized void setPreviousVersionContent(String previousVersionContent) {
        cacheVersionContent(previousVersionContent);
    }

    public synchronized String getVersionContent(int version) {
        return versionContentHistory.get(version);
    }

    public synchronized void cacheVersionContent(String versionContent) {
        if (StringUtils.isEmpty(versionContent)) {
            return;
        }

        try {
            JsonNode contentJson = jsonMapper.readTree(versionContent);
            JsonNode baseNode = contentJson.get("base");
            if (baseNode == null || !baseNode.isInt()) {
                LOGGER.warn("缓存版本快照失败，缺少有效base字段，roomId: {}", roomId);
                return;
            }

            versionContentHistory.put(baseNode.asInt(), versionContent);
            trimVersionHistoryIfNeeded();
        } catch (Exception e) {
            LOGGER.warn("缓存版本快照失败，roomId: {}, error: {}", roomId, e.getMessage());
        }
    }

    public synchronized void setPreviousVersionHistorySize(int previousVersionHistorySize) {
        this.previousVersionHistorySize = Math.max(1, previousVersionHistorySize);
        trimVersionHistoryIfNeeded();
    }

    private void trimVersionHistoryIfNeeded() {
        while (versionContentHistory.size() > previousVersionHistorySize) {
            versionContentHistory.pollFirstEntry();
        }
    }


    public void addClient(WebSocketSession session) {

        this.clientMap.put(session.getId(), SeeeionUtil.getQueryParam(session,"user"));
        this.socketSessionList.add(session);
        LOGGER.info("add client, current user number:" + this.clientMap.size() + ", name: " + SeeeionUtil.getQueryParam(session,"user"));

    }

    public boolean userInRoom(String name){
        List<String> usernames= new ArrayList<String>(clientMap.values());
        if(usernames.contains(name)){
            return true;
        }
        return false;
    }

    public JSONObject synDB(WebSocketSession session){
        try {
            TestCase testCaseBase = caseMapper.selectOne(caseId);
            String dedupContent = TreeUtil.deduplicateCaseContent(testCase.getCaseContent());
            testCase.setCaseContent(dedupContent);

            JsonNode saveContent = jsonMapper.readTree(dedupContent);
            JsonNode baseContent = jsonMapper.readTree(testCaseBase.getCaseContent());
            if (saveContent.get("base").asInt() > baseContent.get("base").asInt()) {
                // 保存落库
                TestCase testCaseToUpdate = this.testCase;
                TreeUtil.caseDFSValidate(saveContent.get("root"));
                testCaseToUpdate.setCaseContent(saveContent.toString());
                testCaseToUpdate.setGmtModified(new Date(System.currentTimeMillis()));
                testCaseToUpdate.setModifier(SeeeionUtil.getQueryParam(session,"user"));
                int ret = caseMapper.update(testCaseToUpdate);
                if (ret < 1) {
                    LOGGER.error(Thread.currentThread().getName() + ": 数据库用例内容更新失败。 ret = " + ret);
                    LOGGER.error("应该保存的用例内容是：" + saveContent);
                }
            } else {
                // 不保存
                LOGGER.info(Thread.currentThread().getName() + "不落库." + saveContent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new JSONObject(); // 默认返回空对象
    }
    public void removeClient(WebSocketSession session) {
        this.clientMap.remove(session.getId());
        this.socketSessionList.remove(session);
        LOGGER.info("remove client, current user number:" + this.clientMap.size());
        if (this.clientMap.size() >= 0) {
            try {
                TestCase testCaseBase = caseMapper.selectOne(caseId);
                String dedupContent = TreeUtil.deduplicateCaseContent(testCase.getCaseContent());
                testCase.setCaseContent(dedupContent);

                JsonNode saveContent = jsonMapper.readTree(dedupContent);
                JsonNode baseContent = jsonMapper.readTree(testCaseBase.getCaseContent());

                if(JsonDiff.asJson(saveContent,baseContent).size()>0){
                    // 保存落库
                    TestCase testCaseToUpdate = this.testCase;
                    TreeUtil.caseDFSValidate(saveContent.get("root"));
                    testCaseToUpdate.setCaseContent(saveContent.toString());
                    testCaseToUpdate.setGmtModified(new Date(System.currentTimeMillis()));
                    testCaseToUpdate.setModifier(SeeeionUtil.getQueryParam(session,"user"));
                    int ret = caseMapper.update(testCaseToUpdate);
                    if (ret < 1) {
                        LOGGER.error(Thread.currentThread().getName() + ": 数据库用例内容更新失败。 ret = " + ret);
                        LOGGER.error("应该保存的用例内容是：" + saveContent);
                    }
                } else {
                    // 不保存
                    LOGGER.info(Thread.currentThread().getName() + "不落库." + saveContent);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public int getClientNum() {
        return this.clientMap.size();
    }

    public boolean isLockedByClient() {
        return this.lockClient != null;
    }

    public void clientLock(WebSocketSession client) {
        this.lockClient = client;
    }

    public boolean lockByClient(WebSocketSession client) {
        //LOGGER.info("lock info "+lockClient.getId()+","+client.getId());
        return this.lockClient == client;
    }


    public void clientUnlock() {
        this.lockClient = null;
    }

    public boolean lock()  {
        try{
            return lock.tryLock(3, TimeUnit.SECONDS);

        }catch (Exception e){
            LOGGER.error("lock error",e);
        }
        return false;
    }

    public void unlock() {
        this.lock.unlock();
    }

    public String getRoomId() {
        return this.roomId;
    }

    public String getClientName() {

        return clientMap.values().stream().collect(Collectors.joining(","));
    }

    public Long getCaseId() {
        return this.caseId;
    }
    public String getCaseContent() {
        return testCase.getCaseContent();
    }

    public void setCaseContent(String caseContent) {
        this.testCase.setCaseContent(caseContent);
    }
}
