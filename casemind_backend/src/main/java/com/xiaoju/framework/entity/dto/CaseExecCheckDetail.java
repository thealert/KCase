package com.xiaoju.framework.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * @author liwei02
 * @date 2021/01/19 17:06
 * @description
 */

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CaseExecCheckDetail {

    /**
     * 版本号
     */
    private String clientVersion;

    /**
     * 客户端类型
     */
    private String clientType;

    /**
     * 部门
     */
    private String businessLine;

    /**
     * 模块
     */
    private String module;

    /**
     * 执行通过率
     */
    private BigDecimal passRate;

    /**
     * 执行通过标准
     */
    private BigDecimal passStandard;

    /**
     * 是否通过
     */
    private Boolean pass;

}
