package com.xiaoju.framework.entity.request.common;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class ProxyReq {

    @NotNull(message = "url 不能为空")
    private String url;
}
