package com.xiaoju.framework.util;

import com.alibaba.fastjson.JSONObject;

public class JsonUtil {
    public static  String  buildJsonMsg(String type,String content){
        JSONObject jo = new JSONObject();
        jo.put("type", type);
        jo.put("data", content);
        return jo.toJSONString();
    }

    public static  String  buildJsonMsg(String type,String content,String exinfo){
        JSONObject jo = new JSONObject();
        jo.put("type", type);
        jo.put("data", content);
        jo.put("exinfo", exinfo);
        return jo.toJSONString();
    }
}
