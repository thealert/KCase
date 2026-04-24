package com.xiaoju.framework.handler;

import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.ExecRecordMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;

import java.util.concurrent.ConcurrentHashMap;

public class SessionRecordFactory {

    static ConcurrentHashMap<String, SessionRecordEntity> recordEntityMap = new ConcurrentHashMap<>();

    public static SessionRecordEntity getRoomByRoomID(String roomId){
        if (recordEntityMap.containsKey(roomId)){
            return recordEntityMap.get(roomId);
        }
        return null;
    }

    public static SessionRecordEntity getRoom(String roomId, Long caseId, TestCaseMapper caseMapper, CaseBackupMapper caseBackupMapper, Long recordId, ExecRecordMapper recordMapper, int previousVersionHistorySize) {

        if (recordEntityMap.containsKey(roomId)) {
            SessionRecordEntity roomEntity = recordEntityMap.get(roomId);
            roomEntity.setPreviousVersionHistorySize(previousVersionHistorySize);
            return roomEntity;
        } else {
            SessionRecordEntity roomEntity = new SessionRecordEntity(roomId, caseId, caseMapper, caseBackupMapper,recordId, recordMapper, previousVersionHistorySize);
            recordEntityMap.put(roomId, roomEntity);
            return roomEntity;
        }
    }

    public static void clearRoom(String roomId) {
        recordEntityMap.remove(roomId);
    }
}
