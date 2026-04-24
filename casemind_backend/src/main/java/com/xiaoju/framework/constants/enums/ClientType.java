package com.xiaoju.framework.constants.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.lang.Nullable;

import java.util.HashMap;
import java.util.Map;

/**
 * @author liwei02
 * @date 2022/04/07 20:44
 * @description
 */

@Getter
@AllArgsConstructor
public enum ClientType {

    ANDROID("android", "Android"),
    IOS("ios", "iOS");

    /**
     * 类型
     */
    private String type;

    /**
     * 名称
     */
    private String officialName;

    private static final Map<String, ClientType> mappings = new HashMap<>(16);

    static {
        for (ClientType clientType : values()) {
            mappings.put(clientType.getType(), clientType);
        }
    }

    /**
     * 枚举值解析为枚举
     * @param type type
     * @return
     */
    @Nullable
    public static ClientType resolve(@Nullable String type) {
        return (type != null ? mappings.get(type) : null);
    }
}
