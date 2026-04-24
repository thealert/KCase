package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.SocketIOClient;
import com.xiaoju.framework.util.JsonUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.*;

import java.io.IOException;

public class SessionAckEgressTask extends SessionEgressTask{
    protected static final Logger LOGGER = LoggerFactory.getLogger(SessionAckEgressTask.class);

    WebSocketSession session;

    String exinfo;

    public SessionAckEgressTask(String type, String egressMsg, WebSocketSession session) {
        super(type, egressMsg);
        this.session = session;
    }

    public SessionAckEgressTask(String type, String egressMsg, String exinfo,WebSocketSession session) {
        super(type, egressMsg);
        this.session = session;
        this.exinfo = exinfo;
    }

    @Override
    public void run() {
        try {
            if(exinfo==null || exinfo =="")
                session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg(type,egressMsg)));
            else
                session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg(type,egressMsg,exinfo)));

        } catch (IOException e) {
            LOGGER.error("socket sendMessage error ： "+e.toString());
            throw new RuntimeException(e);
        }
    }
}
