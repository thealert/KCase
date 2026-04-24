package com.xiaoju.framework.controller;

import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.request.prview.PrviewAddReq;
import com.xiaoju.framework.entity.request.record.RecordAddReq;
import com.xiaoju.framework.entity.response.controller.Response;
import com.xiaoju.framework.service.PrviewService;
import com.xiaoju.framework.service.RecordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.constraints.NotNull;

@RestController
@CrossOrigin
@RequestMapping(value = "/api/prview")
public class PrviewController {
    private static final Logger LOGGER = LoggerFactory.getLogger(RecordController.class);

    @Resource
    PrviewService prviewService;

    @GetMapping(value = "/list")
    public Response<?> getRecordList(@RequestParam @NotNull(message = "用例id为空") Long caseId) {
        return Response.success(prviewService.getListByCaseId(caseId));
    }

    /**
     * 列表 - 新增执行任务
     *
     * @param req 前端传参
     * @return 响应体
     */
    @PostMapping(value = "/create")
    public Response<Long> createRecord(@RequestBody PrviewAddReq req) {
        req.validate();
        try {
            return Response.success(prviewService.addRecord(req));
        } catch (CaseServerException e) {
            throw new CaseServerException(e.getLocalizedMessage(), e.getStatus());
        } catch (Exception e) {
            LOGGER.error("[新增record出错]入参={}, 原因={}", req.toString(), e.getMessage());
            e.printStackTrace();
            return Response.build(StatusCode.SERVER_BUSY_ERROR);
        }
    }
}
