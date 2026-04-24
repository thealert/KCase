package com.xiaoju.framework.handler;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.flipkart.zjsonpatch.JsonDiff;
import com.flipkart.zjsonpatch.JsonPatch;
import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.persistent.ExecRecord;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.entity.xmind.IntCount;
import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.ExecRecordMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.util.SeeeionUtil;
import com.xiaoju.framework.util.TreeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Objects;

import static com.xiaoju.framework.constants.SystemConstant.COMMA;

public class SessionRecordEntity extends SessionRoomEntity {
    Long recordId;

    ExecRecord record;
//    ExecRecord execRecord;
    ExecRecordMapper recordMapper;
    
    // 缓存：圈选执行记录的基准状态（用户打开时的初始状态，用于三方合并）
    private JSONObject baseRecordCase;
    
    // 缓存：构造时数据库中的完整用例状态（三方合并的基准）
    private JSONObject baseDbCase;
    
    // 性能优化：缓存节点映射，避免重复构建
    private Map<String, JSONObject> baseRecordNodeMap;
    private Map<String, JSONObject> baseDbNodeMap;
    
    // 快速路径优化：缓存上一次的 curCase，用于快速判断是否有变更
    private String lastCurCaseContent = null;

    protected static final Logger LOGGER = LoggerFactory.getLogger(SessionRecordEntity.class);

    public SessionRecordEntity(String roomId, Long caseId, TestCaseMapper caseMapper, CaseBackupMapper caseBackupMapper,Long recordId, ExecRecordMapper execRecordMapper, int previousVersionHistorySize) {
        super(roomId, caseId, caseMapper,caseBackupMapper, previousVersionHistorySize);
        this.recordId = recordId;
        this.record=execRecordMapper.selectOne(recordId);
        
        // 缓存构造时的完整数据库用例（作为三方合并的基准）
        TestCase testCaseBase = caseMapper.selectOne(caseId);

        // 加载时立即检测并持久化去重结果，确保数据库不残留重复 ID
        String originalContent = testCaseBase.getCaseContent();
        String dedupContent = TreeUtil.deduplicateCaseContent(originalContent);
        if (!dedupContent.equals(originalContent)) {
            LOGGER.warn("SessionRecordEntity 初始化：检测到重复节点ID，已自动修复并回写数据库, caseId: {}", caseId);
            testCaseBase.setCaseContent(dedupContent);
            testCaseBase.setGmtModified(new Date(System.currentTimeMillis()));
            caseMapper.update(testCaseBase);
        }

        this.baseDbCase = JSONObject.parseObject(testCaseBase.getCaseContent());

        String recordContent = mergeRecord(recordId, testCaseBase.getCaseContent(), execRecordMapper);
        testCase.setCaseContent(recordContent);
        testCase.setGroupId(recordId);
        this.recordMapper = execRecordMapper;
        
        // 在构造时缓存基准状态（去除 progress 后的圈选记录）
        // 这个状态在整个会话期间不会改变，用于计算用户的真实修改
        this.baseRecordCase = TreeUtil.removeProgressRecursively(recordContent);
        
        // 性能优化：预先构建并缓存节点映射
        JSONObject baseRecordRoot = this.baseRecordCase.getJSONObject("root");
        JSONObject baseDbRoot = this.baseDbCase.getJSONObject("root");
        if (baseRecordRoot != null) {
            this.baseRecordNodeMap = buildNodeMap(baseRecordRoot);
        }
        if (baseDbRoot != null) {
            this.baseDbNodeMap = buildNodeMap(baseDbRoot);
        }
        
        LOGGER.info("已缓存 baseRecordCase、baseDbCase 和节点映射，用于后续增量同步");
    }

    public void mergeCaseToRecord(Long recordId,String content,ExecRecordMapper execRecordMapper){
        String recordContent = mergeRecord(recordId, content, execRecordMapper);
        testCase.setCaseContent(recordContent);
    }

    @Override
    public JSONObject synDB(WebSocketSession client){
        testCase.setGmtModified(new Date(System.currentTimeMillis()));
        String user = SeeeionUtil.getQueryParam(client,"user");
        ExecRecord record = recordMapper.selectOne(Long.valueOf(SeeeionUtil.getQueryParam(client,"recordId")));

        if (record == null) {
            throw new CaseServerException("执行任务不存在", StatusCode.NOT_FOUND_ENTITY);
        }



        JSONObject jsonObject = TreeUtil.parse(testCase.getCaseContent());
        JSONObject jsonProgress = jsonObject.getJSONObject("progress");
        JSONObject jsonNote= jsonObject.getJSONObject("note");
        Integer totalCount = jsonObject.getInteger("totalCount");
        Integer passCount = jsonObject.getInteger("passCount");
        Integer failCount = jsonObject.getInteger("failCount");
        Integer blockCount = jsonObject.getInteger("blockCount");
        Integer successCount = jsonObject.getInteger("successCount");
        Integer ignoreCount = jsonObject.getInteger("ignoreCount");

//        TestCase testCaseBase = caseMapper.selectOne(Long.valueOf(SeeeionUtil.getQueryParam(client,"caseId")));
//        JSONObject testCaseDBjo=JSONObject.parseObject(testCaseBase.getCaseContent());
//        JSONObject testCasejo=JSONObject.parseObject(testCase.getCaseContent());
//        TreeUtil.mergeNoteCase(testCaseDBjo.getJSONObject("root"),jsonNote,new IntCount(jsonNote.size()));
//        TreeUtil.mergeNoteCase(testCasejo.getJSONObject("root"),jsonNote,new IntCount(jsonNote.size()));
//        LOGGER.info(testCaseDBjo.toString());
//        LOGGER.info(testCasejo.toString());


        List<String> names = Arrays.stream(record.getExecutors().split(COMMA)).filter(e->!StringUtils.isEmpty(e)).collect(Collectors.toList());
        long count = names.stream().filter(e -> e.equals(user)).count();

        if (count == 0) {
            names.add(user);
        }

        record.setExecutors(String.join(",", names));
        record.setModifier(user);
        record.setGmtModified(new Date(System.currentTimeMillis()));
        record.setCaseContent(jsonProgress.toJSONString());
        //record.setNoteContent(jsonNote.toJSONString());
        record.setFailCount(failCount);
        record.setBlockCount(blockCount);
        record.setIgnoreCount(ignoreCount);
        record.setPassCount(passCount);
        record.setTotalCount(totalCount);
        record.setSuccessCount(successCount);
        recordMapper.update(record);

        LOGGER.info(Thread.currentThread().getName() + ": 数据库用例记录更新。record: " + record.getCaseContent());
        
        // 返回完整的统计信息，供 reload_record_event 使用
        JSONObject recordInfo = new JSONObject();

        TestCase testCaseBase = caseMapper.selectOne(record.getCaseId());
        JSONObject curCase=TreeUtil.removeProgressRecursively(testCase.getCaseContent());
        JSONObject currentDbCase=JSONObject.parseObject(testCaseBase.getCaseContent());

//        LOGGER.info("curCase Info "+curCase.toJSONString());
//        LOGGER.info("currentDbCase Info"+currentDbCase.toJSONString());
//
        // 快速路径优化：先判断 curCase 是否发生变化
        String curCaseContent = curCase.toJSONString();
        if (lastCurCaseContent != null && lastCurCaseContent.equals(curCaseContent)) {
            LOGGER.info("快速路径：curCase 内容未变化，跳过变更检测");
            // 内容完全相同，无需处理
        } else {
            // 内容有变化，进行详细的变更检测和合并
            LOGGER.debug("curCase 内容已变化，进行变更检测");
            
            // 使用基于节点 ID 的智能合并，而不是基于数组索引的 JsonPatch
            // 原因：curCase（圈选）和 baseDbCase（完整）的数组索引不一致
            try {
                JSONObject curRoot = curCase.getJSONObject("root");
                
                if (curRoot != null && baseRecordCase != null && baseDbCase != null) {
                    JSONObject baseRecordRoot = baseRecordCase.getJSONObject("root");
                    JSONObject baseDbRoot = baseDbCase.getJSONObject("root");
                    
                    if (baseRecordRoot == null || baseDbRoot == null) {
                        LOGGER.warn("baseRecordCase 或 baseDbCase 的 root 节点为空，跳过增量同步");
                    } else {
                        LOGGER.debug("使用基于节点 ID 的智能合并");
                        
                        // 收集用户的修改（基于节点 ID，而不是数组索引）
                        Map<String, NodeChange> userChanges = collectNodeChanges(baseRecordRoot, curRoot);
                        
                        if (!userChanges.isEmpty()) {
                            LOGGER.info("检测到用户修改的节点数量: " + userChanges.size());
                            
                            // 重要：直接在 baseDbRoot 上修改，不要深拷贝
                            // 因为 baseDbNodeMap 中的节点引用指向 baseDbRoot
                            applyNodeChanges(baseDbRoot, userChanges);
                            
                            // 检查当前数据库是否被其他会话修改过（暂时简化，后续可以增强）
                            JSONObject currentDbRoot = currentDbCase.getJSONObject("root");
                            
                            // 更新数据库（使用修改后的 baseDbCase）
                            currentDbCase.put("root", baseDbRoot);
                            String mergedContent = TreeUtil.deduplicateCaseContent(currentDbCase.toJSONString());
                            testCaseBase.setCaseContent(mergedContent);
                            testCaseBase.setModifier(user);
                            testCaseBase.setGmtModified(new Date(System.currentTimeMillis()));
                            caseMapper.update(testCaseBase);
                            
                            // 注意：baseDbCase 已经被修改了，需要深拷贝更新缓存
                            this.baseDbCase = JSONObject.parseObject(currentDbCase.toJSONString());
                            this.baseRecordCase = JSONObject.parseObject(curCase.toJSONString());
                            
                            // 性能优化：同步更新缓存的节点映射
                            // baseDbNodeMap 已经在 applyNodeChanges 中增量更新了
                            // 但因为我们重新深拷贝了 baseDbCase，需要重建 baseDbNodeMap
                            JSONObject newBaseDbRoot = this.baseDbCase.getJSONObject("root");
                            if (newBaseDbRoot != null) {
                                this.baseDbNodeMap = buildNodeMap(newBaseDbRoot);
                            }
                            
                            // 只需要重建 baseRecordNodeMap
                            JSONObject newBaseRecordRoot = this.baseRecordCase.getJSONObject("root");
                            if (newBaseRecordRoot != null) {
                                this.baseRecordNodeMap = buildNodeMap(newBaseRecordRoot);
                            }
                            
                            // 更新快速路径缓存
                            this.lastCurCaseContent = curCaseContent;
                            
                            LOGGER.info("已通过智能合并更新数据库，并更新缓存");
                        } else {
                            LOGGER.info("用户无修改，无需更新数据库");
                            // 即使没有变更，也要更新快速路径缓存
                            this.lastCurCaseContent = curCaseContent;
                        }
                    }
                }
            } catch (Exception e) {
                LOGGER.error("智能合并应用异常，跳过用例内容同步", e);
            }
        }
        
        // 基本信息
        recordInfo.put("id", record.getId());
        recordInfo.put("caseId", record.getCaseId());
        recordInfo.put("title", record.getTitle());
        recordInfo.put("requirementIds", testCase.getRequirementId());
        
        // 时间信息（如果不是默认时间）
        if (record.getExpectStartTime() != null && record.getExpectStartTime().getTime() != 0) {
            recordInfo.put("expectStartTime", record.getExpectStartTime());
        }
        if (record.getExpectEndTime() != null && record.getExpectEndTime().getTime() != 0) {
            recordInfo.put("expectEndTime", record.getExpectEndTime());
        }
        
        // 统计信息
        recordInfo.put("totalCount", totalCount);
        recordInfo.put("passCount", passCount);
        recordInfo.put("bugNum", failCount); // 注意：前端使用 bugNum 字段名
        recordInfo.put("failCount", failCount);
        recordInfo.put("blockCount", blockCount);
        recordInfo.put("successCount", successCount);
        recordInfo.put("ignoreCount", ignoreCount);
        
        // 计算通过率
        if (totalCount != null && totalCount > 0 && successCount != null) {
            double passRate = (double) successCount * 100 / (double) totalCount;
            recordInfo.put("passRate", Math.round(passRate * 100.0) / 100.0); // 保留两位小数
        } else {
            recordInfo.put("passRate", 0);
        }
        
        return recordInfo;
    }

    @Override
    public void removeClient(WebSocketSession client) {
        this.clientMap.remove(client.getId());
        this.socketSessionList.remove(client);
        LOGGER.info("remove client, current user number:" + this.clientMap.size());
        testCase.setGmtModified(new Date(System.currentTimeMillis()));
        synDB(client);
    }

    private String mergeRecord(Long recordId, String caseContentStr, ExecRecordMapper execRecordMapper) {

        String retCaseContent;

        ExecRecord record = execRecordMapper.selectOne(recordId);
        if (record == null) {
            //todo: 在controller层应该已经创建了任务，因此这里一定不为空
            LOGGER.error(Thread.currentThread().getName() + ": 当前用例执行者初次打开任务");
        }

        String recordContent = record.getCaseContent();
        JSONObject recordObj = new JSONObject();
        if (StringUtils.isEmpty(recordContent)) {
            // 其实当前任务还没有任何执行记录
            LOGGER.info(Thread.currentThread().getName() + ": first create record.");
        } else if (recordContent.startsWith("[{")) {
            JSONArray jsonArray = JSON.parseArray(recordContent);
            for (Object o : jsonArray) {
                recordObj.put(((JSONObject) o).getString("id"), ((JSONObject) o).getLong("progress"));
            }
        } else {
            recordObj = JSON.parseObject(recordContent);
        }
        String noteContent = record.getNoteContent();
        JSONObject noteObj = new JSONObject();
        if (StringUtils.isEmpty(noteContent)) {

        }else if (noteContent.startsWith("[{")) {
            JSONArray jsonArray = JSON.parseArray(noteContent);
            for (Object o : jsonArray) {
                noteObj.put(((JSONObject) o).getString("id"), ((JSONObject) o).getLong("note"));
            }
        } else {
            noteObj = JSON.parseObject(noteContent);
        }

        IntCount ExecCount = new IntCount(recordObj.size());
        // 如果当前record是圈选了部分的圈选用例
        if (!StringUtils.isEmpty(record.getChooseContent()) && !record.getChooseContent().contains("\"priority\":[\"0\"]")) {
            Map<String, List<String>> chosen = JSON.parseObject(record.getChooseContent(), Map.class);

            JSONObject caseContent = JSON.parseObject(caseContentStr);
            JSONObject caseRoot = caseContent.getJSONObject("root");

            int dupFixed = TreeUtil.deduplicateNodeIds(caseRoot);
            if (dupFixed > 0) {
                LOGGER.warn("mergeRecord 圈选路径检测到 {} 个重复节点ID已自动修复, caseId: {}", dupFixed, this.caseId);
            }

            Stack<JSONObject> objCheck = new Stack<>();

            Stack<IntCount> iCheck = new Stack<>();
            objCheck.push(caseRoot);

            List<String> priority = chosen.get("priority");
            List<String> resource = chosen.get("resource");
            //获取对应级别用例
            if (!CollectionUtils.isEmpty(priority)) {
                TreeUtil.getPriority(objCheck, iCheck, caseRoot, priority);
            }
            if (!CollectionUtils.isEmpty(resource)) {
                TreeUtil.getChosenCase(caseRoot, new HashSet<>(resource), "resource");
            }

            TreeUtil.mergeExecRecord(caseContent.getJSONObject("root"), recordObj, ExecCount);
            retCaseContent = caseContent.toJSONString();
        } else {
            // 如果是全部的，那么直接把testcase 给 merge过来
            JSONObject caseContent = JSON.parseObject(caseContentStr);

            int dupFixed = TreeUtil.deduplicateNodeIds(caseContent.getJSONObject("root"));
            if (dupFixed > 0) {
                LOGGER.warn("mergeRecord 全量路径检测到 {} 个重复节点ID已自动修复, caseId: {}", dupFixed, this.caseId);
            }

            TreeUtil.mergeExecRecord(caseContent.getJSONObject("root"), recordObj, ExecCount);
            retCaseContent = caseContent.toJSONString();
        }
        //添加备注信息
        if( noteObj.size() > 0 ){
            JSONObject caseContent = JSON.parseObject(retCaseContent);
            TreeUtil.mergeNoteRecord(caseContent.getJSONObject("root"),noteObj,new IntCount(noteObj.size()));
            retCaseContent = caseContent.toJSONString();
        }

        return retCaseContent;
    }

    /**
     * 节点变更记录类
     */
    private static class NodeChange {
        String nodeId;
        String operation; // "add", "update", "delete", "move"
        JSONObject nodeData; // 节点的 data 对象（add/update/move 时有值）
        JSONArray children; // 节点的 children（add 时有值，当前不再直接使用）
        String parentId;    // 新父节点 ID（add/move 时有值）
        String oldParentId; // 旧父节点 ID（move 时有值，用于从原位置删除）
        int insertIndex = -1; // 新节点在当前用例父 children 中的位置索引（add 时有值）

        NodeChange(String nodeId, String operation) {
            this.nodeId = nodeId;
            this.operation = operation;
        }
    }

    /**
     * 构建节点 ID 到其在父 children 中索引的映射
     * 用于新增节点时按原始顺序插入，而非追加到末尾
     */
    private Map<String, Integer> buildIndexMap(JSONObject node) {
        Map<String, Integer> map = new HashMap<>();
        buildIndexMapRecursive(node, map);
        return map;
    }

    private void buildIndexMapRecursive(JSONObject node, Map<String, Integer> map) {
        if (node == null) return;
        JSONArray children = node.getJSONArray("children");
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Object child = children.get(i);
                if (child instanceof JSONObject) {
                    JSONObject childObj = (JSONObject) child;
                    JSONObject data = childObj.getJSONObject("data");
                    if (data != null && data.containsKey("id")) {
                        map.put(data.getString("id"), i);
                    }
                    buildIndexMapRecursive(childObj, map);
                }
            }
        }
    }

    /**
     * 构建节点 ID 到父节点 ID 的映射（用于检测拖拽移位）
     */
    private Map<String, String> buildParentMap(JSONObject node, String parentId) {
        Map<String, String> map = new HashMap<>();
        if (node == null) return map;

        JSONObject data = node.getJSONObject("data");
        if (data != null && data.containsKey("id")) {
            String nodeId = data.getString("id");
            map.put(nodeId, parentId); // null parentId 表示 root 子节点
            JSONArray children = node.getJSONArray("children");
            if (children != null) {
                for (int i = 0; i < children.size(); i++) {
                    Object child = children.get(i);
                    if (child instanceof JSONObject) {
                        map.putAll(buildParentMap((JSONObject) child, nodeId));
                    }
                }
            }
        }
        return map;
    }

    /**
     * 收集从 baseNode 到 currentNode 的所有节点变更（基于节点 ID）
     * 支持检测：新增、删除、数据修改、拖拽移位（父节点变化）
     */
    private Map<String, NodeChange> collectNodeChanges(JSONObject baseNode, JSONObject currentNode) {
        Map<String, NodeChange> changes = new HashMap<>();

        Map<String, JSONObject> baseNodeMap = this.baseRecordNodeMap;
        if (baseNodeMap == null) {
            baseNodeMap = buildNodeMap(baseNode);
        }

        Map<String, JSONObject> currentNodeMap = buildNodeMap(currentNode);

        // 构建父节点映射，用于检测拖拽导致的层级变化
        Map<String, String> baseParentMap = buildParentMap(baseNode, null);
        Map<String, String> currentParentMap = buildParentMap(currentNode, null);
        // 构建节点在其父 children 中的索引映射，用于新增/移动节点时保留位置顺序
        Map<String, Integer> currentIndexMap = buildIndexMap(currentNode);
        Map<String, Integer> baseIndexMap = buildIndexMap(baseNode);

        // 检测新增、修改、移位
        for (Map.Entry<String, JSONObject> entry : currentNodeMap.entrySet()) {
            String nodeId = entry.getKey();
            JSONObject currentNodeObj = entry.getValue();
            JSONObject baseNodeObj = baseNodeMap.get(nodeId);

            if (baseNodeObj == null) {
                // 新增节点
                NodeChange change = new NodeChange(nodeId, "add");
                change.nodeData = currentNodeObj.getJSONObject("data");
                change.children = currentNodeObj.getJSONArray("children");
                change.parentId = currentParentMap.get(nodeId);
                change.insertIndex = currentIndexMap.getOrDefault(nodeId, -1);
                changes.put(nodeId, change);
                LOGGER.debug("检测到新增节点: " + nodeId);
            } else {
                JSONObject baseData = baseNodeObj.getJSONObject("data");
                JSONObject currentData = currentNodeObj.getJSONObject("data");

                boolean dataChanged = baseData != currentData
                        && !baseData.toJSONString().equals(currentData.toJSONString());

                String baseParent = baseParentMap.get(nodeId);
                String currentParent = currentParentMap.get(nodeId);
                boolean parentChanged = !Objects.equals(baseParent, currentParent);

                int baseIdx = baseIndexMap.getOrDefault(nodeId, -1);
                int currentIdx = currentIndexMap.getOrDefault(nodeId, -1);
                boolean indexChanged = baseIdx != currentIdx;

                if (parentChanged) {
                    // 节点被拖拽到了不同的父节点下
                    NodeChange change = new NodeChange(nodeId, "move");
                    change.nodeData = dataChanged ? currentData : baseData;
                    change.parentId = currentParent;
                    change.oldParentId = baseParent;
                    change.insertIndex = currentIdx;
                    changes.put(nodeId, change);
                    LOGGER.info("检测到节点移位: " + nodeId + "，从父节点 " + baseParent + " 移动到 " + currentParent);
                } else if (indexChanged) {
                    // 同一父节点内顺序变化（同层拖拽换位）
                    NodeChange change = new NodeChange(nodeId, "reorder");
                    change.nodeData = dataChanged ? currentData : null;
                    change.parentId = currentParent;
                    change.insertIndex = currentIdx;
                    changes.put(nodeId, change);
                    LOGGER.debug("检测到节点同层换位: " + nodeId + "，索引从 " + baseIdx + " 变为 " + currentIdx);
                } else if (dataChanged) {
                    NodeChange change = new NodeChange(nodeId, "update");
                    change.nodeData = currentData;
                    changes.put(nodeId, change);
                    LOGGER.debug("检测到修改节点: " + nodeId);
                }
            }
        }

        // 检测删除的节点
        for (String nodeId : baseNodeMap.keySet()) {
            if (!currentNodeMap.containsKey(nodeId)) {
                NodeChange change = new NodeChange(nodeId, "delete");
                changes.put(nodeId, change);
                LOGGER.debug("检测到删除节点: " + nodeId);
            }
        }

        return changes;
    }

    /**
     * 构建节点 ID 到节点对象的映射
     */
    private Map<String, JSONObject> buildNodeMap(JSONObject node) {
        Map<String, JSONObject> map = new HashMap<>();
        if (node == null) {
            return map;
        }
        
        JSONObject data = node.getJSONObject("data");
        if (data != null && data.containsKey("id")) {
            String nodeId = data.getString("id");
            map.put(nodeId, node);
        }
        
        JSONArray children = node.getJSONArray("children");
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Object child = children.get(i);
                if (child instanceof JSONObject) {
                    map.putAll(buildNodeMap((JSONObject) child));
                }
            }
        }
        
        return map;
    }

    /**
     * 查找节点的父节点 ID
     */
    private String findParentId(JSONObject root, String targetNodeId) {
        return findParentIdRecursive(root, targetNodeId, null);
    }

    private String findParentIdRecursive(JSONObject node, String targetNodeId, String parentId) {
        if (node == null) {
            return null;
        }
        
        JSONObject data = node.getJSONObject("data");
        if (data != null && data.containsKey("id")) {
            String nodeId = data.getString("id");
            if (nodeId.equals(targetNodeId)) {
                return parentId;
            }
            
            // 递归查找子节点
            JSONArray children = node.getJSONArray("children");
            if (children != null) {
                for (int i = 0; i < children.size(); i++) {
                    Object child = children.get(i);
                    if (child instanceof JSONObject) {
                        String result = findParentIdRecursive((JSONObject) child, targetNodeId, nodeId);
                        if (result != null) {
                            return result;
                        }
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * 将节点变更应用到目标树
     * 性能优化：使用缓存的 baseDbNodeMap
     *
     * 注意：添加新节点时必须使用空 children 数组（不直接复用 change.children 引用）。
     * 原因：collectNodeChanges 会把父节点及其所有子节点都单独记录为 "add" NodeChange，
     * 如果父节点的 newNode.children 直接使用 change.children（来自 curCase 的同一对象引用），
     * 后续处理子节点的 NodeChange 时会再次将子节点追加进同一数组，导致子节点重复。
     * FastJSON 序列化时检测到相同对象实例出现两次，就会产生 {"$ref":"..."} 脏数据。
     * 正确做法：新节点的 children 初始化为空，由各子节点的 NodeChange 依次添加，
     * 使用多轮迭代确保父节点先于子节点被处理。
     */
    private void applyNodeChanges(JSONObject targetRoot, Map<String, NodeChange> changes) {
        // 使用缓存的节点映射（同时作为本次处理的工作 map）
        Map<String, JSONObject> targetNodeMap = this.baseDbNodeMap;
        if (targetNodeMap == null) {
            targetNodeMap = buildNodeMap(targetRoot);
        }

        // 先处理 update / delete / move（无严格顺序依赖）
        for (NodeChange change : changes.values()) {
            try {
                if ("update".equals(change.operation)) {
                    JSONObject targetNode = targetNodeMap.get(change.nodeId);
                    if (targetNode != null) {
                        if (change.nodeData != null) {
                            targetNode.put("data", change.nodeData);
                            LOGGER.debug("更新节点数据: " + change.nodeId);
                        }
                    } else {
                        LOGGER.warn("未找到要更新的节点: " + change.nodeId);
                    }
                } else if ("delete".equals(change.operation)) {
                    if (deleteNodeFromTree(targetRoot, change.nodeId)) {
                        if (this.baseDbNodeMap != null) {
                            this.baseDbNodeMap.remove(change.nodeId);
                        }
                        LOGGER.debug("删除节点: " + change.nodeId);
                    }
                } else if ("move".equals(change.operation)) {
                    // 拖拽移位：从原父节点摘除，挂到新父节点
                    JSONObject movingNode = targetNodeMap.get(change.nodeId);
                    if (movingNode == null) {
                        LOGGER.warn("移位操作：未在 baseDbCase 找到节点 " + change.nodeId + "，跳过");
                        continue;
                    }
                    // 更新 data（如果同时有数据变更）
                    if (change.nodeData != null) {
                        movingNode.put("data", change.nodeData);
                    }
                    // 从原位置摘除（不用递归查找父节点，直接从树中移除整个节点）
                    boolean removed = deleteNodeFromTree(targetRoot, change.nodeId);
                    if (!removed) {
                        LOGGER.warn("移位操作：无法从原位置删除节点 " + change.nodeId);
                        continue;
                    }
                    // 挂到新父节点
                    JSONArray newParentChildren;
                    if (change.parentId == null) {
                        newParentChildren = targetRoot.getJSONArray("children");
                        if (newParentChildren == null) {
                            newParentChildren = new JSONArray();
                            targetRoot.put("children", newParentChildren);
                        }
                    } else {
                        JSONObject newParentNode = targetNodeMap.get(change.parentId);
                        if (newParentNode == null) {
                            LOGGER.warn("移位操作：未找到目标父节点 " + change.parentId + "，节点 " + change.nodeId + " 丢弃");
                            continue;
                        }
                        newParentChildren = newParentNode.getJSONArray("children");
                        if (newParentChildren == null) {
                            newParentChildren = new JSONArray();
                            newParentNode.put("children", newParentChildren);
                        }
                    }
                    if (change.insertIndex >= 0 && change.insertIndex <= newParentChildren.size()) {
                        newParentChildren.add(change.insertIndex, movingNode);
                    } else {
                        newParentChildren.add(movingNode);
                    }
                    // nodeMap 中引用不变（movingNode 对象未变），无需重建
                    LOGGER.info("节点 " + change.nodeId + " 已从父节点 " + change.oldParentId + " 移动到 " + change.parentId + " 索引 " + change.insertIndex);
                } else if ("reorder".equals(change.operation)) {
                    // 同父节点内换位：从当前位置摘除，再按 insertIndex 重新插入
                    JSONArray siblingChildren;
                    if (change.parentId == null) {
                        siblingChildren = targetRoot.getJSONArray("children");
                    } else {
                        JSONObject parentNode = targetNodeMap.get(change.parentId);
                        if (parentNode == null) {
                            LOGGER.warn("reorder操作：未找到父节点 " + change.parentId + "，跳过节点 " + change.nodeId);
                            continue;
                        }
                        siblingChildren = parentNode.getJSONArray("children");
                    }
                    if (siblingChildren == null) {
                        LOGGER.warn("reorder操作：父节点 children 为 null，跳过节点 " + change.nodeId);
                        continue;
                    }
                    // 找到并摘除节点
                    JSONObject reorderNode = null;
                    for (int i = 0; i < siblingChildren.size(); i++) {
                        Object child = siblingChildren.get(i);
                        if (child instanceof JSONObject) {
                            JSONObject childObj = (JSONObject) child;
                            JSONObject data = childObj.getJSONObject("data");
                            if (data != null && change.nodeId.equals(data.getString("id"))) {
                                reorderNode = childObj;
                                siblingChildren.remove(i);
                                break;
                            }
                        }
                    }
                    if (reorderNode == null) {
                        LOGGER.warn("reorder操作：未能从 children 中找到节点 " + change.nodeId);
                        continue;
                    }
                    // 同步数据变更（如果有）
                    if (change.nodeData != null) {
                        reorderNode.put("data", change.nodeData);
                    }
                    // 重新插入到目标位置
                    if (change.insertIndex >= 0 && change.insertIndex <= siblingChildren.size()) {
                        siblingChildren.add(change.insertIndex, reorderNode);
                    } else {
                        siblingChildren.add(reorderNode);
                    }
                    LOGGER.debug("节点 " + change.nodeId + " 已在父节点 " + change.parentId + " 内移至索引 " + change.insertIndex);
                }
            } catch (Exception e) {
                LOGGER.error("应用节点变更失败: " + change.nodeId + ", operation: " + change.operation, e);
            }
        }

        // 再处理 add（需要父节点先于子节点，使用多轮迭代直到无进展）
        // 关键：新节点的 children 一律初始化为空 JSONArray，
        // 由子节点自己的 NodeChange 追加，避免共享引用导致重复及 FastJSON $ref 问题。
        Set<String> addedNodeIds = new HashSet<>(targetNodeMap.keySet());
        List<NodeChange> pendingAdds = new ArrayList<>();
        for (NodeChange change : changes.values()) {
            if ("add".equals(change.operation)) {
                pendingAdds.add(change);
            }
        }
        // 按 insertIndex 升序排序，保证同一父节点下的兄弟节点按原始顺序依次插入
        pendingAdds.sort(Comparator.comparingInt(c -> c.insertIndex));

        boolean progress = true;
        while (!pendingAdds.isEmpty() && progress) {
            progress = false;
            Iterator<NodeChange> it = pendingAdds.iterator();
            while (it.hasNext()) {
                NodeChange change = it.next();
                try {
                    JSONArray parentChildren;
                    if (change.parentId == null) {
                        parentChildren = targetRoot.getJSONArray("children");
                        if (parentChildren == null) {
                            parentChildren = new JSONArray();
                            targetRoot.put("children", parentChildren);
                        }
                    } else {
                        if (!addedNodeIds.contains(change.parentId)) {
                            // 父节点还未添加，本轮跳过，等待下一轮
                            continue;
                        }
                        JSONObject parentNode = targetNodeMap.get(change.parentId);
                        if (parentNode == null) {
                            LOGGER.warn("未找到父节点 " + change.parentId + "，跳过节点 " + change.nodeId);
                            it.remove();
                            progress = true;
                            continue;
                        }
                        parentChildren = parentNode.getJSONArray("children");
                        if (parentChildren == null) {
                            parentChildren = new JSONArray();
                            parentNode.put("children", parentChildren);
                        }
                    }

                    JSONObject newNode = new JSONObject();
                    newNode.put("data", change.nodeData);
                    // 必须使用新的空数组，不能复用 change.children（避免共享引用 + 重复追加）
                    newNode.put("children", new JSONArray());
                    // 按 insertIndex 在正确位置插入，而不是追加到末尾；
                    // 若索引越界则退化为追加，保证健壮性。
                    if (change.insertIndex >= 0 && change.insertIndex <= parentChildren.size()) {
                        parentChildren.add(change.insertIndex, newNode);
                    } else {
                        parentChildren.add(newNode);
                    }

                    if (this.baseDbNodeMap != null) {
                        this.baseDbNodeMap.put(change.nodeId, newNode);
                    }
                    targetNodeMap.put(change.nodeId, newNode);
                    addedNodeIds.add(change.nodeId);

                    LOGGER.debug("添加新节点 " + change.nodeId + "，父节点: " + change.parentId);
                    it.remove();
                    progress = true;
                } catch (Exception e) {
                    LOGGER.error("应用新增节点失败: " + change.nodeId, e);
                    it.remove();
                    progress = true;
                }
            }
        }

        if (!pendingAdds.isEmpty()) {
            LOGGER.warn("以下节点因找不到父节点而未能添加: " +
                pendingAdds.stream().map(c -> c.nodeId).collect(Collectors.joining(", ")));
        }
    }

    /**
     * 从树中删除指定 ID 的节点
     */
    private boolean deleteNodeFromTree(JSONObject node, String targetNodeId) {
        if (node == null) {
            return false;
        }
        
        JSONArray children = node.getJSONArray("children");
        if (children == null) {
            return false;
        }
        
        // 检查直接子节点
        for (int i = 0; i < children.size(); i++) {
            JSONObject child = children.getJSONObject(i);
            if (child != null) {
                JSONObject data = child.getJSONObject("data");
                if (data != null && data.containsKey("id")) {
                    String childId = data.getString("id");
                    if (childId.equals(targetNodeId)) {
                        children.remove(i);
                        return true;
                    }
                }
            }
        }
        
        // 递归查找子树
        for (int i = 0; i < children.size(); i++) {
            JSONObject child = children.getJSONObject(i);
            if (child != null) {
                if (deleteNodeFromTree(child, targetNodeId)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}
