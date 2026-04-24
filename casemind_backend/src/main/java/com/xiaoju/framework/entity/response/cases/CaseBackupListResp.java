package com.xiaoju.framework.entity.response.cases;

import com.xiaoju.framework.entity.persistent.CaseBackup;
import lombok.Data;

import java.util.List;

@Data
public class CaseBackupListResp {

    private Integer totalCount;
    private List<CaseBackup> caseList;
}
