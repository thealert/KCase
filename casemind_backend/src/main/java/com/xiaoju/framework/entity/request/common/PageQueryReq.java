package com.xiaoju.framework.entity.request.common;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * @author liwei02
 * @date 2020/11/19 10:05
 * @description 分页查询请求对象
 */

@Data
public class PageQueryReq implements Serializable {

    private static final long serialVersionUID = 2023144425335846470L;

    /**
     * 页码
     */
    @NotNull(message = "页码不能为空")
    private Integer pageNum;

    /**
     * 页大小
     */
    @NotNull(message = "每页大小不能为空")
    private Integer pageSize;
}
