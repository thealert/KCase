package com.xiaoju.framework.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.MultiValueMap;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

public class SeeeionUtil {

    private static Logger LOGGER = LoggerFactory.getLogger(SeeeionUtil.class);
    public static String getQueryParam(WebSocketSession session,String name){
        URI uri = session.getUri();
        try {
            UriComponents uc = UriComponentsBuilder.fromUri(uri).build();
            MultiValueMap<String, String> params = uc.getQueryParams();
            String param_val =params.getFirst(name);
            return param_val;
        } catch (Exception e) {
            LOGGER.error("解析参数失败", uri, e);
        }
        return null;
    }
}
