package com.xiaoju.framework.handler;

import com.xiaoju.framework.util.TimeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.Date;
import java.util.Map;

public class MyHandshakeInterceptor implements HandshakeInterceptor {

    protected static final Logger LOGGER = LoggerFactory.getLogger(MyHandshakeInterceptor.class);
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        System.out.println("握手开始");
//        ServletServerHttpRequest ssreq = (ServletServerHttpRequest)request;
//        ServletServerHttpResponse ssres = (ServletServerHttpResponse)response;
//        HttpServletRequest req = ssreq.getServletRequest();
//        //HttpServletResponse res = ssres.getServletResponse();
//        HttpSession session = req.getSession();
//        LOGGER.info ("session max timeout"+session.getMaxInactiveInterval());

        // 获得请求参数

        // 放入属性域
        attributes.put("TC", TimeUtil.toString(new Date()));
        attributes.put("hb", System.currentTimeMillis());
        return true;

    }

    /**
     * 握手后
     *
     * @param request
     * @param response
     * @param wsHandler
     * @param exception
     */
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        System.out.println("握手完成");
    }
}
