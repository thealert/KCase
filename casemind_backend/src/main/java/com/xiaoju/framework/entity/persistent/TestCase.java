package com.xiaoju.framework.entity.persistent;

import lombok.Data;

import java.util.Date;
import java.util.List;

/**
 * 用例
 *
 * @author didi
 * @date 2019/7/12
 */
@Data
public class TestCase {
    private Long id;

    private Long groupId;

    private String title;

    private String description;

    private Integer isDelete;

    private String creator;

    private String modifier;

    private Date gmtCreated;

    private Date gmtModified;

    private String extra;

    private Long productLineId;

    private Integer caseType;

    private String caseContent;

    private  Integer case_extype;

    private String requirement_name;

    private Integer case_count;
    private Integer auto_case_count;
    private Integer ai_case_count;
    /**
     * 模块id 已经废弃
     */
    @Deprecated
    private Long moduleNodeId;

    private String requirementId ;

    /**
     * 冒烟用例id，目前冒烟用例已经集成到执行任务中，废弃
     */
    @Deprecated
    private Long smkCaseId;

    private  Long parentid;

    private  String parentname;

    private Integer channel;

    private String bizId;


    private String businessname;
    private  String iteratorname;

    private Integer firstTestSuccess;
    private Integer firstTestTotal;
    private Double  firstTestPassRate;

    private Integer firstExecTotal;
    private Double firstExecPassRate;

    private Integer RDTestSuccess;
    private Integer RDTestTotal;
    private Double  RDTestPassRate;

    private Integer SmokeTestSuccess;
    private Integer SmokeTestTotal;
    private Double  SmokeTestPassRate;

    private Integer CurTestSuccess;
    private Integer CurTestTotal;
    private Double  CurTestPassRate;
}