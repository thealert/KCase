package com.xiaoju.framework.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface DifyApiService {
    SseEmitter invokeDifyApi(String queryType, String answerType, String conversationId, String creator, String query,
                             String imageBase64, String imageContentType);

    void feedBack(String msgId, String rating, String creator);

    boolean clearConversation(String conversationId);
}
