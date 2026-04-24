package com.xiaoju.framework.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
public class WebConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public RestTemplate restTemplateWithTimeOut() {
        RestTemplate restTemplate = new RestTemplate();
        HttpComponentsClientHttpRequestFactory httpRequestFactory = new HttpComponentsClientHttpRequestFactory();
        httpRequestFactory.setConnectionRequestTimeout(4000);
        httpRequestFactory.setConnectTimeout(4000);
        httpRequestFactory.setReadTimeout(10 * 1000);
        restTemplate.setRequestFactory(httpRequestFactory);
        return restTemplate;
    }

    @Bean
    public OncePerRequestFilter corsFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                String origin = request.getHeader("Origin");
                if (origin != null && !origin.isEmpty()) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Vary", "Origin");
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                    response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,DELETE,OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers") != null
                            ? request.getHeader("Access-Control-Request-Headers")
                            : "*");
                    response.setHeader("Access-Control-Max-Age", "3600");
                }

                if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    return;
                }

                filterChain.doFilter(request, response);
            }
        };
    }
}
