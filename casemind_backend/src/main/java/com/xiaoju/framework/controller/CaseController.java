package com.xiaoju.framework.controller;

import com.alibaba.fastjson.JSONObject;
import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.entity.dto.NodeDto;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.persistent.CaseBackup;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.entity.request.cases.*;
import com.xiaoju.framework.entity.request.record.RecordCapReq;
import com.xiaoju.framework.entity.request.ws.WsSaveReq;
import com.xiaoju.framework.entity.response.controller.Response;
import com.xiaoju.framework.handler.MyWebSocketHandler;
import com.xiaoju.framework.handler.SessionRoomEntity;
import com.xiaoju.framework.handler.SessionRoomFactory;
import com.xiaoju.framework.mapper.CaseBackupMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.constants.SystemConstant;
import com.xiaoju.framework.service.CaseBackupService;
import com.xiaoju.framework.service.CaseService;
import com.xiaoju.framework.service.impl.DemoImpl;
import com.xiaoju.framework.util.BrotliUtils;
import com.xiaoju.framework.util.DeflaterUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 用例相关接口
 *
 * @author didi
 * @date 2020/11/20
 */
@RestController
@CrossOrigin
@RequestMapping("/api/case")
public class CaseController {

    private static final Logger LOGGER = LoggerFactory.getLogger(CaseController.class);

    @Resource
    CaseService caseService;

    @Resource
    private CaseBackupMapper caseBackupMapper;

    @Resource
    private TestCaseMapper caseMapper;

    @Resource
    private DemoImpl demoImpl;
    /**
     * 用例 - 根据文件夹id获取所有用例
     *
     * @param productLineId 业务线id
     * @param bizId 用例id
     * @param title 用例标题
     * @param creator 创建人前缀
     * @param requirementId 需求id
     * @param beginTime 开始时间
     * @param endTime 结束时间
     * @param channel 1
     * @param pageNum 页码
     * @param pageSize 页面承载量
     * @return 分页接口
     */
    @GetMapping(value = "/list")
    public Response<?> getCaseList(@RequestParam @NotNull(message = "渠道为空")  Integer channel,
                                   @RequestParam @NotNull(message = "业务线id为空")  Long productLineId,
                                   @RequestParam @NotNull(message = "文件夹未选中")  String bizId,
                                   @RequestParam(required = false)  String title,
                                   @RequestParam(required = false)  String creator,
                                   @RequestParam(required = false)  String requirementId,
                                   @RequestParam(required = false)  String caseKeyWords,
                                   @RequestParam(required = false)  String beginTime,
                                   @RequestParam(required = false)  String endTime,
                                   @RequestParam(defaultValue = "1") Integer pageNum,
                                   @RequestParam(defaultValue = "10") Integer pageSize,
                                   @RequestHeader Map<String, String> headers) {

//        if(headers.containsKey("username"))
//        {
//            LOGGER.info("Get Username "+headers.get("username"));
//        }
        return Response.success(caseService.getCaseList(
                new CaseQueryReq(0, title, creator, requirementId, beginTime,
                        endTime, channel, bizId, productLineId, caseKeyWords, pageNum, pageSize)));
    }

    @PostMapping(value = "/getCaseNode")
    public Response<?> getCaseNode(@RequestBody CaseNodeReq req){
        //return Response.success(caseService.getCaseNode(caseId,nodeId));
        List<NodeDto>  listNode=req.getCaseList();
        List<JSONObject> res=new ArrayList<JSONObject>();
        for(NodeDto node :listNode){
            res.add(caseService.getCaseNode(node.getCaseId(),node.getNodeId()));
        }
        return Response.success(res);
    }

    /* 创建执行记录快照*/
    @PostMapping(value = "/capture")
    public Response<Long> createCapture(@RequestBody RecordCapReq req){
        req.validate();
        try{
            return Response.success(caseService.createCaptureById(req));
        }catch (Exception e){
            LOGGER.error("[创建快照出错]入参={}, 原因={}", req.toString(), e.getMessage());
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }

    }
    /**
     * 列表 - 创建或者复制用例
     *
     * @param request 请求体
     * @return 响应体
     */
    @PostMapping(value = "/create")
    public Response<?> createOrCopyCase(@RequestBody CaseCreateReq request) {
        request.validate();
        try {
            return Response.success(caseService.insertOrDuplicateCase(request));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            e.printStackTrace();
            LOGGER.error("[Case Create]Create or duplicate test case failed. params={}, e={} ", request.toString(), e.getMessage());
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }
    }

    /**
     * 列表 - 修改用例属性
     *
     * @param request 请求体
     * @return 响应体
     */
    @PostMapping(value = "/edit")
    public Response<?> editCase(@RequestBody CaseEditReq request) {
        request.validate();
        try {
            return Response.success(caseService.updateCase(request));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            e.printStackTrace();
            LOGGER.error("[Case Update]Update test case failed. params={} e={} ", request.toString(), e.getMessage());
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }
    }

    @PostMapping(value = "/backupsyn")
    public Response<?> backupSynCase(@RequestBody CaseBackupSynReq request)
    {
        request.validate();
        CaseBackup casebackup=caseBackupMapper.selectByBackupId(request.getHistoryId());

        TestCase testcase=caseMapper.selectOne(request.getCaseId());



        JSONObject testcase_jsonObject = JSONObject.parseObject(testcase.getCaseContent());
        //testcase_jsonObject.put("base",);
        JSONObject testcasebackup_jsonObject=new JSONObject(JSONObject.parseObject(casebackup.getMergeCaseContent()));

        testcasebackup_jsonObject.put("base",testcase_jsonObject.getInteger("base")+1);
        testcasebackup_jsonObject.getJSONObject("root").getJSONObject("data").put("created",System.currentTimeMillis());

        SessionRoomEntity room=SessionRoomFactory.GetSessionRoomEntity(request.getCaseId()+"");
        if(room!=null){
            room.setCaseContent(testcasebackup_jsonObject.toJSONString());
        }
        testcase.setCaseContent(testcasebackup_jsonObject.toJSONString());
        caseMapper.update(testcase);

        return Response.success("ok");
    }

    /**
     * 列表 - 删除用例
     *
     * @param request 请求体
     * @return 响应体
     */
    @PostMapping(value = "/delete")
    public Response<?> deleteCase(@RequestBody CaseDeleteReq request) {
        request.validate();
        try {
            return Response.success(caseService.deleteCase(request.getId()));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[Case Delete]Delete test case failed. params={} e={} ", request.toString(), e.getMessage());
            e.printStackTrace();
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }
    }

    /**
     * 列表 - 查看用例详情
     *
     * @param caseId 用例id
     * @return 响应体
     */
    @GetMapping(value = "/detail")
    public Response<?> getCaseDetail(@RequestParam @NotNull(message = "用例id为空") Long caseId) {
        try {
            return Response.success(caseService.getCaseDetail(caseId));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            e.printStackTrace();
            LOGGER.error("[Case detail]View detail of test case failed. params={}, e={} ", caseId, e.getMessage());
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }
    }

    /**
     * 配合list 筛选时获取所有创建人的列表
     *
     * @param caseType 用例类型
     * @param productLineId 业务线id
     * @return 响应体
     */
    @GetMapping(value = "/listCreators")
    public Response<?> listCreators(@RequestParam @NotNull(message = "用例类型为空") Integer caseType,
                                    @RequestParam @NotNull(message = "业务线为空") Long productLineId) {
        return Response.success(caseService.listCreators(caseType, productLineId));
    }


    @GetMapping(value = "/test")
    public Response<?> test() {
        demoImpl.test();
        return Response.success(0);
    }

    /**
     * 配合detail 修改圈选用例时统计的用例条目数据
     *
     * @param caseId 用例id
     * @param priority 优先级列表
     * @param resource 资源列表
     * @return 响应体
     */
    @GetMapping(value = "/countByCondition")
    public Response<?> getCountByCondition(@RequestParam @NotNull(message = "用例id为空") Long caseId,
                                           @RequestParam @NotNull(message = "圈选优先级为空") String[] priority,
                                           @RequestParam @NotNull(message = "圈选资源为空") String[] resource) {
        CaseConditionReq req = new CaseConditionReq(caseId, priority, resource);
        req.validate();
        return Response.success(caseService.getCountByCondition(req));
    }

    /**
     * 脑图 - 获取上方用例概览信息
     *
     * @param id 用例id
     * @return 概览信息
     */
    @GetMapping(value = "/getCaseInfo")
    public Response<?> getCaseGeneralInfo(@RequestParam @NotNull(message = "用例id为空") Long id) {
        return Response.success(caseService.getCaseGeneralInfo(id));
    }

    /**
     * 脑图 - 保存按钮 可能是case也可能是record
     *
     * @param req 请求体
     * @return 响应体
     */
    @PostMapping(value = "/update")
    public Response<?> updateWsCase(@RequestBody WsSaveReq req) {
        try {
            LOGGER.info("get update info");
            if(req.getRecordId()== null)
                caseService.wsSave(req);
            return Response.success();
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            e.printStackTrace();
            LOGGER.error("[Case Update]Update test case failed. params={} e={} ", req.toString(), e.getMessage());
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }
    }

}
