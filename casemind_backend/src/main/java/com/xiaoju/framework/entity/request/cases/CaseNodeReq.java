package com.xiaoju.framework.entity.request.cases;

import com.xiaoju.framework.entity.dto.NodeDto;
import com.xiaoju.framework.entity.request.ParamValidate;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CaseNodeReq implements ParamValidate {


    private List<NodeDto> caseList;

    @Override
    public void validate() {
        if (caseList == null || caseList.size() == 0) {
            throw new IllegalArgumentException("caselist为空");
        }
    }
}
