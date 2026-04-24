package com.xiaoju.framework.entity.response.controller;

import lombok.Data;

/**
 * controller层统一响应体
 *
 * @author didi
 * @date 2020/9/24
 */
@Data
public class BaseResponse<T> {

    /**
     * 是否成功
     */
    private boolean ok;

    /**
     * 错误码
     */
    private Integer errorCode;

    /**
     * 描述信息
     */
    private String errorMsg;

    private T data;

    public BaseResponse() {
        this.errorCode = 0;
    }

    public static <T> BaseResponse<T> build(int status, String msg) {
        return build(status, msg, null);
    }

    public static <T> BaseResponse<T> build(int errorCode, String msg, T data) {
        BaseResponse<T> response = new BaseResponse<>();
        response.setErrorCode(errorCode);
        response.setErrorMsg(msg);
        response.setData(data);
        return response;
    }

    public static <T> BaseResponse<T> success(T data) {
        return build(0, "", data);
    }
}
