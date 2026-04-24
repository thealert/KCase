package com.xiaoju.framework.entity.request.record;

import com.xiaoju.framework.entity.request.ParamValidate;
import lombok.Data;

@Data
public class RecordCapReq implements ParamValidate {

    private Long caseId;

    private Long recordId;

    private String capInfo;

    @Override
    public void validate() {
        if (caseId == null || caseId <= 0) {
            throw new IllegalArgumentException("用例id为空或者非法");
        }
        if (recordId == null || recordId <= 0) {
            throw new IllegalArgumentException("执行记录id为空或者非法");
        }
    }
}
