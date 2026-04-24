package com.xiaoju.framework.service.impl;

import com.xiaoju.framework.service.Demo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class DemoImpl implements Demo {

    @Autowired
    private StringRedisTemplate redisTemplate;
    @Override
    public void test() {
        redisTemplate.hashCode();
    }
}
