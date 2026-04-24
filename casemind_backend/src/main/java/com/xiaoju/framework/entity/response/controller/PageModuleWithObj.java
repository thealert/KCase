package com.xiaoju.framework.entity.response.controller;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 分页
 *
 * @author didi
 * @date 2020/7/30
 */
@Data
public class PageModuleWithObj<T> implements Serializable {

    private static final long serialVersionUID = -3504431894726195820L;

    private List<T> dataSources;

    private Long total;

    private Object dataJson;

    public static <T> PageModuleWithObj<T> buildPage(List<T> dataSource, Long total, Object dataJson) {
        PageModuleWithObj<T> obj = new PageModuleWithObj<>();
        obj.setDataSources(dataSource);
        obj.setTotal(total);
        obj.setDataJson(dataJson);
        return obj;
    }

    public static <T> PageModuleWithObj<T> emptyPage() {
        PageModuleWithObj<T> obj = new PageModuleWithObj<>();
        obj.setDataSources(new ArrayList<>());
        obj.setTotal(0L);
        return obj;
    }
}
