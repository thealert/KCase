package com.xiaoju.framework.service.impl;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.xiaoju.framework.constants.enums.EnvEnum;
import com.xiaoju.framework.constants.enums.StatusCode;
import com.xiaoju.framework.entity.dto.MergeCaseDto;
import com.xiaoju.framework.entity.dto.PickCaseDto;
import com.xiaoju.framework.entity.exception.CaseServerException;
import com.xiaoju.framework.entity.persistent.ExecRecord;
import com.xiaoju.framework.entity.persistent.PrviewRecord;
import com.xiaoju.framework.entity.persistent.TestCase;
import com.xiaoju.framework.entity.request.prview.PrviewAddReq;
import com.xiaoju.framework.entity.request.record.RecordAddReq;
import com.xiaoju.framework.entity.response.records.PrviewListResp;
import com.xiaoju.framework.entity.response.records.RecordListResp;
import com.xiaoju.framework.entity.xmind.IntCount;
import com.xiaoju.framework.mapper.PrviewRecordMapper;
import com.xiaoju.framework.mapper.TestCaseMapper;
import com.xiaoju.framework.service.PrviewService;
import com.xiaoju.framework.util.TreeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import java.util.*;

import static com.xiaoju.framework.constants.SystemConstant.EMPTY_STR;
import static com.xiaoju.framework.constants.SystemConstant.NOT_DELETE;
import static com.xiaoju.framework.util.TimeUtil.compareToOriginalDate;

@Service
public class PrviewServiceImpl implements PrviewService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RecordServiceImpl.class);

    private static final String OE_PICK_ALL = "\"priority\":[\"0\"]";

    private static final Integer DEFAULT_ENV = 0;

    @Resource
    private TestCaseMapper caseMapper;

    @Resource
    private PrviewRecordMapper prviewMapper;
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long addRecord(PrviewAddReq req) {
        JSONObject merged = getData(new MergeCaseDto(req.getCaseId(), req.getChooseContent(), EMPTY_STR, DEFAULT_ENV, 0L));
        PrviewRecord record = buildPrivewRecord(req, merged);
        return prviewMapper.insert(record);
    }

    @Override
    public List<PrviewListResp> getListByCaseId(Long caseId) {
        List<PrviewListResp> res = new ArrayList<>();
        TestCase testCase = caseMapper.selectOne(caseId);
        if (testCase == null) {
            throw new CaseServerException("用例不存在", StatusCode.NOT_FOUND_ENTITY);
        }

        List<PrviewRecord> prviewRecordList = prviewMapper.getRecordListByCaseId(caseId);
        for (PrviewRecord record : prviewRecordList) {
            res.add(buildList(record));
        }
        return res;
    }

    private PrviewListResp buildList(PrviewRecord record) {
        PrviewListResp resp = new PrviewListResp();
        resp.setId(record.getId());
        resp.setRecordId(record.getId());
        resp.setCaseId(record.getCaseId());
        resp.setTitle(record.getTitle());
        resp.setOwner(record.getOwner());
        resp.setCreator(record.getCreator());
        resp.setExecutors(record.getExecutors());
        resp.setReview_result(record.getReview_result());

        // 其实本质上不能通过数据库去获取，因为还需要考虑chooseContent
        JSONObject object = getData(new MergeCaseDto(record.getCaseId(), record.getChooseContent(), record.getCaseContent(), 0, 0L));

        resp.setTotalNum(object.getInteger("totalCount"));
        resp.setChooseContent(record.getChooseContent());
        resp.setCreateTime(record.getGmtCreated().getTime());
        resp.setDescription(record.getDescription());
        resp.setExpectStartTime(
                compareToOriginalDate(record.getExpectStartTime()) ? null : record.getExpectStartTime());
        resp.setExpectEndTime(
                compareToOriginalDate(record.getExpectEndTime()) ? null : record.getExpectEndTime());
        return resp;
    }

    private PrviewRecord buildPrivewRecord(PrviewAddReq req, JSONObject merged) {
        PrviewRecord record = new PrviewRecord();
        // 统计信息传入

        record.setTotalCount(merged.getInteger("totalCount"));
        // 基础信息传入
        record.setTitle(req.getTitle());
        record.setCaseId(req.getCaseId());
        record.setIsDelete(NOT_DELETE);
        record.setCaseContent(EMPTY_STR);
        record.setCreator(req.getCreator());
        record.setModifier(EMPTY_STR);
        record.setGmtCreated(new Date());
        record.setGmtModified(new Date());
        record.setChooseContent(StringUtils.isEmpty(req.getChooseContent()) ? EMPTY_STR : req.getChooseContent());
        record.setDescription(StringUtils.isEmpty(req.getDescription()) ? EMPTY_STR : req.getDescription());
        record.setExecutors(EMPTY_STR);
        record.setOwner(req.getOwner());
        record.setReview_result(0);

        if (req.getExpectStartTime() != null) {
            // 就是说这里是有日期区间的
            record.setExpectStartTime(new Date(req.getExpectStartTime()/1000*1000));
            record.setExpectEndTime(new Date(req.getExpectEndTime()/1000*1000));
        } else {
            // 没有区间设置默认值
            record.setExpectStartTime(new Date(31507200000L));
            record.setExpectEndTime(new Date(31507200000L));
        }
        return record;
    }
    public JSONObject getData(MergeCaseDto dto) {
        String websocketCaseContent = null;
        if (dto.getRecordId() > 0L) {
//            websocketCaseContent = WebSocket.getRoom(false, BitBaseUtil.mergeLong(dto.getRecordId(), dto.getCaseId())).getTestCaseContent();
        }

        String caseContent = caseMapper.selectOne(dto.getCaseId()).getCaseContent();
        JSONObject content = JSON.parseObject(caseContent);
        if (websocketCaseContent != null) {
            JSONObject websocketContent = JSON.parseObject(websocketCaseContent);
            long currentBase = websocketContent.getLong("base");
            content.put("base", currentBase);
        }

        // 如果不是全部圈选的圈选条件
        if (!StringUtils.isEmpty(dto.getChooseContent()) && !dto.getChooseContent().contains(OE_PICK_ALL)) {
            PickCaseDto pickCaseDto = JSON.parseObject(dto.getChooseContent(), PickCaseDto.class);

            // 似乎是想用BFS做广度遍历
            JSONObject caseRoot = content.getJSONObject("root");
            Stack<JSONObject> objCheck = new Stack<>();
            Stack<IntCount> iCheck = new Stack<>();
            objCheck.push(caseRoot);

            //获取对应级别用例
            if (!CollectionUtils.isEmpty(pickCaseDto.getPriority())) {
                TreeUtil.getPriority(objCheck, iCheck, caseRoot, pickCaseDto.getPriority());
            }
            if (!CollectionUtils.isEmpty(pickCaseDto.getResource())) {
                TreeUtil.getChosenCase(caseRoot, new HashSet<>(pickCaseDto.getResource()), "resource");
            }
        } else {
            // 给未来的环境选择做好打算...
            if (EnvEnum.TestQaEnv.getValue().equals(dto.getEnv()) || EnvEnum.TestRdEnv.getValue().equals(dto.getEnv())) {
                // 似乎是想用BFS做广度遍历
                JSONObject caseRoot = content.getJSONObject("root");
                Stack<JSONObject> objCheck = new Stack<>();
                Stack<IntCount> iCheck = new Stack<>();
                objCheck.push(caseRoot);

                // 这里就是默认圈选全部用例
                TreeUtil.getPriority0(objCheck, iCheck, caseRoot);
            }
        }
        //合并用例
        String recordContent = dto.getRecordContent();
        JSONObject recordObj = new JSONObject();

        if (StringUtils.isEmpty(recordContent)) {
            // 脏数据，不管
        } else if (recordContent.startsWith("[{")) {
            for (Object o : JSON.parseArray(recordContent)) {
                recordObj.put(((JSONObject) o).getString("id"), ((JSONObject) o).getLong("progress"));
            }
        } else {
            recordObj = JSON.parseObject(recordContent);
        }

        IntCount execCount = new IntCount(recordObj.size());
        TreeUtil.mergeExecRecord(content.getJSONObject("root"), recordObj, execCount);
        return TreeUtil.parse(content.toJSONString());
    }
}
