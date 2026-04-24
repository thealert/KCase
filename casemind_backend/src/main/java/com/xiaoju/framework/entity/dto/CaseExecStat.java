package com.xiaoju.framework.entity.dto;

import lombok.Data;

/**
 * @author liwei02
 * @date 2024/06/21 18:44
 * @description
 */

@Data
public class CaseExecStat {

    private String businessLine;

    private String clientVersion;

    private String caseExecSetName;

    private int androidInitCount;

    private int androidPassCount;

    private int androidFailCount;

    private int iosInitCount;

    private int iosPassCount;

    private int iosFailCount;

    public void addAndroidInitCount() {
        androidInitCount++;
    }

    public void addAndroidPassCount() {
        androidPassCount++;
    }

    public void addAndroidFailCount() {
        androidFailCount++;
    }

    public void addIosInitCount() {
        iosInitCount++;
    }

    public void addIosPassCount() {
        iosPassCount++;
    }

    public void addIosFailCount() {
        iosFailCount++;
    }

}
