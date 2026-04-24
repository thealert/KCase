package com.xiaoju.framework.entity.response.cases;

import lombok.Data;

import java.util.Date;

/**
 * 用例的列表
 *
 * @author didi
 * @date 2020/8/18
 */
@Data
public class CaseListResp {

    /**
     * 用例id
     */
    private Long id;

    /**
     * 用例标题
     */
    private String title;

    /**
     * 用例描述
     */
    private String description;

    /**
     * 创建人
     */
    private String creator;

    /**
     * 修改人
     */
    private String modifier;

    /**
     * 创建时间
     */
    private Date gmtCreated;
    private Date gmtModified;

    /**
     * 业务线id
     */
    private Long productLineId;

    /**
     * 用例种类
     */
    private Integer caseType;

    /**
     * 需求id str
     */
    private String requirementId;

    /**
     * 渠道
     */
    private Integer channel;

    @Deprecated
    private Long groupId;

    /**
     * 每个用例下面的recordNum
     */
    private Integer recordNum;
    private Integer prviewNum;
    private Integer prviewDoneNum;
    private Integer captureNum;

    private  Integer case_extype;

    private String requirement_name;

    private  Long parentid;
    private  String parentname;
    private  Integer case_count;
    private  Integer auto_case_count;
    private Integer ai_case_count;

}
