package com.xiaoju.framework.util;

import java.util.UUID;

/**
 * @author liwei02
 * @date 2021/01/21 14:35
 * @description
 */

public class UUIDUtil {

    /**
     * 随机生成 UUID
     * @return
     */
    public static String randomUUID() {
        return UUID.randomUUID().toString();
    }

    /**
     * 随机生成 UUID，不带连字符 "-"
     * @return
     */
    public static String randomUUIDWithoutHyphen() {
        return randomUUID().replace("-", "");
    }


}