package com.xiaoju.framework.entity.request.cases;

import com.xiaoju.framework.entity.request.ParamValidate;
import lombok.Data;

@Data
public class CaseBackupSynReq implements ParamValidate {

    private Long caseId;

    private  Long historyId;

    @Override
    public void validate() {
        if (caseId == null || caseId <= 0) {
            throw new IllegalArgumentException("用例id为空");
        }
        if (historyId == null || historyId <= 0) {
            throw new IllegalArgumentException("Backup用例id为空");
        }
    }
}
