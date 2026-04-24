package com.xiaoju.framework.service.impl;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.xiaoju.framework.service.DifyApiService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OpenAiDifyApiServiceImpl implements DifyApiService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OpenAiDifyApiServiceImpl.class);

    private static final long SSE_TIMEOUT = 180_000L;
    private static final long HEARTBEAT_LIMIT = 300L;
    private static final int MAX_HISTORY_MESSAGES = 20;
    private static final String DEFAULT_SYSTEM_PROMPT = "你是测试用例助手。严格遵循用户给出的输出格式要求，不要补充额外解释。";

    private final ExecutorService streamExecutor = Executors.newCachedThreadPool();
    private final Map<String, List<JSONObject>> conversationStore = new ConcurrentHashMap<>();

    @Value("${ai.openai.base-url:https://api.openai.com}")
    private String openAiBaseUrl;

    @Value("${ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${ai.openai.model-name:}")
    private String openAiModelName;

    @Value("${ai.openai.chat-completions-path:/v1/chat/completions}")
    private String openAiChatCompletionsPath;

    @Override
    public void feedBack(String msgId, String rating, String creator) {
        LOGGER.info("AI feedback received. msgId={}, rating={}, creator={}", msgId, rating, creator);
    }

    @Override
    public boolean clearConversation(String conversationId) {
        if (StringUtils.isBlank(conversationId)) {
            return false;
        }
        List<JSONObject> removed = conversationStore.remove(conversationId);
        int removedSize = removed == null ? 0 : removed.size();
        LOGGER.info("Conversation cleared. conversationId={}, removedMessages={}", conversationId, removedSize);
        return removed != null;
    }

    @Override
    public SseEmitter invokeDifyApi(String queryType, String answerType, String conversationId, String creator, String query,
                                    String imageBase64, String imageContentType) {
        final SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        final AtomicBoolean connectionActive = new AtomicBoolean(true);
        final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor();
        final String normalizedConversationId = StringUtils.isBlank(conversationId) ? UUID.randomUUID().toString() : conversationId;
        final int parsedQueryType = parseInt(queryType, 2);
        final int parsedAnswerType = parseInt(answerType, 0);

        startHeartbeat(emitter, heartbeatExecutor, connectionActive);
        registerEmitterLifecycle(emitter, heartbeatExecutor, connectionActive);

        streamExecutor.submit(() -> streamOpenAiResponse(
                emitter,
                heartbeatExecutor,
                connectionActive,
                normalizedConversationId,
                creator,
                parsedQueryType,
                parsedAnswerType,
                query,
                imageBase64,
                imageContentType
        ));

        return emitter;
    }

    private void startHeartbeat(SseEmitter emitter, ScheduledExecutorService heartbeatExecutor, AtomicBoolean connectionActive) {
        AtomicInteger heartbeatCount = new AtomicInteger(0);
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            if (!connectionActive.get()) {
                return;
            }
            try {
                int count = heartbeatCount.incrementAndGet();
                JSONObject heartbeat = new JSONObject();
                heartbeat.put("event", "heartbeat");
                heartbeat.put("timestamp", System.currentTimeMillis());
                heartbeat.put("count", count);
                emitter.send(heartbeat.toJSONString());
                if (count >= HEARTBEAT_LIMIT) {
                    connectionActive.set(false);
                    heartbeatExecutor.shutdown();
                }
            } catch (Exception e) {
                LOGGER.warn("Error sending heartbeat", e);
                connectionActive.set(false);
                heartbeatExecutor.shutdown();
            }
        }, 1, 1, TimeUnit.SECONDS);
    }

    private void registerEmitterLifecycle(SseEmitter emitter, ScheduledExecutorService heartbeatExecutor, AtomicBoolean connectionActive) {
        emitter.onCompletion(() -> {
            connectionActive.set(false);
            heartbeatExecutor.shutdown();
        });
        emitter.onTimeout(() -> {
            connectionActive.set(false);
            heartbeatExecutor.shutdown();
            emitter.complete();
        });
        emitter.onError((throwable) -> {
            connectionActive.set(false);
            heartbeatExecutor.shutdown();
            LOGGER.warn("SSE emitter error: {}", throwable.getMessage());
        });
    }

    private void streamOpenAiResponse(SseEmitter emitter,
                                      ScheduledExecutorService heartbeatExecutor,
                                      AtomicBoolean connectionActive,
                                      String conversationId,
                                      String creator,
                                      int queryType,
                                      int answerType,
                                      String query,
                                      String imageBase64,
                                      String imageContentType) {
        HttpURLConnection connection = null;
        BufferedReader reader = null;
        String prompt = AiPromptBuilder.buildPrompt(queryType, answerType, query);
        StringBuilder assistantReply = new StringBuilder();
        String messageId = UUID.randomUUID().toString();

        try {
            validateOpenAiConfig();

            JSONObject requestBody = buildRequestBody(conversationId, creator, prompt, imageBase64, imageContentType);
            URL url = new URL(buildChatCompletionsUrl());
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout((int) SSE_TIMEOUT);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "text/event-stream");
            connection.setRequestProperty("Authorization", "Bearer " + openAiApiKey);

            try (OutputStream outputStream = connection.getOutputStream()) {
                outputStream.write(requestBody.toJSONString().getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            }

            int statusCode = connection.getResponseCode();
            InputStream inputStream = statusCode >= 200 && statusCode < 300
                    ? connection.getInputStream()
                    : connection.getErrorStream();

            if (inputStream == null) {
                throw new IllegalStateException("AI 请求没有返回内容");
            }
            if (statusCode < 200 || statusCode >= 300) {
                throw new IllegalStateException("AI 请求失败: HTTP " + statusCode + " " + readStream(inputStream));
            }

            reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
            String line;
            while (connectionActive.get() && (line = reader.readLine()) != null) {
                if (line.isEmpty() || !line.startsWith("data:")) {
                    continue;
                }

                String data = line.substring(5).trim();
                if ("[DONE]".equals(data)) {
                    break;
                }

                handleStreamChunk(emitter, conversationId, assistantReply, data);
            }

            saveConversation(conversationId, creator, prompt, imageBase64, imageContentType, assistantReply.toString());

            JSONObject endMessage = new JSONObject();
            endMessage.put("event", "message_end");
            endMessage.put("message_id", messageId);
            endMessage.put("conversation_id", conversationId);
            emitter.send(endMessage.toJSONString());
            emitter.complete();
        } catch (Exception e) {
            LOGGER.error("Error streaming AI response", e);
            sendErrorAsMessage(emitter, conversationId, e.getMessage());
        } finally {
            connectionActive.set(false);
            heartbeatExecutor.shutdown();
            closeQuietly(reader);
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private void handleStreamChunk(SseEmitter emitter, String conversationId, StringBuilder assistantReply, String data) throws Exception {
        JSONObject chunk = JSONObject.parseObject(data);
        JSONArray choices = chunk.getJSONArray("choices");
        if (choices == null || choices.isEmpty()) {
            return;
        }

        JSONObject choice = choices.getJSONObject(0);
        JSONObject delta = choice.getJSONObject("delta");
        if (delta == null) {
            return;
        }

        String thinking = firstNonBlank(delta.getString("reasoning_content"), delta.getString("reasoning"));
        if (StringUtils.isNotBlank(thinking)) {
            JSONObject thinkingEvent = new JSONObject();
            thinkingEvent.put("event", "thinking");
            thinkingEvent.put("thinking", thinking);
            thinkingEvent.put("conversation_id", conversationId);
            emitter.send(thinkingEvent.toJSONString());
        }

        String content = extractContent(delta.get("content"));
        if (StringUtils.isBlank(content)) {
            return;
        }

        assistantReply.append(content);
        JSONObject messageEvent = new JSONObject();
        messageEvent.put("event", "message");
        messageEvent.put("answer", content);
        messageEvent.put("conversation_id", conversationId);
        emitter.send(messageEvent.toJSONString());
    }

    private JSONObject buildRequestBody(String conversationId, String creator, String prompt, String imageBase64, String imageContentType) {
        JSONObject requestBody = new JSONObject();
        requestBody.put("model", openAiModelName);
        requestBody.put("stream", true);
        requestBody.put("user", StringUtils.defaultIfBlank(creator, "anonymous"));
        requestBody.put("messages", buildMessages(conversationId, prompt, imageBase64, imageContentType));
        return requestBody;
    }

    private JSONArray buildMessages(String conversationId, String prompt, String imageBase64, String imageContentType) {
        JSONArray messages = new JSONArray();

        JSONObject systemMessage = new JSONObject();
        systemMessage.put("role", "system");
        systemMessage.put("content", DEFAULT_SYSTEM_PROMPT);
        messages.add(systemMessage);

        List<JSONObject> history = conversationStore.getOrDefault(conversationId, Collections.emptyList());
        for (JSONObject historyMessage : history) {
            messages.add(historyMessage);
        }

        messages.add(buildUserMessage(prompt, imageBase64, imageContentType));
        return messages;
    }

    private JSONObject buildUserMessage(String prompt, String imageBase64, String imageContentType) {
        JSONObject userMessage = new JSONObject();
        userMessage.put("role", "user");

        if (StringUtils.isNotBlank(imageBase64)) {
            JSONArray content = new JSONArray();

            JSONObject textPart = new JSONObject();
            textPart.put("type", "text");
            textPart.put("text", prompt);
            content.add(textPart);

            JSONObject imagePart = new JSONObject();
            imagePart.put("type", "image_url");
            JSONObject imageUrl = new JSONObject();
            imageUrl.put("url", "data:" + StringUtils.defaultIfBlank(imageContentType, "image/png") + ";base64," + imageBase64);
            imagePart.put("image_url", imageUrl);
            content.add(imagePart);

            userMessage.put("content", content);
        } else {
            userMessage.put("content", prompt);
        }
        return userMessage;
    }

    private void saveConversation(String conversationId, String creator, String prompt, String imageBase64,
                                  String imageContentType, String assistantReply) {
        List<JSONObject> history = conversationStore.computeIfAbsent(conversationId, key -> Collections.synchronizedList(new ArrayList<>()));
        history.add(buildUserMessage(prompt, imageBase64, imageContentType));

        JSONObject assistantMessage = new JSONObject();
        assistantMessage.put("role", "assistant");
        assistantMessage.put("content", assistantReply);
        history.add(assistantMessage);

        trimHistory(history);
        LOGGER.info("Conversation saved. conversationId={}, creator={}, historySize={}", conversationId, creator, history.size());
    }

    private void trimHistory(List<JSONObject> history) {
        while (history.size() > MAX_HISTORY_MESSAGES) {
            history.remove(0);
        }
    }

    private void sendErrorAsMessage(SseEmitter emitter, String conversationId, String errorMessage) {
        try {
            JSONObject messageEvent = new JSONObject();
            messageEvent.put("event", "message");
            messageEvent.put("answer", "AI 请求失败: " + StringUtils.defaultString(errorMessage, "未知错误"));
            messageEvent.put("conversation_id", conversationId);
            emitter.send(messageEvent.toJSONString());

            JSONObject endMessage = new JSONObject();
            endMessage.put("event", "message_end");
            endMessage.put("message_id", UUID.randomUUID().toString());
            endMessage.put("conversation_id", conversationId);
            emitter.send(endMessage.toJSONString());
            emitter.complete();
        } catch (Exception sendException) {
            LOGGER.warn("Failed to send SSE error message", sendException);
            emitter.completeWithError(sendException);
        }
    }

    private void validateOpenAiConfig() {
        if (StringUtils.isBlank(openAiApiKey)) {
            throw new IllegalStateException("未配置 ai.openai.api-key");
        }
        if (StringUtils.isBlank(openAiModelName)) {
            throw new IllegalStateException("未配置 ai.openai.model-name");
        }
    }

    private String buildChatCompletionsUrl() {
        String baseUrl = StringUtils.removeEnd(StringUtils.defaultString(openAiBaseUrl), "/");
        String path = StringUtils.defaultIfBlank(openAiChatCompletionsPath, "/v1/chat/completions");
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return baseUrl + path;
    }

    private int parseInt(String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (Exception ignored) {
            return defaultValue;
        }
    }

    private String extractContent(Object contentNode) {
        if (contentNode == null) {
            return "";
        }
        if (contentNode instanceof String) {
            return (String) contentNode;
        }
        if (contentNode instanceof JSONArray) {
            StringBuilder builder = new StringBuilder();
            JSONArray contentArray = (JSONArray) contentNode;
            for (int i = 0; i < contentArray.size(); i++) {
                JSONObject item = contentArray.getJSONObject(i);
                if (item != null && "text".equals(item.getString("type"))) {
                    builder.append(item.getString("text"));
                }
            }
            return builder.toString();
        }
        return String.valueOf(contentNode);
    }

    private String firstNonBlank(String first, String second) {
        return StringUtils.isNotBlank(first) ? first : second;
    }

    private String readStream(InputStream inputStream) throws Exception {
        StringBuilder builder = new StringBuilder();
        try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }

    private void closeQuietly(BufferedReader reader) {
        if (reader == null) {
            return;
        }
        try {
            reader.close();
        } catch (Exception ignored) {
        }
    }
}
