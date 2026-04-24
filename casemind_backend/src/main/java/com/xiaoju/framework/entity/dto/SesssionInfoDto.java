package com.xiaoju.framework.entity.dto;

import com.xiaoju.framework.util.SeeeionUtil;
import lombok.Data;

@Data
public class SesssionInfoDto {
    private String caseId ;
    private String recordId;
    private String username;
    private String caseTitle;
    private String recordTitle;
    private String sessionId;
    private String creatTime;
    private double sizeLimit;

    public SesssionInfoDto(String caseId,String recordId,String username,String caseTitle,String recordTitle,
                           String sessionId, String creatTime,double sizeLimit){
        this.caseId=caseId;
        this.recordId=recordId;
        this.username=username;
        this.caseTitle=caseTitle;
        this.recordTitle=recordTitle;
        this.sessionId=sessionId;
        this.creatTime=creatTime;
        this.sizeLimit=sizeLimit;
    }
}
