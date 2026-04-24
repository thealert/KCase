package com.xiaoju.framework;

import com.xiaoju.framework.listener.IocCloseListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 启动类
 *
 * @author didi
 * @date 2020/11/26
 */
@SpringBootApplication
@EnableScheduling
public class CaseServerApplication {



	private static Logger LOGGER = LoggerFactory.getLogger(CaseServerApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(CaseServerApplication.class, args);
	}



}
