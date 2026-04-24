package com.xiaoju.framework.entity.dto;

import lombok.Data;

import java.util.List;

/**
 * @author liwei02
 * @date 2024/06/14 14:16
 * @description
 */

@Data
public class StandardTestCase {

    /**
     * 一级分类
     */
    private String firstCategory;

    /**
     * 二级分类
     */
    private String secondCategory;

    /**
     * 前置条件
     */
    private String precondition;

    /**
     * 操作步骤
     */
    private String step;

    /**
     * 预期结果
     */
    private String expectResult;

    /**
     * 备注
     */
    private String remark;

    /**
     * 验证点
     */
    private String verifyPoint;

    /**
     * 附加字段
     */
    private List<String> extraFields;

}
