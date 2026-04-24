package com.xiaoju.framework.handler;

import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.flipkart.zjsonpatch.JsonDiff;
import com.flipkart.zjsonpatch.JsonPatch;
import com.xiaoju.framework.entity.persistent.CaseBackup;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.util.BrotliUtils;
import com.xiaoju.framework.util.SeeeionUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.WebSocketSession;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.stream.Collectors;

import static com.flipkart.zjsonpatch.DiffFlags.ADD_ORIGINAL_VALUE_ON_REPLACE;
import static com.flipkart.zjsonpatch.DiffFlags.OMIT_MOVE_OPERATION;

public class SessionEditIngressTask extends SessionIngressTask {
    EditMessage data;

    CaseBackupMapper caseBackupMapper;

    TestCaseMapper caseMapper;


    public SessionEditIngressTask(WebSocketSession session, SessionRoomEntity room, ExecutorService executorEgressService, EditMessage data,CaseBackupMapper caseBackupMapper) {
        super(session, room, executorEgressService);
        this.data = data;
        this.caseBackupMapper=caseBackupMapper;
    }


    @Override
    public void run() {
        if(room == null)
        {
            LOGGER.warn("room is null,return ");
            return;
        }

        LOGGER.info(data.getPatch());
        ClientEntity clientEntity = getRoomFromClient(session);
        String roomId = clientEntity.getRoomId();
        Long recordId = clientEntity.getRecordId();
        //BroadcastOperations broadcastOperations = socketIOServer.getRoomOperations(roomId);
        Map<String, WebSocketSession> roomseesions=MyWebSocketHandler.roomSessionsMap.get(roomId);

        try {

            if(!room.lock())
            {
                LOGGER.warn("room get lock failed,return ");
                return;
            }
            LOGGER.info("get Lock");
            //ArrayNode patch = (ArrayNode) jsonMapper.readTree(data.getPatch());
            JsonNode roomContent = jsonMapper.readTree(room.getCaseContent());
            int serverCaseCurrentVersion = roomContent.get("base").asInt();
            int serverCaseExpectVersion = serverCaseCurrentVersion + 1;

//            ArrayNode patchNew = patchTraverse(patch);
//            ObjectNode basePatch = FACTORY.objectNode();
//            basePatch.put("op", "replace");
//            basePatch.put("path", "/base");
//            basePatch.put("value", serverCaseExpectVersion);
//            patchNew.add(basePatch);

            JsonNode roomContentNew;

//            if (serverCaseCurrentVersion > data.getCaseVersion()) { // 服务端版本大于前端
//
//                LOGGER.warn("version of case in memory is bigger than client. version is: " + roomContent.get("base").asInt() + ", client version: " + data.getCaseVersion());
//                roomContentNew = JsonPatch.apply(patchNew, roomContent);
//
//                ArrayNode patchAck = (ArrayNode) JsonDiff.asJson(jsonMapper.readTree(data.getCaseContent()), roomContentNew, EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));
//
//                executorEgressService.submit(new SessionAckEgressTask("edit_ack_event", patchAck.toString(), data.getTs().toString(),session));
//                executorEgressService.submit(new SessionNotifyExcludeEgressTask("edit_notify_event", patchNew.toString(), session, roomseesions));
////                    client.sendEvent("edit_ack_event", PushMessage.builder().message(patchAck.toString()).build(), PushMessage.builder().message(patchNew.toString()).build());
////                    broadcastOperations.sendEvent("edit_notify_event", client, PushMessage.builder().message(patchNew.toString()).build());
//            } else

            if(room.getDataVersion()>-1){

//                LOGGER.info("Version Compare: roomVersion={}, dataVersion={}, roomContent={}, dataContent={}",
//                        room.getDataVersion(), data.getCaseVersion(), room.getCaseContent(), data.getCaseContent());

                if((room.getDataVersion() > data.getCaseVersion()) && (room.getClientNum() > 1)){
                    LOGGER.info("进入版本落后处理逻辑 - 客户端版本: {}, Room版本: {}, 版本差距: {}",
                        data.getCaseVersion(), room.getDataVersion(), room.getDataVersion() - data.getCaseVersion());

                    JsonNode clientContentJson = jsonMapper.readTree(data.getCaseContent());
                    JsonNode roomCurrentContent = jsonMapper.readTree(room.getCaseContent());

                    ArrayNode allDiffPatches = (ArrayNode) JsonDiff.asJson(clientContentJson, roomCurrentContent,
                        EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));
                    LOGGER.info("客户端与当前Room的完整差异: {}", allDiffPatches.toString());

                    String baseVersionContent = room.getVersionContent(data.getCaseVersion());
                    if(baseVersionContent == null || baseVersionContent.isEmpty()) {
                        LOGGER.warn("缺少客户端版本快照，拒绝自动合并，clientVersion: {}", data.getCaseVersion());
                        rejectStaleEdit(clientContentJson, roomCurrentContent, "当前内容已更新，且缺少共同版本基线，请刷新后重试");
                        return;
                    }

                    JsonNode baseContent;
                    try {
                        baseContent = jsonMapper.readTree(baseVersionContent);
                    } catch (Exception e) {
                        LOGGER.warn("解析版本快照失败，拒绝自动合并: {}", e.getMessage());
                        rejectStaleEdit(clientContentJson, roomCurrentContent, "当前内容已更新，且无法定位共同版本基线，请刷新后重试");
                        return;
                    }

                    int baseVersion = baseContent.get("base").asInt();
                    if(baseVersion != data.getCaseVersion()) {
                        LOGGER.warn("Base版本({})与客户端版本({})不匹配，拒绝自动合并", baseVersion, data.getCaseVersion());
                        rejectStaleEdit(clientContentJson, roomCurrentContent, "当前内容已更新，您的修改基于旧版本，请同步最新内容后重试");
                        return;
                    }

                    ArrayNode clientPatches = (ArrayNode) JsonDiff.asJson(baseContent, clientContentJson,
                        EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));
                    ArrayNode otherClientsPatches = (ArrayNode) JsonDiff.asJson(baseContent, roomCurrentContent,
                        EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));

                    LOGGER.info("使用三方合并策略");
                    LOGGER.info("客户端patches: {}", clientPatches.toString());
                    LOGGER.info("其他客户端patches: {}", otherClientsPatches.toString());

                    ConflictCheckResult conflictCheck = checkPatchConflict(clientPatches, otherClientsPatches);

                    if(conflictCheck.hasConflict) {
                        LOGGER.warn("发现真正的编辑冲突，冲突路径: {}", conflictCheck.conflictPaths);
                        rejectStaleEdit(clientContentJson, roomCurrentContent,
                            "检测到编辑冲突（冲突节点：" + String.join(", ", conflictCheck.conflictPaths) + "），您的提交未自动合并");
                        return;
                    }

                    LOGGER.info("未发现路径冲突，尝试自动合并客户端变更");
                    try {
                        LOGGER.info("执行三方合并 - 从base({})合并到新版本", baseContent.get("base").asInt());
                        JsonNode mergedContent = JsonPatch.apply(otherClientsPatches, baseContent);
                        mergedContent = JsonPatch.apply(clientPatches, mergedContent);

                        ((ObjectNode) mergedContent).put("base", room.getDataVersion() + 1);

                        LOGGER.info("合并完成 - 新版本: {}", room.getDataVersion() + 1);

                        ArrayNode patchAck = (ArrayNode) JsonDiff.asJson(clientContentJson, mergedContent,
                            EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));
                        ArrayNode patchNotify = (ArrayNode) JsonDiff.asJson(roomCurrentContent, mergedContent,
                            EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));

                        patchAck = normalizeCopyOps(clientContentJson, patchAck);
                        patchNotify = normalizeCopyOps(roomCurrentContent, patchNotify);

                        LOGGER.info("Patch计算完成:");
                        LOGGER.info("  - 当前Room版本: v{}", room.getDataVersion());
                        LOGGER.info("  - 合并后版本: v{}", room.getDataVersion() + 1);
                        LOGGER.info("  - 发送给当前客户端的ack patch: {}", patchAck.toString());
                        LOGGER.info("  - 发送给其他客户端的notify patch: {}", patchNotify.toString());
                        LOGGER.info("  - 其他客户端数量: {}", roomseesions.size() - 1);

                        executorEgressService.submit(new SessionAckEgressTask("edit_ack_event", patchAck.toString(), data.getTs().toString(), session));
                        executorEgressService.submit(new SessionNotifyExcludeEgressTask("edit_notify_event", patchNotify.toString(), session, roomseesions));

                        room.cacheVersionContent(room.getCaseContent());
                        room.setCaseContent(mergedContent.toString());
                        room.setDataVersion(room.getDataVersion() + 1);

                        LOGGER.info("自动合并成功，新版本号: {}", room.getDataVersion());
                        roomContentNew = mergedContent;
                    } catch (Exception mergeEx) {
                        LOGGER.error("自动合并失败: {}", mergeEx.getMessage(), mergeEx);
                        rejectStaleEdit(clientContentJson, roomCurrentContent, "自动合并失败，请刷新数据后重试");
                        return;
                    }

                } else {
                    // 版本一致或单人编辑，走正常流程
                    room.cacheVersionContent(room.getCaseContent());

                    roomContentNew = processNormalEdit(data, roomContent, roomseesions);
                    room.setCaseContent(roomContentNew.toString());
                    room.setDataVersion(data.getCaseVersion() + 1);
                }
            } else {
                // 首次编辑或版本重置，走正常流程
                // 初始化历史版本
                room.cacheVersionContent(room.getCaseContent());
                
                roomContentNew = processNormalEdit(data, roomContent, roomseesions);
                room.setCaseContent(roomContentNew.toString());
                room.setDataVersion(data.getCaseVersion() + 1);
            }

            // 统一的备份逻辑
            if(roomContentNew != null) {
                /*异步备份到 back db*/
                if(null == recordId){
                    // 异步执行备份操作，避免阻塞主流程
                    final String contentToBackup = roomContentNew.toString();
                    final Long caseId = room.getCaseId();
                    final String creator = SeeeionUtil.getQueryParam(session,"user");
                    final Long recordIdForLog = recordId;
                    
                    executorEgressService.submit(() -> {
                        try {
                            CaseBackup caseBackup = new CaseBackup();
                            caseBackup.setCaseId(caseId);
                            caseBackup.setRecordContent("");
                            caseBackup.setCreator(creator);
                            caseBackup.setExtra("autosave");
                            caseBackup.setCaseContentUseBlob(contentToBackup);
                            
                            int ret = caseBackupMapper.insert(caseBackup);
                            if(ret < 1){
                                LOGGER.error("备份数据失败，caseid: " + caseId + "," + recordIdForLog);
                            }
                            else{
                                LOGGER.info("备份数据成功，caseid: " + caseId + "," + recordIdForLog);
                            }
                        } catch (Exception e) {
                            LOGGER.error("异步备份数据异常，caseid: " + caseId, e);
                        }
                    });
                }else{
                    SessionRecordEntity recordEntity=SessionRecordFactory.getRoomByRoomID(roomId);
                    if(null!=recordEntity){
                        // 调用 synDB 并获取返回的统计信息

                        JSONObject recordInfo = recordEntity.synDB(session);
                        
                        // 将统计信息直接发送给前端，避免前端再次发起 HTTP 请求
                        executorEgressService.submit(new SessionAckEgressTask("reload_record_event", recordInfo.toJSONString(), session));
                        executorEgressService.submit(new SessionNotifyExcludeEgressTask("reload_notify_record_event", recordInfo.toJSONString(), session, roomseesions));

                    }
                }
            }



        } catch (Exception e) {
            LOGGER.error("json 操作失败。"+e.toString());
            executorEgressService.submit(new SessionAckEgressTask("warning", "可能存在编辑冲突，请刷新重试.", session));
//            client.sendEvent("warning", PushMessage.builder().message("可能存在编辑冲突，请刷新重试.").build());
        } finally {
            room.unlock();
            LOGGER.info("release Lock");
        }
    }

    /**
     * 正常编辑流程处理
     */
    private JsonNode processNormalEdit(EditMessage data, JsonNode roomContent, Map<String, WebSocketSession> roomseesions) throws Exception {
        //LOGGER.warn("version of case in memory is smaller than client. version is: " + roomContent.get("base").asInt() + ", client version: " + data.getCaseVersion());
        String clientExceptContent = data.getCaseContent().replace("\"base\":" + data.getCaseVersion(), "\"base\":" + (data.getCaseVersion() + 1));
        JsonNode roomContentNew = jsonMapper.readTree(clientExceptContent);

                ArrayNode patchNotify = (ArrayNode) JsonDiff.asJson(roomContent, jsonMapper.readTree(clientExceptContent), EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));
                patchNotify = normalizeCopyOps(roomContent, patchNotify);
        executorEgressService.submit(new SessionAckEgressTask("edit_ack_event", "[[{\"op\":\"replace\",\"path\":\"/base\",\"value\":" + (data.getCaseVersion() + 1) + "}]]",data.getTs().toString(), session));
        executorEgressService.submit(new SessionNotifyExcludeEgressTask("edit_notify_event", patchNotify.toString(), session, roomseesions));
        
        return roomContentNew;
    }

    private void rejectStaleEdit(JsonNode clientContentJson, JsonNode roomCurrentContent, String message) throws Exception {
        ArrayNode patchNotifyBak = (ArrayNode) JsonDiff.asJson(clientContentJson, roomCurrentContent,
            EnumSet.of(ADD_ORIGINAL_VALUE_ON_REPLACE, OMIT_MOVE_OPERATION));
        patchNotifyBak = normalizeCopyOps(clientContentJson, patchNotifyBak);
        executorEgressService.submit(new SessionAckEgressTask("edit_ack_event", patchNotifyBak.toString(), data.getTs().toString(), session));
        Thread.sleep(500);
        executorEgressService.submit(new SessionAckEgressTask("notify_msg", message, session));
    }

    /**
     * 将 zjsonpatch 产出的 copy 操作转换为 add/replace，避免客户端不支持 copy 导致同步失败。
     */
    private ArrayNode normalizeCopyOps(JsonNode sourceContent, ArrayNode patches) {
        if (patches == null || patches.size() == 0) {
            return patches;
        }
        ArrayNode normalized = FACTORY.arrayNode();
        JsonNode working = sourceContent == null ? FACTORY.objectNode() : sourceContent.deepCopy();
        for (JsonNode patch : patches) {
            String op = patch.has("op") ? patch.get("op").asText() : "";
            if (!"copy".equals(op)) {
                normalized.add(patch);
                try {
                    ArrayNode single = FACTORY.arrayNode();
                    single.add(patch);
                    working = JsonPatch.apply(single, working);
                } catch (Exception ignore) {
                    // 忽略模拟应用失败，不影响后续转换
                }
                continue;
            }

            String fromPath = patch.has("from") ? patch.get("from").asText() : "";
            String targetPath = patch.has("path") ? patch.get("path").asText() : "";
            JsonNode copiedValue = working.at(fromPath);
            if (copiedValue == null || copiedValue.isMissingNode()) {
                continue;
            }

            ObjectNode converted = FACTORY.objectNode();
            converted.put("op", working.at(targetPath).isMissingNode() ? "add" : "replace");
            converted.put("path", targetPath);
            converted.set("value", copiedValue.deepCopy());
            normalized.add(converted);
            try {
                ArrayNode single = FACTORY.arrayNode();
                single.add(converted);
                working = JsonPatch.apply(single, working);
            } catch (Exception ignore) {
                // 忽略模拟应用失败，不影响后续转换
            }
        }
        return normalized;
    }

    /**
     * 检查patch是否存在冲突
     * @param clientPatches 客户端相对于base的patch
     * @param otherClientsPatches 其他客户端相对于base的patch
     * @return 冲突检查结果
     */
    private ConflictCheckResult checkPatchConflict(ArrayNode clientPatches, ArrayNode otherClientsPatches) {
        ConflictCheckResult result = new ConflictCheckResult();
        
        // 提取所有patch的路径（忽略/base路径）
        Set<String> clientPaths = extractPatchPaths(clientPatches);
        Set<String> otherPaths = extractPatchPaths(otherClientsPatches);
        
        // 检查是否有路径冲突（相同路径或父子路径关系）
        for(String clientPath : clientPaths) {
            for(String otherPath : otherPaths) {
                if(isPathConflict(clientPath, otherPath)) {
                    result.hasConflict = true;
                    result.conflictPaths.add(clientPath);
                    LOGGER.warn("检测到路径冲突: 客户端路径={}, 其他客户端路径={}", clientPath, otherPath);
                }
            }
        }
        
        return result;
    }

    /**
     * 提取patch中的所有路径
     */
    private Set<String> extractPatchPaths(ArrayNode patches) {
        Set<String> paths = new HashSet<>();
        for(JsonNode patch : patches) {
            String path = patch.get("path").asText();
            // 忽略base路径
            if(!"/base".equals(path)) {
                paths.add(path);
            }
        }
        return paths;
    }

    /**
     * 判断两个路径是否冲突
     * 冲突定义：完全相同，或存在父子关系
     */
    private boolean isPathConflict(String path1, String path2) {
        // 路径完全相同
        if(path1.equals(path2)) {
            return true;
        }
        
        // 检查父子关系：一个路径是另一个的前缀
        // 例如 /root/children/0 和 /root/children/0/data 存在冲突
        if(path1.startsWith(path2 + "/") || path2.startsWith(path1 + "/")) {
            return true;
        }
        
        return false;
    }

    /**
     * 应用patches并更新base版本
     */
    private JsonNode applyPatchesWithBaseUpdate(JsonNode content, ArrayNode patches, int newBase) throws Exception {
        // 先应用客户端的patches
        JsonNode result = JsonPatch.apply(patches, content);
        
        // 更新base版本
        if(result.isObject()) {
            ((ObjectNode) result).put("base", newBase);
        }
        
        return result;
    }

    /**
     * 冲突检查结果
     */
    private static class ConflictCheckResult {
        boolean hasConflict = false;
        Set<String> conflictPaths = new HashSet<>();
    }

}
