package com.xiaoju.framework.entity.response.records;

import lombok.Data;

import java.util.Date;

@Data
public class PrviewListResp {
    private Long id;

    private String title;

    private String creator;

    /**
     * 任务id，该字段做保留
     */
    private Long recordId;

    /**
     * 用例id
     */
    private Long caseId;

    /**
     * 责任人
     */
    private String owner;

    /**
     * 执行人列表  以逗号分隔
     */
    private String executors;

    private Integer review_result;

    /**
     * 用例总数，progress=4不会计入
     */
    private Integer totalNum;

    /**
     * 圈选用例内容
     */
    private String chooseContent;

    /**
     * 创建时间
     */
    private Long createTime;

    /**
     * 计划周期-开始时间
     */
    private Date expectStartTime;

    /**
     * 计划周期-结束时间
     */
    private Date expectEndTime;

    /**
     * 用例描述
     */
    private String description;
}
