package com.xiaoju.framework.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author liwei02
 * @date 2021/01/19 17:06
 * @description
 */

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CaseExecStatistics {

    /**
     * 业务线
     */
    private String businessLine;

    /**
     * 模块
     */
    private String module;

    /**
     * android 执行通过数量
     */
    private Integer androidPassedCount;

    /**
     * ios 执行通过数量
     */
    private Integer iosPassedCount;

    /**
     * 总数量
     */
    private Integer totalCount;

    public void addTotalCount(Integer count) {
        this.totalCount += count;
    }

    public void addAndroidPassedCount(Integer count) {
        this.androidPassedCount += count;
    }

    public void addIOSPassedCount(Integer count) {
        this.iosPassedCount += count;
    }

}
