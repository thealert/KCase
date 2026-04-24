package com.xiaoju.framework.entity.request.analysis;

import lombok.Data;

import java.util.Date;

/**
 * 用例 筛选与查询
 *
 * @author hcy
 * @date 2020/8/12
 */
@Data
public class AnalyQueryReq {

    private Long id;

    private Integer caseType;

    private Long lineId;


    private Integer channel;


    private Integer pageNum;

    private Integer pageSize;

    private String businessNames;
    private String iteratorNames;

    private String beginTime;
    private String endTime;

    public AnalyQueryReq(Integer caseType,Integer channel,  Long lineId,Integer pageNum, Integer pageSize,
                         String businessNames, String iteratorNames,String beginTime,String endTime) {
        this.caseType = caseType;
        this.channel = channel;

        this.lineId = lineId;
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        this.businessNames=businessNames;
        this.iteratorNames=iteratorNames;
        this.beginTime=beginTime;
        this.endTime=endTime;

    }
}
