package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.BroadcastOperations;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.xiaoju.framework.util.JsonUtil;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutorService;

public class SessionLockIngressTask extends SessionIngressTask {
    PushMessage data;

    public SessionLockIngressTask(WebSocketSession session, SessionRoomEntity room, ExecutorService executorEgressService, PushMessage data) {
        super(session, room, executorEgressService);
        this.data = data;
    }

    @Override
    public void run()  {
        try {


            LOGGER.info(data.getMessage());
            ClientEntity clientEntity = getRoomFromClient(session);
            String roomId = clientEntity.getRoomId();
            Map<String, WebSocketSession> roomSessions = MyWebSocketHandler.roomSessionsMap.get(roomId);
            if (data.getMessage().equals("lock")) { // lock消息
                if (room.isLockedByClient()) {
                    //client.sendEvent("lock", PushMessage.builder().message("3").build()); // 当前已经lock了,后续可以发送详细锁住人信息

                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "3")));
                    return;
                } else {
                    room.clientLock(session);
                    //broadcastOperations.sendEvent("lock", client, PushMessage.builder().message("0").build());
                    //session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "0")));
                    for (WebSocketSession sessiontemp : roomSessions.values()) {

                        if (sessiontemp.getId() != session.getId())
                            sessiontemp.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "0")));

                    }
                }
            } else if (data.getMessage().equals("unlock")) {

                if (!room.isLockedByClient()) { // 当前已经unlock状态
                    //client.sendEvent("lock", PushMessage.builder().message("3").build()); // 当前已经lock了,后续可以发送详细锁住人信息

                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "3")));
                    LOGGER.info("Lock Message Send Lock state 3");

                    return;
                } else {
                    if (room.lockByClient(session)) { // 自己锁的
                        room.clientUnlock();
                        //broadcastOperations.sendEvent("lock", client, PushMessage.builder().message("1").build());
                        for (WebSocketSession sessiontemp : roomSessions.values()) {

                            if (sessiontemp.getId() != session.getId())
                                sessiontemp.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "1")));

                        }
                    } else {// 其他人锁的

                        session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "3")));
                        LOGGER.info("Lock Message Send Lock state 3 others");
                        //client.sendEvent("lock", PushMessage.builder().message("3").build()); // 当前已经lock了,后续可以发送详细锁住人信息

                        return;
                    }
                }
            }

            //client.sendEvent("lock", PushMessage.builder().message("2").build()); // 当前已经lock了,后续可以发送详细锁住人信息
            session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("lock", "2")));
            LOGGER.info("Lock Message Send Lock state 2");
            room.unlock();
        }catch (Exception e){
            throw new RuntimeException(e);
        }
    }
}
