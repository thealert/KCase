package com.xiaoju.framework.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author liwei02
 * @date 2024/06/21 11:48
 * @description
 */

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SingleVersionInfo {

    /**
     * 版本号
     */
    private String versionCode;

    /**
     * 版本类型
     */
    private String type;

    /**
     * 回归测试时间
     */
    private String regressionTestDate;

}
