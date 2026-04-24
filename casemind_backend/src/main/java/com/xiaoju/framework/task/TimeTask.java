package com.xiaoju.framework.task;

import com.xiaoju.framework.mapper.CaseBackupMapper;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;

@Component
public class TimeTask {
    @Resource
    private CaseBackupMapper caseBackupMapper;
    //定时任务 每天清除旧的历史备份记录
    @Scheduled(cron ="50 50 23 * * ?")
    public void clearTask() {
        int res=caseBackupMapper.clearBackup();
        System.out.println("Delete res : "+res );
    }

}
