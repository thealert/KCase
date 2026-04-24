package com.xiaoju.framework.constants.enums;

/**
 * 脑图中，执行任务的执行结果枚举类
 *
 * @author didi
 * @date 2020/8/13
 */
public enum ProgressEnum {
    // 枚举类
    FAIL(1),
    ANDROID_FAIL(2),
    IOS_FAIL(3),
    WEB_FAIL(6),
    SERVER_FAIL(7),

    ANDROID_PASS(12),
    IOS_PASS(13),
    WEB_PASS(16),
    SERVER_PASS(17),

    ANDROID_PASS_IOS_FAIL(20),
    IOS_PASS_ANDROID_FAIL(21),


    IGNORE(4),
    BLOCK(5),
    SUCCESS(9),
    DEFAULT(0)
    ;

    private Integer progress;

    ProgressEnum(Integer progress) {
        this.progress = progress;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public static ProgressEnum findEnumByProgress(Integer progress) {
        for (ProgressEnum progressEnum : ProgressEnum.values()) {
            if (progressEnum.getProgress().equals(progress)) {
                return progressEnum;
            }
        }
        return DEFAULT;
    }
}