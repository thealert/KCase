package com.xiaoju.framework.handler;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flipkart.zjsonpatch.JsonDiff;
import com.xiaoju.framework.entity.persistent.CaseBackup;
import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.util.BrotliUtils;
import com.xiaoju.framework.util.DeflaterUtils;
import com.xiaoju.framework.util.JsonUtil;
import com.xiaoju.framework.util.SeeeionUtil;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;

public class SessionSaveIngressTask extends SessionIngressTask {
    EditMessage data;
    CaseBackupMapper caseBackupMapper;

    public SessionSaveIngressTask(WebSocketSession session, SessionRoomEntity room, ExecutorService executorEgressService,
                                  EditMessage data, CaseBackupMapper caseBackupMapper) {
        super(session, room, executorEgressService);
        this.data = data;
        this.caseBackupMapper = caseBackupMapper;
    }

    @Override
    public void run() {
        // 1.更新内存中的用例
        room.setCaseContent(data.getCaseContent());

        // 2.保存到backup表
        LOGGER.info(Thread.currentThread().getName() + ": 手动保存用例。");
        CaseBackup caseBackup = new CaseBackup();

        caseBackup.setCaseId(room.getCaseId());
        //caseBackup.setCaseContent(data.getCaseContent());
        caseBackup.setRecordContent("");
        caseBackup.setCreator(SeeeionUtil.getQueryParam(session,"user"));
        caseBackup.setExtra("");

        // 此处可以与最新的内容比对，如果一致，则不更新backup表，减少版本数量
        List<CaseBackup> caseBackups = caseBackupMapper.selectByCaseId(caseBackup.getCaseId(), null, null);

        // 如果当前已有，则直接返回
        // todo 此处还是用版本信息控制更加合理
        ObjectMapper jsonMapper = new ObjectMapper();
        try {
            if (caseBackups.size() > 0) {
                String caseContent=caseBackups.get(0).getMergeCaseContent();
                JsonNode node=JsonDiff.asJson(jsonMapper.readTree(caseContent), jsonMapper.readTree(data.getCaseContent()));
                LOGGER.info(node.toString());
                if (JsonDiff.asJson(jsonMapper.readTree(caseContent), jsonMapper.readTree(data.getCaseContent())).size() == 0) { // 表示没有差别
                    LOGGER.info("当前内容已经保存过了，不再重复保存。");
                   // client.sendEvent("save_result","当前内容已经保存过了，不再重复保存");
                    session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("save_result","当前内容已经保存过了，不再重复保存")));
                    return;
                }
            }
        } catch (IOException e) {
            LOGGER.info("json转换异常. 数据继续备份", e);
        }

        //caseBackup.setCaseContent(DeflaterUtils.zipString(caseBackup.getCaseContent()));

        caseBackup.setCaseContentUseBlob(data.getCaseContent());
        int ret = caseBackupMapper.insert(caseBackup);
        if (ret < 1) {
            LOGGER.error("用例备份落库失败. casebackup id: " + caseBackup.getCaseId() + ", case content: " + caseBackup.getCaseContent() );
           // client.sendEvent("save_result","用例备份落库失败. casebackup id: " + caseBackup.getCaseId() + ", case content: " + caseBackup.getCaseContent());
            try {
                session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("save_result","用例备份落库失败. casebackup id: " + caseBackup.getCaseId() + ", case content: " + caseBackup.getCaseContent())));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }

            return;
        }

        LOGGER.info("备份保存当前用例。caseid:" + caseBackup.getCaseId());

        LOGGER.info(Thread.currentThread().getName() + ": 手动保存结束。");
        //client.sendEvent("save_result","保存成功");
        try {
            session.sendMessage(new TextMessage(JsonUtil.buildJsonMsg("save_result","保存成功" )));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
