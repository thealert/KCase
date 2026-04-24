package com.xiaoju.framework.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.xiaoju.framework.constants.XmindConstant;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.xiaoju.framework.constants.SystemConstant;
import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.entity.dto.*;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.persistent.Biz;
import com.xiaoju.framework.entity.persistent.CaseBackup;
import com.xiaoju.framework.entity.persistent.ExecRecord;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.entity.request.analysis.AnalyQueryReq;
import com.xiaoju.framework.entity.request.analysis.AnalyQueryReqV2;
import com.xiaoju.framework.entity.request.cases.CaseConditionReq;
import com.xiaoju.framework.entity.request.cases.CaseCreateReq;
import com.xiaoju.framework.entity.request.cases.CaseEditReq;
import com.xiaoju.framework.entity.request.cases.CaseQueryReq;
import com.xiaoju.framework.entity.request.record.RecordCapReq;
import com.xiaoju.framework.entity.request.ws.WsSaveReq;
import com.xiaoju.framework.entity.response.PersonResp;
import com.xiaoju.framework.entity.response.analysis.CaseAnalysisResp;
import com.xiaoju.framework.entity.response.analysis.CaseAnalysisRespV2;
import com.xiaoju.framework.entity.response.cases.*;
import com.xiaoju.framework.entity.response.controller.PageModule;
import com.xiaoju.framework.entity.response.dir.BizListResp;
import com.xiaoju.framework.entity.response.dir.DirTreeResp;
import com.xiaoju.framework.mapper.BizMapper;
import com.xiaoju.framework.mapper.ExecRecordMapper;
import com.xiaoju.framework.mapper.PrviewRecordMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.service.*;
import com.xiaoju.framework.util.TimeUtil;
import com.xiaoju.framework.util.TreeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import static java.util.Arrays.asList;

import javax.annotation.Resource;
import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;

import static com.xiaoju.framework.constants.SystemConstant.IS_DELETE;

/**
 * 用例实现类
 *
 * @author didi
 * @date 2020/9/7
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class CaseServiceImpl implements CaseService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CaseServiceImpl.class);

    @Resource
    private BizMapper bizMapper;


    @Resource
    private DirService dirService;

    @Resource
    private TestCaseMapper caseMapper;

    @Resource
    private ExecRecordMapper recordMapper;

    @Resource
    private PrviewRecordMapper prviewMapper;

    @Resource
    private RecordService recordService;

    @Resource
    private CaseBackupService caseBackupService;

    @Override
    public JSONObject getCaseNode(String caseId,String nodeId){

        JSONObject res=new JSONObject();
        if(!caseId.isEmpty()&&!nodeId.isEmpty()){

            TestCase parentCase=caseMapper.selectOne(Long.parseLong(caseId));
            String caseStr=parentCase.getCaseContent();
            JSONObject caseJson=JSONObject.parseObject(caseStr);
            List<String> path=new ArrayList<String>();
            TreeUtil.getCaseNode(caseJson.getJSONObject("root"),nodeId,path,res);
            res.put("caseName",parentCase.getTitle());
            res.put("caseId",caseId);
            res.put("caseNodeId",nodeId);
        }
        return res;

    }

    class BizInfo{
        String  businessname;
        String  iterationname;

        public BizInfo(String businessname,String iterationname){
            this.businessname=businessname;
            this.iterationname=iterationname;
        }
    }

    public void judgeNumber(Map<Long,Integer> mapper,Long id){
        if(!mapper.containsKey(id))
            mapper.put(id,1);
        else
            mapper.put(id,mapper.get(id)+1);
    }

    @Override
    public PageModule<CaseAnalysisRespV2>  getCaseAnalysisV2(AnalyQueryReqV2 request){
//        DirNodeDto root = dirService.getDirTree(request.getLineId(), request.getChannel());
//        String rootid=root.getId();
//        List<Long> caseIds = dirService.getCaseIds(request.getLineId(), rootid, request.getChannel());
        Date beginTime = transferTime(request.getBeginTime());
        Date endTime = transferTime(request.getEndTime());

        CaseNumDto caseNums = caseMapper.searchNumAll(request.getCaseType(), null, null, null,
                null, beginTime, endTime, request.getChannel(), request.getLineId(), null);
        PageHelper.startPage(request.getPageNum(), request.getPageSize());
        List<TestCase> caseList = caseMapper.searchAll(request.getCaseType(), null, null, null,
                null, beginTime, endTime, request.getChannel(), request.getLineId(), null);

        List<Long> ids=new ArrayList<Long>();
        for (TestCase tc : caseList){
            ids.add(tc.getId());
        }

        Map<Long,List<ExecRecord>> recordMap=new HashMap<>();
        Map<Long,Integer> recordNumberMap=new HashMap<>();
        Map<Long,Integer> prviewNumberMap=new HashMap<>();
        Map<Long,Integer> captureNumberMap=new HashMap<>();

        if(ids.size()>0){
            List<ExecRecord> records= recordMapper.getRecordsByCaseIds(ids);
            List<ExecRecord> captures=recordMapper.getCaptureListByParentCaseIds(ids);

            for(ExecRecord record:records){
                Long id=record.getCaseId();
                if(!recordMap.containsKey(id))
                    recordMap.put(id,new ArrayList<>());
                if(record.getRecord_type()==0){//执行记录
                    judgeNumber(recordNumberMap,id);
                    record.setUrlLink("/mycasemind-cms/caseManager/1/"+record.getCaseId()+"/"+record.getId()+"/3");
                }
                if(record.getRecord_type()==1){//评审记录
                    judgeNumber(prviewNumberMap,id);
                    record.setUrlLink("/mycasemind-cms/caseManager/1/"+record.getCaseId()+"/undefined/4/prview/"+record.getId());
                }

                recordMap.get(id).add(record);

            }

            for(ExecRecord capture:captures){
                Long id=capture.getParentId();
                if(!recordMap.containsKey(id))
                    recordMap.put(id,new ArrayList<>());
                judgeNumber(captureNumberMap,id);//快照记录
                capture.setUrlLink("/mycasemind-cms/caseManager/1/"+capture.getCaseId()+"/"+capture.getId()+"/3");
                recordMap.get(id).add(capture);
            }
        }


        List<CaseAnalysisRespV2> res = new ArrayList<>();
        for (TestCase tc : caseList){
            CaseAnalysisRespV2 resp=new CaseAnalysisRespV2();
            JSONObject content = JSONObject.parseObject(tc.getCaseContent());
            Integer caseNum = 0;
            Map<String, Integer> prioritys = new HashMap<>();
            if (content != null && content.containsKey("root")) {
                JSONObject caseRoot = content.getJSONObject("root");

                HashSet<String> tags = new HashSet<>();
                caseNum = TreeUtil.getCaseNumV1(caseRoot, tags, prioritys);
            }
            tc.setCase_count(caseNum);
            BeanUtils.copyProperties(tc, resp);
            //List<ExecRecord> execRecordList = recordMapper.getRecordListByCaseId(tc.getId());
            resp.setRecordList(recordMap.containsKey(tc.getId())?recordMap.get(tc.getId()):new ArrayList<>());
            resp.setRecordNum(recordNumberMap.getOrDefault(tc.getId(), 0));
            resp.setPrviewNum(prviewNumberMap.getOrDefault(tc.getId(), 0));
            resp.setCaptureNum(captureNumberMap.getOrDefault(tc.getId(), 0));
            resp.setP0(prioritys.get("P0") == null ? 0 : prioritys.get("P0"));
            resp.setP1(prioritys.get("P1") == null ? 0 : prioritys.get("P1"));
            resp.setP2(prioritys.get("P2") == null ? 0 : prioritys.get("P2"));
            resp.setP3(prioritys.get("P3") == null ? 0 : prioritys.get("P3"));
            resp.setCaseCount(caseNum);
            resp.setRequirementName(tc.getRequirement_name());

            res.add(resp);
        }

        return PageModule.buildPage(res,Long.valueOf(caseNums.getCaseNum() ));

    }
    @Override
    public PageModule<CaseAnalysisResp> getCaseAnalysis(AnalyQueryReq request) {

        if(request.getBusinessNames() == "" || request.getBusinessNames() == null)
                return null;

        if(request.getIteratorNames() == "" || request.getIteratorNames() == null)
            return null;
        String special_businsee="EE（信息化）";
        ArrayList<String> business_list = new ArrayList<String>(Arrays.asList(request.getBusinessNames().split(",")));
        ArrayList<String> teration_list = new ArrayList<String>(Arrays.asList(request.getIteratorNames().split(",")));
        Map<String, BizInfo> biz_map = new HashMap<>();
        DirNodeDto root = dirService.getDirTree(request.getLineId(), request.getChannel());

        if(business_list.contains("All（全量）")){
            biz_map.put(root.getId(), new BizInfo("全量", "全业务线"));
        }
        else {
            if (root.getChildren().size() > 0) {
                for (DirNodeDto nodeL2 : root.getChildren()) {
                    if (business_list.contains(nodeL2.getText()) && nodeL2.getChildren().size() > 0) {
                        if (nodeL2.getText().equals(special_businsee)) {
                            biz_map.put(nodeL2.getId(), new BizInfo(special_businsee, "全范围"));
                        } else {
                            for (DirNodeDto nodeL3 : nodeL2.getChildren()) {
                                for (String teration : teration_list) {
                                    if (nodeL3.getText().contains(teration)) {
                                        biz_map.put(nodeL3.getId(), new BizInfo(nodeL2.getText(), nodeL3.getText()));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        List<CaseAnalysisResp> res = new ArrayList<>();
        for (String bizid : biz_map.keySet()) {

            List<Long> caseIds = dirService.getCaseIds(request.getLineId(), bizid, request.getChannel());
            if (CollectionUtils.isEmpty(caseIds)) {
                continue;
            }
            Date beginTime = transferTime(request.getBeginTime());
            Date endTime = transferTime(request.getEndTime());
            PageHelper.startPage(request.getPageNum(), request.getPageSize());
            List<TestCase> caseList = caseMapper.search(request.getCaseType(), caseIds, null, null,
                    null, beginTime, endTime, request.getChannel(), request.getLineId(), null);

            Map<Long, Map<String, Integer>> priorityMap = new HashMap<>();
            for (TestCase tc : caseList) {

                tc.setBusinessname(biz_map.get(bizid).businessname);
                tc.setIteratorname(biz_map.get(bizid).iterationname);

                JSONObject content = JSONObject.parseObject(tc.getCaseContent());
                Integer caseNum = 0;

                Map<String, Integer> prioritys = new HashMap<>();
                if (content != null && content.containsKey("root")) {
                    JSONObject caseRoot = content.getJSONObject("root");

                    HashSet<String> tags = new HashSet<>();
                    caseNum = TreeUtil.getCaseNumV1(caseRoot, tags, prioritys);
                }
                tc.setCase_count(caseNum);
                priorityMap.put(tc.getId(), prioritys);

                List<ExecRecord> execRecordList = recordMapper.getRecordListByCaseId(tc.getId());
//                int RDTestSuccess=0;
//                int RDTestTotal=0;
                int RDTestSuccess=0,RDTestTotal=0,SmokeTestSuccess=0,SmokeTestTotal=0;
                int CurTestSuccess=0,CurTestTotal=0;
                boolean isfindCur=false;
                for (ExecRecord record : execRecordList) {
                    if (record.getEnv() == 3) {  //研发自测
                        RDTestSuccess+=record.getSuccessCount();
                        RDTestTotal+=record.getTotalCount();
                    }
                    if(record.getEnv() == 0){ //冒烟测试
                        SmokeTestSuccess+=record.getSuccessCount();
                        SmokeTestTotal+=record.getTotalCount();
                    }
                    if( record.getEnv() != 3 && !isfindCur){
                        CurTestSuccess=record.getSuccessCount();
                        CurTestTotal =record.getTotalCount();
                        isfindCur=true;
                    }
                }
                if(RDTestTotal>0){
                    tc.setRDTestSuccess(RDTestSuccess);
                    tc.setRDTestTotal(RDTestTotal);
                    tc.setRDTestPassRate(Double.parseDouble(String.format("%.2f", (RDTestSuccess*100.0)/RDTestTotal)));
                }
                if(SmokeTestTotal>0){
                    tc.setSmokeTestSuccess(SmokeTestSuccess);
                    tc.setSmokeTestTotal(SmokeTestTotal);
                    tc.setSmokeTestPassRate(Double.parseDouble(String.format("%.2f", (SmokeTestSuccess*100.0)/SmokeTestTotal)));
                }

                if(CurTestTotal>0){
                    tc.setCurTestSuccess(CurTestSuccess);
                    tc.setCurTestTotal(CurTestTotal);
                    tc.setCurTestPassRate(Double.parseDouble(String.format("%.2f", (CurTestSuccess*100.0)/CurTestTotal)));
                }

                List<ExecRecord> CaptureList = recordMapper.getCaptureListByParentCaseId(tc.getId());
                for (ExecRecord capture : CaptureList) {
                    if (capture.getTitle().contains("第一轮")) {

                        tc.setFirstTestSuccess(capture.getSuccessCount());
                        tc.setFirstTestTotal(capture.getTotalCount());
                        if (capture.getTotalCount() != 0) {
                            DecimalFormat decimalFormat = new DecimalFormat("#.##");
                            String ratestr = decimalFormat.format(capture.getSuccessCount() * 100.0 / capture.getTotalCount());
                            tc.setFirstTestPassRate(Double.parseDouble(ratestr));
                        } else
                            tc.setFirstTestPassRate(0.0);

                        tc.setFirstExecTotal(capture.getPassCount());
                        if(capture.getPassCount()!=0){
                            DecimalFormat decimalFormat = new DecimalFormat("#.##");
                            String ratestr = decimalFormat.format(capture.getSuccessCount() * 100.0 / capture.getPassCount());
                            tc.setFirstExecPassRate(Double.parseDouble(ratestr));
                        }else{
                            tc.setFirstExecPassRate(0.0);
                        }
                        break;
                    }
                }


            }
            List<RecordNumDto> recordNumDtos = new ArrayList<RecordNumDto>();
            List<RecordNumDto> prviewNumDtos= new ArrayList<RecordNumDto>();

            List<RecordAndPrviewNumDto> recordAndPrviewNumDtos= recordMapper.getRecordPrviewNumByCaseIds(caseIds);
            for(RecordAndPrviewNumDto recordAndPrviewNumDto:recordAndPrviewNumDtos){
                RecordNumDto record= new RecordNumDto();
                record.setRecordNum(recordAndPrviewNumDto.getRecordNum());
                record.setCaseId(recordAndPrviewNumDto.getCaseId());
                if(recordAndPrviewNumDto.getRecordType()==0){
                    recordNumDtos.add(record);
                }
                else if(recordAndPrviewNumDto.getRecordType()==1){
                    prviewNumDtos.add(record);
                }
            }
            List<RecordNumDto> prviewDoneNumDtos=recordMapper.getPrviewDoneNumByCaseIds(caseIds);

            Map<Long, Integer> recordMap = recordNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
            Map<Long, Integer> prviewMap = prviewNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
            Map<Long, Integer> prviewDoneMap = prviewDoneNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));

            List<RecordNumDto> captureNumDtos=recordMapper.getCaptureNumByCaseIds(caseIds);
            Map<Long, Integer> captureMap = captureNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));


            for (TestCase testCase : caseList) {
                res.add(buildListAnalyResp(testCase, recordMap.get(testCase.getId()),prviewMap.get(testCase.getId()),captureMap.get(testCase.getId()),prviewDoneMap.get(testCase.getId()),priorityMap.get(testCase.getId())));
            }
        }



        return PageModule.buildPage(res,Long.valueOf(res.size() ));



//        List<CaseAnalysisResp> res = new ArrayList<>();
//        List<Long> caseIds = dirService.getCaseIds(request.getLineId(), request.getBizId(), request.getChannel());
//
//
//        if (CollectionUtils.isEmpty(caseIds)) {
//            return PageModule.emptyPage();
//        }
//
//        Date beginTime = transferTime(request.getBeginTime());
//        Date endTime = transferTime(request.getEndTime());
//        PageHelper.startPage(request.getPageNum(), request.getPageSize());
//        // select * from test_case where case_id in (request.getCaseIds()) [and ...any other condition];
//        List<TestCase> caseList = caseMapper.search(request.getCaseType(), caseIds, request.getTitle(), request.getCreator(),
//                request.getRequirementId(),beginTime, endTime, request.getChannel(), request.getLineId(), request.getCaseKeyWords());
//
//        Map<Long, Map<String,Integer>> priorityMap=new HashMap<>();
//
//
//        for(TestCase tc : caseList){
//
//
//            DirNodeDto dir = dirService.getDir(tc.getBizId(), root);
//            tc.setBizname(dir.getText());
//
//            if(!tc.getParentid().equals(0L)){
//                TestCase parentcase=caseMapper.selectOne(tc.getParentid());
//                if(parentcase!=null)
//                    tc.setParentname(parentcase.getTitle());
//            }
//
//
//            JSONObject content = JSONObject.parseObject(tc.getCaseContent());
//            Integer caseNum = 0;
//            Map<String,Integer> prioritys=new HashMap<>();
//            if( content!=null && content.containsKey("root")) {
//                JSONObject caseRoot = content.getJSONObject("root");
//
//                HashSet<String> tags = new HashSet<>();
//                caseNum = TreeUtil.getCaseNumV1(caseRoot, tags,prioritys);
//            }
//            tc.setCase_count(caseNum);
//            priorityMap.put(tc.getId(),prioritys);
//
//            List<ExecRecord> execRecordList = recordMapper.getRecordListByCaseId(tc.getId());
//            for (ExecRecord record : execRecordList) {
//                if(record.getEnv()==3){
//                    tc.setRDTestSuccess(record.getSuccessCount());
//                    tc.setRDTestTotal(record.getTotalCount());
//                    if(record.getTotalCount()!=0) {
//                        DecimalFormat decimalFormat = new DecimalFormat("#.##");
//                        String ratestr = decimalFormat.format(record.getSuccessCount()*100.0  / record.getTotalCount());
//                        tc.setRDTestPassRate(Double.parseDouble(ratestr));
//                    }
//                    else
//                        tc.setRDTestPassRate(0.0);
//                    break;
//
//                }
//            }
//            List<ExecRecord> CaptureList = recordMapper.getCaptureListByParentCaseId(tc.getId());
//            for (ExecRecord capture : CaptureList) {
//                if(capture.getTitle().contains("第一轮")){
//
//                    tc.setFirstTestSuccess(capture.getSuccessCount());
//                    tc.setFirstTestTotal(capture.getTotalCount());
//                    if(capture.getTotalCount()!=0) {
//                        DecimalFormat decimalFormat = new DecimalFormat("#.##");
//                        String ratestr = decimalFormat.format(capture.getSuccessCount()*100.0  / capture.getTotalCount());
//                        tc.setFirstTestPassRate(Double.parseDouble(ratestr));
//                    }
//                    else
//                        tc.setFirstTestPassRate(0.0);
//                    break;
//                }
//            }
//        }
//
////        List<RecordNumDto> recordNumDtos = recordMapper.getRecordNumByCaseIds(caseIds);
////        List<RecordNumDto> prviewNumDtos=recordMapper.getPrviewNumByCaseIds(caseIds);
//        List<RecordNumDto> recordNumDtos = new ArrayList<RecordNumDto>();
//        List<RecordNumDto> prviewNumDtos= new ArrayList<RecordNumDto>();
//
//        List<RecordAndPrviewNumDto> recordAndPrviewNumDtos= recordMapper.getRecordPrviewNumByCaseIds(caseIds);
//        for(RecordAndPrviewNumDto recordAndPrviewNumDto:recordAndPrviewNumDtos){
//            RecordNumDto record= new RecordNumDto();
//            record.setRecordNum(recordAndPrviewNumDto.getRecordNum());
//            record.setCaseId(recordAndPrviewNumDto.getCaseId());
//            if(recordAndPrviewNumDto.getRecordType()==0){
//                recordNumDtos.add(record);
//            }
//            else if(recordAndPrviewNumDto.getRecordType()==1){
//                prviewNumDtos.add(record);
//            }
//        }
//        List<RecordNumDto> prviewDoneNumDtos=recordMapper.getPrviewDoneNumByCaseIds(caseIds);
//
//        Map<Long, Integer> recordMap = recordNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
//        Map<Long, Integer> prviewMap = prviewNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
//        Map<Long, Integer> prviewDoneMap = prviewDoneNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
//
//        List<RecordNumDto> captureNumDtos=recordMapper.getCaptureNumByCaseIds(caseIds);
//        Map<Long, Integer> captureMap = captureNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
//
//
//        for (TestCase testCase : caseList) {
//            res.add(buildListAnalyResp(testCase, recordMap.get(testCase.getId()),prviewMap.get(testCase.getId()),captureMap.get(testCase.getId()),prviewDoneMap.get(testCase.getId()),priorityMap.get(testCase.getId())));
//        }
//        return PageModule.buildPage(res, ((Page<TestCase>) caseList).getTotal());
    }

    @Override
    public PageModule<CaseListResp> getCaseList(CaseQueryReq request) {
        List<CaseListResp> res = new ArrayList<>();
        List<Long> caseIds = dirService.getCaseIds(request.getLineId(), request.getBizId(), request.getChannel());

        if (CollectionUtils.isEmpty(caseIds)) {
            return PageModule.emptyPage();
        }

        Date beginTime = transferTime(request.getBeginTime());
        Date endTime = transferTime(request.getEndTime());
        PageHelper.startPage(request.getPageNum(), request.getPageSize());
        // select * from test_case where case_id in (request.getCaseIds()) [and ...any other condition];
        List<TestCase> caseList = caseMapper.search(request.getCaseType(), caseIds, request.getTitle(), request.getCreator(),
                request.getRequirementId(), beginTime, endTime, request.getChannel(), request.getLineId(), request.getCaseKeyWords());


        for (TestCase tc : caseList) {

            if (!tc.getParentid().equals(0L)) {
                TestCase parentcase = caseMapper.selectOne(tc.getParentid());
                if (parentcase != null)
                    tc.setParentname(parentcase.getTitle());
            }


            JSONObject content = JSONObject.parseObject(tc.getCaseContent());
            Integer caseNum = 0;
            if (content != null && content.containsKey("root")) {
                JSONObject caseRoot = content.getJSONObject("root");

                HashSet<String> tags = new HashSet<>();
                ArrayList<String> autocase=new ArrayList<String>();
                ArrayList<String> aicase=new ArrayList<String>();
                caseNum = TreeUtil.getCaseNumV2(caseRoot, tags,autocase,aicase);

                tc.setAi_case_count(aicase.size());
                tc.setAuto_case_count(autocase.size());
            }
            tc.setCase_count(caseNum);
        }

//        List<RecordNumDto> recordNumDtos = recordMapper.getRecordNumByCaseIds(caseIds);
//        List<RecordNumDto> prviewNumDtos=recordMapper.getPrviewNumByCaseIds(caseIds);
        List<RecordNumDto> recordNumDtos = new ArrayList<RecordNumDto>();
        List<RecordNumDto> prviewNumDtos = new ArrayList<RecordNumDto>();

        List<RecordAndPrviewNumDto> recordAndPrviewNumDtos = recordMapper.getRecordPrviewNumByCaseIds(caseIds);
        for (RecordAndPrviewNumDto recordAndPrviewNumDto : recordAndPrviewNumDtos) {
            RecordNumDto record = new RecordNumDto();
            record.setRecordNum(recordAndPrviewNumDto.getRecordNum());
            record.setCaseId(recordAndPrviewNumDto.getCaseId());
            if (recordAndPrviewNumDto.getRecordType() == 0) {
                recordNumDtos.add(record);
            } else if (recordAndPrviewNumDto.getRecordType() == 1) {
                prviewNumDtos.add(record);
            }
        }
        List<RecordNumDto> prviewDoneNumDtos = recordMapper.getPrviewDoneNumByCaseIds(caseIds);

        Map<Long, Integer> recordMap = recordNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
        Map<Long, Integer> prviewMap = prviewNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));
        Map<Long, Integer> prviewDoneMap = prviewDoneNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));

        List<RecordNumDto> captureNumDtos = recordMapper.getCaptureNumByCaseIds(caseIds);
        Map<Long, Integer> captureMap = captureNumDtos.stream().collect(Collectors.toMap(RecordNumDto::getCaseId, RecordNumDto::getRecordNum));


        for (TestCase testCase : caseList) {
            res.add(buildListResp(testCase, recordMap.get(testCase.getId()), prviewMap.get(testCase.getId()), captureMap.get(testCase.getId()), prviewDoneMap.get(testCase.getId())));
        }
        return PageModule.buildPage(res, ((Page<TestCase>) caseList).getTotal());
    }

    @Override
    public CaseDetailResp getCaseDetail(Long caseId) {
        TestCase testCase = caseMapper.selectOne(caseId);
        if (testCase == null) {
            throw new CaseServerException("用例不存在", StatusCode.INTERNAL_ERROR);
        }
        if (testCase.getIsDelete().equals(IS_DELETE)) {
            throw new CaseServerException("用例已删除", StatusCode.INTERNAL_ERROR);
        }
        return buildDetailResp(testCase);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long insertOrDuplicateCase(CaseCreateReq request) {
        TestCase testcase = buildCase(request);

        caseMapper.insert(testcase);
        // 可能会多个加入  所以不要使用dirService.addCase()
        DirNodeDto tree = dirService.getDirTree(testcase.getProductLineId(), testcase.getChannel());
        List<String> addBizs = Arrays.asList(request.getBizId().split(SystemConstant.COMMA));
        updateDFS(packageTree(tree), String.valueOf(testcase.getId()), new HashSet<>(addBizs), new HashSet<>());
        updateBiz(testcase, tree);
        return testcase.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DirTreeResp updateCase(CaseEditReq request) {
        TestCase testCase = caseMapper.selectOne(request.getId());
        if (testCase == null) {
            throw new CaseServerException("用例不存在", StatusCode.NOT_FOUND_ENTITY);
        }


        List<String> addBizs = getDiffSet(request.getBizId(), testCase.getBizId());
        List<String> rmBizs = getDiffSet(testCase.getBizId(), request.getBizId());

        BeanUtils.copyProperties(request, testCase);
        testCase.setGmtModified(new Date());
        testCase.setModifier(request.getModifier());
        testCase.setRequirement_name(request.getRequirementId());

        DirNodeDto tree = dirService.getDirTree(testCase.getProductLineId(), testCase.getChannel());
        updateDFS(packageTree(tree), String.valueOf(request.getId()), new HashSet<>(addBizs), new HashSet<>(rmBizs));
        updateBiz(testCase, tree);

        caseMapper.update(testCase);

        return dirService.getAllCaseDir(tree,testCase.getProductLineId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DirTreeResp deleteCase(Long caseId) {
        TestCase testCase = caseMapper.selectOne(caseId);
        testCase.setIsDelete(IS_DELETE);

        // 删除所有操作记录
        List<ExecRecord> execRecords = recordMapper.getRecordListByCaseId(testCase.getId());
        if (!CollectionUtils.isEmpty(execRecords)) {
            recordMapper.batchDelete(execRecords.stream().map(ExecRecord::getId).collect(Collectors.toList()));
        }

        DirNodeDto tree = dirService.getDirTree(testCase.getProductLineId(), testCase.getChannel());
        updateDFS(packageTree(tree), String.valueOf(caseId), new HashSet<>(), new HashSet<>(convertToList(testCase.getBizId())));
        updateBiz(testCase, tree);

        caseMapper.delete(testCase.getId());
        return dirService.getAllCaseDir(tree,testCase.getProductLineId());
    }

    @Override
    public List<PersonResp> listCreators(Integer caseType, Long lineId) {
        List<PersonResp> list = new ArrayList<>();
        List<String> names = caseMapper.listCreators(caseType, lineId);

        if (CollectionUtils.isEmpty(names)) {
            return list;
        }

        return names.stream().map(name -> {
            PersonResp person = new PersonResp();
            person.setStaffNamePY(name);
            // 这里目前是扔出去了英文名，有需要可以自己加
            person.setStaffNameCN(name);
            return person;
        }).collect(Collectors.toList());
    }


    @Override
    public CaseConditionResp getCountByCondition(CaseConditionReq req) {
        CaseConditionResp res = new CaseConditionResp();

        TestCase testCase = caseMapper.selectOne(req.getCaseId());
        JSONObject content = JSONObject.parseObject(testCase.getCaseContent());
        JSONObject caseRoot = content.getJSONObject("root");

        HashSet<String> tags = new HashSet<>();
        Integer caseNum = TreeUtil.getCaseNum(caseRoot, tags);

        res.setTotalCount(caseNum);

        List<String> filterTags = asList("前置条件", "执行步骤", "预期结果");
        for (String filterTag : filterTags) {
            if (tags.contains(filterTag)) {
                tags.remove(filterTag);
            }
        }
        res.setTaglist(tags);

        HashSet<String> prioritySet, resourceSet;
        if (!CollectionUtils.isEmpty(req.getPriority())) {
            prioritySet = new HashSet<>(req.getPriority());
            if (!TreeUtil.getChosenCase(caseRoot, prioritySet, "priority")) {
                caseRoot = null;
            }
        }
        if (!CollectionUtils.isEmpty(req.getResource())) {
            resourceSet = new HashSet<>(req.getResource());
            if (!TreeUtil.getChosenCase(caseRoot, resourceSet, "resource")) {
                caseRoot = null;
            }
        }
        //没有筛选，返回caseNum为null
        caseNum = (req.getPriority().size() == 0 && req.getResource().size() == 0) ? null : TreeUtil.getCaseNum(caseRoot, tags);
        res.setCount(caseNum);
        return res;
    }

    @Override
    public Long createCaptureById(RecordCapReq req) {

        TestCase testCase = caseMapper.selectOne(req.getCaseId());
        if (testCase == null) {
            throw new CaseServerException("case操作记录不存在", StatusCode.NOT_FOUND_ENTITY);
        }
        ExecRecord record = recordMapper.selectOne(req.getRecordId());
        if (record == null) {
            throw new CaseServerException("执行记录不存在", StatusCode.NOT_FOUND_ENTITY);
        }
        String defaulttag = "[快照] ";
        if (req.getCapInfo() != null)
            defaulttag = req.getCapInfo() + " ";

        testCase.setParentid(testCase.getId());
        testCase.setParentname(testCase.getTitle());

        testCase.setId(new TestCase().getId());
        testCase.setTitle(defaulttag + testCase.getTitle());
        testCase.setCase_extype(1);

        caseMapper.insert(testCase);
        record.setId(new ExecRecord().getId());
        record.setTitle(defaulttag + record.getTitle());
        record.setCaseId(testCase.getId());
        record.setRecord_type(2);

        recordMapper.insert(record);

        DirNodeDto tree = dirService.getDirTree(testCase.getProductLineId(), testCase.getChannel());
        List<String> addBizs = Arrays.asList(testCase.getBizId().split(SystemConstant.COMMA));
        updateDFS(packageTree(tree), String.valueOf(testCase.getId()), new HashSet<>(addBizs), new HashSet<>());
        updateBiz(testCase, tree);

        return 0L;
    }

    @Override
    public CaseGeneralInfoResp getCaseGeneralInfo(Long caseId) {
        TestCase testCase = caseMapper.selectOne(caseId);
        if (testCase == null) {
            throw new CaseServerException("用例不存在", StatusCode.NOT_FOUND_ENTITY);
        }
        CaseGeneralInfoResp resp = new CaseGeneralInfoResp();
        resp.setId(testCase.getId());
        resp.setProductLineId(testCase.getProductLineId());
        resp.setRequirementId(testCase.getRequirementId());
        resp.setTitle(testCase.getTitle());
        resp.setRequirementName(testCase.getRequirement_name());
        return resp;
    }

    @Override
    public void wsSave(WsSaveReq req) {
//        List<String> editors = WebSocket.getEditingUser(String.valueOf(req.getId()),
//                StringUtils.isEmpty(req.getRecordId())?"undefined":String.valueOf(req.getRecordId()));
//        if (editors.size() < 1) {
//            throw new CaseServerException("用例ws链接已经断开，当前保存可能丢失，请刷新页面重建ws链接。", StatusCode.WS_UNKNOWN_ERROR);
//        }

        LOGGER.info(Thread.currentThread().getName() + ": http开始保存用例。");

        CaseBackup caseBackup = new CaseBackup();

        caseBackup.setCaseId(req.getId());
        caseBackup.setCaseContent(req.getCaseContent());
        caseBackup.setRecordContent("");
        caseBackup.setCreator(req.getModifier());
        caseBackup.setExtra("");
        caseBackupService.insertBackup(caseBackup);

        LOGGER.info(Thread.currentThread().getName() + ": http开始保存结束。");

    }

    /**
     * 字符串时间转date
     *
     * @param time 时间字符串
     * @return 如果字符串为空，那么Date也为空
     */
    private Date transferTime(String time) {
        if (time == null) {
            return null;
        }
        return TimeUtil.transferStrToDateInSecond(time);
    }

    private List<String> getDiffSet(String newStr, String oldStr) {
        List<String> newIds = convertToList(newStr);
        List<String> oldIds = convertToList(oldStr);
        newIds.removeIf(oldIds::contains);
        return newIds;
    }

    private List<String> convertToList(String str) {
        return Arrays.stream(str.split(SystemConstant.COMMA)).collect(Collectors.toList());
    }

    /**
     * 构造/list下的用例列表
     *
     * @param testCase 测试用例
     * @return 列表单条
     * @see #getCaseList
     */
    private CaseListResp buildListResp(TestCase testCase, Integer recordNum, Integer prviewNum, Integer captureNum, Integer prviewDoneNum) {
        CaseListResp resp = new CaseListResp();
        BeanUtils.copyProperties(testCase, resp);
        resp.setRecordNum(recordNum == null ? 0 : recordNum);
        resp.setPrviewNum(prviewNum == null ? 0 : prviewNum);
        resp.setCaptureNum(captureNum == null ? 0 : captureNum);
        resp.setPrviewDoneNum(prviewDoneNum == null ? 0 : prviewDoneNum);
        return resp;
    }

    private CaseAnalysisResp buildListAnalyResp(TestCase testCase, Integer recordNum, Integer prviewNum, Integer captureNum, Integer prviewDoneNum, Map<String, Integer> prioritys) {
        CaseAnalysisResp resp = new CaseAnalysisResp();
        BeanUtils.copyProperties(testCase, resp);
        resp.setRecordNum(recordNum == null ? 0 : recordNum);
        resp.setPrviewNum(prviewNum == null ? 0 : prviewNum);
        resp.setCaptureNum(captureNum == null ? 0 : captureNum);
        resp.setPrviewDoneNum(prviewDoneNum == null ? 0 : prviewDoneNum);

        resp.setP0(prioritys.get("P0") == null ? 0 : prioritys.get("P0"));
        resp.setP1(prioritys.get("P1") == null ? 0 : prioritys.get("P1"));
        resp.setP2(prioritys.get("P2") == null ? 0 : prioritys.get("P2"));
        resp.setP3(prioritys.get("P3") == null ? 0 : prioritys.get("P3"));

        return resp;
    }

    /**
     * 构造用例详情内容
     *
     * @param testCase 测试用例
     * @return 详情单条
     * @see #getCaseDetail
     */
    private CaseDetailResp buildDetailResp(TestCase testCase) {
        CaseDetailResp resp = new CaseDetailResp();
        BeanUtils.copyProperties(testCase, resp);
        resp.setBiz(
                getBizFlatList(testCase.getProductLineId(), Arrays.asList(testCase.getBizId().split(SystemConstant.COMMA)), testCase.getChannel())
                        .stream().filter(BizListResp::isSelect).collect(Collectors.toList())
        );
        resp.setProductLineId(testCase.getProductLineId());
        return resp;
    }

    /**
     * 查看详情时，显示关联的需求，以及所有的需求
     *
     * @param lineId 业务线id
     * @param bizIds 关联的文件夹id列表
     * @return 去掉顶级文件夹的文件夹树
     * @see #buildDetailResp
     */
    private List<BizListResp> getBizFlatList(Long lineId, List<String> bizIds, Integer channel) {
        DirNodeDto root = dirService.getDirTree(lineId, channel);
        List<BizListResp> list = new ArrayList<>();
        flatDfs(root, list, new ArrayList<>(), bizIds);
        // 一开始的root不要给出去
        list.remove(0);
        return list;
    }

    private void flatDfs(DirNodeDto node, List<BizListResp> list, List<String> path, List<String> bizIds) {
        list.add(buildBizList(node, path, bizIds));

        if (CollectionUtils.isEmpty(node.getChildren())) {
            return;
        }

        for (int i = 0; i < node.getChildren().size(); i++) {
            path.add(node.getChildren().get(i).getText());
            flatDfs(node.getChildren().get(i), list, path, bizIds);
            path.remove(path.size() - 1);
        }
    }

    private BizListResp buildBizList(DirNodeDto node, List<String> path, List<String> bizIds) {
        BizListResp obj = new BizListResp();
        obj.setBizId(node.getId());
        obj.setText(String.join(">", path));
        obj.setSelect(bizIds.contains(node.getId()));
        return obj;
    }

    /**
     * 新建/复制时，构建新的用例
     *
     * @param request 请求体
     * @return 新的请求体
     * @see #insertOrDuplicateCase
     */
    private TestCase buildCase(CaseCreateReq request) {
        String content = request.getCaseContent();
        Long parentid = 0L;
        // 如果是复制
        if (request.getId() != null) {
            TestCase testCase = caseMapper.selectOne(request.getId());
            if (testCase == null) {
                throw new CaseServerException("用例不存在", StatusCode.NOT_FOUND_ENTITY);
            }
            content = testCase.getCaseContent();
            parentid = request.getId();
        }

        TestCase ret = new TestCase();
        ret.setTitle(request.getTitle());
        ret.setRequirementId(request.getRequirementId());
        ret.setRequirement_name(request.getRequirementId());
        ret.setBizId(request.getBizId());
        ret.setParentid(parentid);
        ret.setGroupId(1L);
        ret.setProductLineId(request.getProductLineId());
        ret.setDescription(request.getDescription());
        ret.setCreator(request.getCreator());
        ret.setModifier(ret.getCreator());
        ret.setChannel(request.getChannel());
        ret.setExtra(SystemConstant.EMPTY_STR);
        ret.setGmtCreated(new Date());
        ret.setGmtModified(new Date());
        ret.setCaseContent(content);
        return ret;
    }

    /**
     * 更新json体
     *
     * @param node   树
     * @param addSet 需要新增caseId的set
     * @param rmSet  需要删减caseId的set
     */
    private void updateDFS(DirNodeDto node, String caseId, Set<String> addSet, Set<String> rmSet) {
        if (CollectionUtils.isEmpty(node.getChildren())) {
            return;
        }

        for (int i = 0; i < node.getChildren().size(); i++) {
            DirNodeDto childNode = node.getChildren().get(i);
            if (addSet.contains(childNode.getId())) {
                childNode.getCaseIds().add(caseId);
            }
            if (rmSet.contains(childNode.getId())) {
                childNode.getCaseIds().remove(caseId);
            }
            updateDFS(childNode, caseId, addSet, rmSet);
        }
    }

    /**
     * dir-封装一下树的开头，这样树的头结点也可以进行插入
     */
    private DirNodeDto packageTree(DirNodeDto node) {
        DirNodeDto pack = new DirNodeDto();
        pack.getChildren().add(node);
        return pack;
    }

    /**
     * 更新文件夹
     *
     * @param testCase 测试用例
     * @param tree     树
     */
    public void updateBiz(TestCase testCase, DirNodeDto tree) {
        Biz biz = bizMapper.selectOne(testCase.getProductLineId(), testCase.getChannel());
        biz.setContent(JSON.toJSONString(tree));
        biz.setGmtModified(new Date());
        bizMapper.update(biz);
    }

}
