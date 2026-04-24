package com.xiaoju.framework.handler;

import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;

import java.util.concurrent.ConcurrentHashMap;

public class SessionRoomFactory {

    public static ConcurrentHashMap<String, SessionRoomEntity> roomEntityMap = new ConcurrentHashMap<>();

    public static SessionRoomEntity getRoom(String roomId, Long caseId, TestCaseMapper caseMapper, CaseBackupMapper caseBackupMapper, int previousVersionHistorySize) {
//        synchronized (roomId) { // todo：此处暂不确定是否有效，需要进行验证

        if (roomEntityMap.containsKey(roomId)) {
            SessionRoomEntity roomEntity = roomEntityMap.get(roomId);
            roomEntity.setPreviousVersionHistorySize(previousVersionHistorySize);
            return roomEntity;
        } else {
            SessionRoomEntity roomEntity = new SessionRoomEntity(roomId, caseId, caseMapper,caseBackupMapper, previousVersionHistorySize);
            roomEntityMap.put(roomId, roomEntity);
            return roomEntity;
        }

//        }
    }

    public static SessionRoomEntity GetSessionRoomEntity(String roomId){
        if (roomEntityMap.containsKey(roomId)) {
            return roomEntityMap.get(roomId);
        }
        return null;
    }

    public static void clearRoom(String roomId) {
        roomEntityMap.remove(roomId);
    }
}
