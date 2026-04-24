package com.xiaoju.framework.entity.request.analysis;

import lombok.Data;

/**
 * 用例 筛选与查询
 *
 * @author hcy
 * @date 2020/8/12
 */
@Data
public class AnalyQueryReqV2 {

    private Long id;

    private Integer caseType;

    private Long lineId;

    private Integer channel;

    private Integer pageNum;

    private Integer pageSize;


    private String beginTime;
    private String endTime;

    public AnalyQueryReqV2(Integer caseType, Integer channel, Long lineId, Integer pageNum, Integer pageSize,
                           String beginTime, String endTime) {
        this.caseType = caseType;
        this.channel = channel;
        this.lineId = lineId;
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        this.beginTime=beginTime;
        this.endTime=endTime;

    }
}
