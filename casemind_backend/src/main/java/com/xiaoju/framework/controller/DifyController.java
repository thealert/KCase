package com.xiaoju.framework.controller;

import com.xiaoju.framework.entity.response.controller.Response;
import com.xiaoju.framework.service.DifyApiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.annotation.Resource;
import javax.validation.constraints.NotNull;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin
@RequestMapping("/api/dify")
public class DifyController {

    private static final Logger LOGGER = LoggerFactory.getLogger(DifyController.class);

    @Resource
    private DifyApiService difyApiService;

    private static final Map<String, QueryData> QUERY_MAP = new ConcurrentHashMap<>();

    public static class QueryData {
        private final String query;
        private final String imageBase64;
        private final String imageContentType;

        public QueryData(String query, String imageBase64, String imageContentType) {
            this.query = query;
            this.imageBase64 = imageBase64;
            this.imageContentType = imageContentType;
        }

        public String getQuery() {
            return query;
        }

        public String getImageBase64() {
            return imageBase64;
        }

        public String getImageContentType() {
            return imageContentType;
        }

        public boolean hasImage() {
            return imageBase64 != null && !imageBase64.isEmpty();
        }
    }

    @PostMapping("/feedback")
    public Response<String> sendFeedBack(@RequestBody Map<String, String> body) {
        try {
            difyApiService.feedBack(body.get("msgId"), body.get("rating"), body.get("creator"));
            return Response.success("feedback success");
        } catch (Exception e) {
            LOGGER.error("Failed to send feedback", e);
            return Response.build(500, "反馈失败: " + e.getMessage());
        }
    }

    @PostMapping("/clear-conversation")
    public Response<String> clearConversation(@RequestBody(required = false) Map<String, String> body,
                                              @RequestParam(value = "conversationId", required = false) String conversationIdParam) {
        String conversationId = conversationIdParam;
        if ((conversationId == null || conversationId.isEmpty()) && body != null) {
            conversationId = body.get("conversationId");
        }
        if (conversationId == null || conversationId.isEmpty()) {
            return Response.build(400, "conversationId 不能为空");
        }
        try {
            boolean removed = difyApiService.clearConversation(conversationId);
            LOGGER.info("Clear conversation requested. conversationId={}, removed={}", conversationId, removed);
            return Response.success(removed ? "cleared" : "not_found");
        } catch (Exception e) {
            LOGGER.error("Failed to clear conversation", e);
            return Response.build(500, "清除会话失败: " + e.getMessage());
        }
    }

    @PostMapping("/save-query")
    public Response<String> saveQuery(@RequestParam("query") String query,
                                      @RequestParam(value = "img", required = false) MultipartFile img) {
        try {
            if (query == null || query.isEmpty()) {
                return Response.build(400, "请求参数错误：query不能为空");
            }

            String decodedQuery = URLDecoder.decode(query, StandardCharsets.UTF_8.name());
            String queryId = UUID.randomUUID().toString();
            QueryData queryData;

            if (img != null && !img.isEmpty()) {
                String imageBase64 = Base64.getEncoder().encodeToString(img.getBytes());
                queryData = new QueryData(decodedQuery, imageBase64, img.getContentType());
                LOGGER.info("Saved query with image. queryId={}, contentType={}", queryId, img.getContentType());
            } else {
                queryData = new QueryData(decodedQuery, null, null);
                LOGGER.info("Saved query. queryId={}", queryId);
            }

            QUERY_MAP.put(queryId, queryData);
            return Response.success(queryId);
        } catch (Exception e) {
            LOGGER.error("Failed to save query", e);
            return Response.build(500, "保存查询失败: " + e.getMessage());
        }
    }

    @GetMapping("/query")
    public SseEmitter query(@RequestParam(value = "queryType", required = false) String queryType,
                            @RequestParam(value = "modeltype", required = false) String modeltype,
                            @RequestParam @NotNull(message = "问答类型为空") String answerType,
                            @RequestParam @NotNull(message = "请求cid为空") String conversationId,
                            @RequestParam @NotNull(message = "请求用户为空") String creator,
                            @RequestParam @NotNull(message = "查询ID为空") String queryId) {
        QueryData queryData = QUERY_MAP.remove(queryId);
        if (queryData == null) {
            SseEmitter errorEmitter = new SseEmitter();
            try {
                errorEmitter.send(SseEmitter.event().name("error").data("查询不存在或已过期"));
                errorEmitter.complete();
            } catch (Exception e) {
                LOGGER.error("Error sending query-not-found event", e);
            }
            return errorEmitter;
        }

        String resolvedQueryType = resolveQueryType(queryType, modeltype, answerType);
        String resolvedAnswerType = resolveAnswerType(answerType, modeltype);
        if (queryData.hasImage()) {
            return difyApiService.invokeDifyApi(resolvedQueryType, resolvedAnswerType, conversationId, creator,
                    queryData.getQuery(), queryData.getImageBase64(), queryData.getImageContentType());
        }
        return difyApiService.invokeDifyApi(resolvedQueryType, resolvedAnswerType, conversationId, creator,
                queryData.getQuery(), null, null);
    }

    private String resolveQueryType(String queryType, String modeltype, String answerType) {
        if (queryType != null && !queryType.isEmpty()) {
            return queryType;
        }
        if ("2".equals(modeltype)) {
            return "1";
        }
        return "2".equals(answerType) ? "2" : "1";
    }

    private String resolveAnswerType(String answerType, String modeltype) {
        if ("0".equals(answerType) || "1".equals(answerType)) {
            return answerType;
        }
        return "2".equals(modeltype) ? "1" : "0";
    }
}
