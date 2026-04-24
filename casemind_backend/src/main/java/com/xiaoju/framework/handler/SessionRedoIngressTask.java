package com.xiaoju.framework.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.flipkart.zjsonpatch.CompatibilityFlags;
import com.flipkart.zjsonpatch.JsonPatch;
import org.springframework.web.socket.WebSocketSession;

import java.util.EnumSet;
import java.util.Map;
import java.util.concurrent.ExecutorService;

import static com.flipkart.zjsonpatch.CompatibilityFlags.*;

public class SessionRedoIngressTask extends SessionIngressTask {
    PushMessage data;

    public SessionRedoIngressTask(WebSocketSession session, SessionRoomEntity room, ExecutorService executorEgressService, PushMessage data) {
        super(session, room, executorEgressService);
        this.data = data;
    }
    @Override
    public void run() {
        room.lock();
        LOGGER.info(data.getMessage());
        try {
            ArrayNode patch = (ArrayNode) jsonMapper.readTree(data.getMessage());
            JsonNode roomContent = jsonMapper.readTree(room.getCaseContent());
            EnumSet<CompatibilityFlags> flags = CompatibilityFlags.defaults();
            flags.add(MISSING_VALUES_AS_NULLS);
            flags.add(ALLOW_MISSING_TARGET_OBJECT_ON_REPLACE);
            flags.add(REMOVE_NONE_EXISTING_ARRAY_ELEMENT);
            JsonNode roomContentNew = JsonPatch.apply(patch, roomContent, flags);
            room.setCaseContent(roomContentNew.toString());

            ClientEntity clientEntity = getRoomFromClient(session);
            String roomId = clientEntity.getRoomId();

            LOGGER.info("get redo info");

            Map<String, WebSocketSession> roomseesions=MyWebSocketHandler.roomSessionsMap.get(roomId);
            //executorEgressService.submit(new SessionNotifyExcludeEgressTask("redo", data.getMessage(), session,roomseesions));
            executorEgressService.submit(new SessionNotifyEgressTask("redo", data.getMessage(), roomseesions));

        } catch (Exception e) {
            LOGGER.error("redo error");

        } finally {
            room.unlock();
        }

    }
}