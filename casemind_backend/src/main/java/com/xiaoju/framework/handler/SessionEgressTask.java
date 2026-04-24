package com.xiaoju.framework.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class SessionEgressTask implements Runnable{
    protected static final Logger LOGGER = LoggerFactory.getLogger(SessionEgressTask.class);

    String type;
    String egressMsg;

    public SessionEgressTask(String name, String egressMsg) {
        this.type = name;
        this.egressMsg = egressMsg;
    }

    @Override
    public void run() {
        LOGGER.info("egress message: " + egressMsg);
//        if (excludeClient == null) {
//            broadcastOperations.sendEvent(name, egressMsg);
//        } else {
//            broadcastOperations.sendEvent(name, excludeClient, egressMsg);
//        }
    }
}
