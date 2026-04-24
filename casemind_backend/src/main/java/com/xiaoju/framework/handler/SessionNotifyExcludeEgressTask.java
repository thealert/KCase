package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.BroadcastOperations;
import com.corundumstudio.socketio.SocketIOClient;
import com.xiaoju.framework.util.JsonUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;

public class SessionNotifyExcludeEgressTask extends SessionEgressTask {

    protected static final Logger LOGGER = LoggerFactory.getLogger(SessionNotifyExcludeEgressTask.class);
    Map<String, WebSocketSession> roomSessions;
    WebSocketSession client;

    public SessionNotifyExcludeEgressTask(String name, String egressMsg, WebSocketSession client, Map<String, WebSocketSession> roomSessions) {
        super(name, egressMsg);
        this.client = client;
        this.roomSessions=roomSessions;
    }

    @Override
    public void run() {
        LOGGER.info("notify exclude  egress message: " + egressMsg);
        for (WebSocketSession session : roomSessions.values()) {
            try {
                if(!session.getId().equals(client.getId()))
                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg(type,egressMsg)));
            } catch (IOException e) {
                LOGGER.error("SessionNotifyEgressTask error: "+e.toString());
                throw new RuntimeException(e);
            }
        }
    }
}
