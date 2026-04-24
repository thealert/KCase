package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.BroadcastOperations;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.flipkart.zjsonpatch.JsonDiff;
import org.springframework.web.socket.WebSocketSession;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ExecutorService;

public class SessionRecordClearIngressTask extends SessionIngressTask {

    public SessionRecordClearIngressTask(WebSocketSession session, SessionRoomEntity room, ExecutorService executorEgressService) {
        super(session, room, executorEgressService);
    }

    @Override
    public void run() {

        Map<String, WebSocketSession> roomsessions= MyWebSocketHandler.roomSessionsMap.get(room.getRoomId());
        //BroadcastOperations broadcastOperations = socketIOServer.getRoomOperations(room.getRoomId());

        String caseCurrent = room.getCaseContent();

        try {
            JsonNode caseObj = jsonMapper.readTree(caseCurrent);
            JsonNode caseTarget = caseObj.deepCopy();
            traverse(caseTarget);
            ArrayNode patchNotify = (ArrayNode) JsonDiff.asJson(caseObj, caseTarget);
            executorEgressService.submit(new SessionNotifyEgressTask("edit_notify_event", patchNotify.toString(), roomsessions));

            room.setCaseContent(caseTarget.toString());

        } catch (Exception e) {

        }
    }

    private void traverse(JsonNode caseObj) {
        Iterator<JsonNode> iterator = caseObj.iterator();

        while (iterator.hasNext()) {
            JsonNode n = iterator.next();
            if (n.size() > 0) {
                if (n.has("progress")) {
                    ((ObjectNode) n).remove("progress");
                }
                traverse(n);
            } else {
//                 System.out.println(n.toString());
            }
        }
    }
}
