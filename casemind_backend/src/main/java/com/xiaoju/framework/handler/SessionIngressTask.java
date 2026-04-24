package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.xiaoju.framework.util.BitBaseUtil;
import com.xiaoju.framework.util.SeeeionUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.locks.Lock;

public abstract class SessionIngressTask implements Runnable{
    protected static final Logger LOGGER = LoggerFactory.getLogger(SessionIngressTask.class);

    WebSocketSession session;

    ObjectMapper jsonMapper;

    JsonNodeFactory FACTORY;

    SessionRoomEntity room;

    ExecutorService executorEgressService;

    Lock lock;

    public SessionIngressTask(WebSocketSession session, SessionRoomEntity room, ExecutorService executorEgressService) {
        this.session = session;
        this.room = room;
        this.executorEgressService = executorEgressService;
        this.jsonMapper = new ObjectMapper();
        this.FACTORY = JsonNodeFactory.instance;
    }

    @Override
    public void run() {

    }

    protected ClientEntity getRoomFromClient(WebSocketSession session) {
        ClientEntity clientEntity = new ClientEntity();
        URI uri = session.getUri();

        String caseId = SeeeionUtil.getQueryParam(session,"caseId");
        String recordId =SeeeionUtil.getQueryParam(session,"recordId");
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

    protected ArrayNode patchTraverse(ArrayNode patch) {
        ArrayNode patchesNew = FACTORY.arrayNode();
        try {
            for (int i = 0; i < patch.size(); i++) {
                patchesNew.addAll((ArrayNode) patch.get(i));
            }
        } catch (Exception e) {
            LOGGER.error(e.toString());
            LOGGER.error("转换客户端发送patch失败。", e);
        }
        return patchesNew;
    }
}
