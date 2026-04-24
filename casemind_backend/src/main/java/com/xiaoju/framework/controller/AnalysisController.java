package com.xiaoju.framework.controller;

import com.xiaoju.framework.entity.dto.SesssionInfoDto;
import com.xiaoju.framework.entity.request.analysis.AnalyQueryReq;
import com.xiaoju.framework.entity.request.analysis.AnalyQueryReqV2;
import com.xiaoju.framework.entity.request.cases.CaseQueryReq;
import com.xiaoju.framework.entity.response.controller.Response;
import com.xiaoju.framework.handler.MyWebSocketHandler;
import com.xiaoju.framework.service.CaseService;
import org.apache.ibatis.annotations.Param;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.constraints.NotNull;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api/analysis")
public class AnalysisController {
    private static final Logger LOGGER = LoggerFactory.getLogger(AnalysisController.class);

    @Resource
    CaseService caseService;


    @GetMapping(value = "/case")
    public Response<?> getCaseInfos(
                                    @RequestParam @NotNull(message = "渠道为空")  Integer channel,
                                    @RequestParam @NotNull(message = "业务线id为空")  Long productLineId,
                                    @RequestParam(required = false) String beginTime,
                                    @RequestParam(required = false) String endTime,
                                    @RequestParam(defaultValue = "1") Integer pageNum,
                                    @RequestParam(defaultValue = "10") Integer pageSize
                                    ){
        return Response.success(caseService.getCaseAnalysisV2(
                new AnalyQueryReqV2(0,  channel, productLineId, pageNum, pageSize,
                        beginTime,endTime)));
    }


    @GetMapping(value = "/list")
    public Response<?> getCaseList(@RequestParam @NotNull(message = "渠道为空")  Integer channel,
                                   @RequestParam @NotNull(message = "业务线id为空")  Long productLineId,
                                   @RequestParam @NotNull(message = "业务名称为空")  String businessNames,
                                   @RequestParam @NotNull(message = "迭代名称为空")  String iteratorNames,
                                   @RequestParam(required = false) String beginTime,
                                   @RequestParam(required = false) String endTime,
                                   @RequestParam(defaultValue = "1") Integer pageNum,
                                   @RequestParam(defaultValue = "10") Integer pageSize,
                                   @RequestHeader Map<String, String> headers) {

//        if(headers.containsKey("username"))
//        {
//            LOGGER.info("Get Username "+headers.get("username"));
//        }
        return Response.success(caseService.getCaseAnalysis(
                new AnalyQueryReq(0,  channel, productLineId, pageNum, pageSize,
                        businessNames,iteratorNames,
                        beginTime,endTime)));
    }

    @GetMapping(value = "/wslist")
    public Response<?> getWsList(){
        List<SesssionInfoDto> sessioninfos= MyWebSocketHandler.getWebsocketInfo();
        return Response.success(sessioninfos);
    }
}
