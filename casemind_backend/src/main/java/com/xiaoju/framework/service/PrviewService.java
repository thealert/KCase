package com.xiaoju.framework.service;

import com.xiaoju.framework.entity.request.prview.PrviewAddReq;
import com.xiaoju.framework.entity.request.record.RecordAddReq;
import com.xiaoju.framework.entity.response.records.PrviewListResp;
import com.xiaoju.framework.entity.response.records.RecordListResp;

import java.util.List;

public interface PrviewService {
    Long addRecord(PrviewAddReq req);

    List<PrviewListResp> getListByCaseId(Long caseId);
}
