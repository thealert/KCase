package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.BroadcastOperations;
import com.xiaoju.framework.util.JsonUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;

public class SessionNotifyEgressTask extends SessionEgressTask{

    protected static final Logger LOGGER = LoggerFactory.getLogger(SessionNotifyEgressTask.class);

    Map<String, WebSocketSession> roomSessions;

    public SessionNotifyEgressTask(String type, String egressMsg, Map<String, WebSocketSession> roomSessions) {
        super(type, egressMsg);
        this.roomSessions=roomSessions;
    }

    @Override
    public void run() {
        LOGGER.info("notify egress message: " + egressMsg);
        for (WebSocketSession session : roomSessions.values()) {
            try {
                session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg(type,egressMsg)));
            } catch (IOException e) {
                LOGGER.error("SessionNotifyEgressTask error: "+e.toString());
                throw new RuntimeException(e);
            }
        }
    }
}
