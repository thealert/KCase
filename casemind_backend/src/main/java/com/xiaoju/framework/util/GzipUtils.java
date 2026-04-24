package com.xiaoju.framework.util;

import com.alibaba.fastjson.JSONException;
import com.alibaba.fastjson.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

/**
 * Gzip 压缩解压工具类
 * 用于处理前端 pako.gzip 压缩的数据
 */
public class GzipUtils {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(GzipUtils.class);
    
    /**
     * 使用 Gzip 压缩字符串
     * @param str 需要压缩的字符串
     * @return Base64 编码的压缩数据
     */
    public static String compress(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            GZIPOutputStream gzip = new GZIPOutputStream(out);
            gzip.write(str.getBytes(StandardCharsets.UTF_8));
            gzip.close();
            
            byte[] compressed = out.toByteArray();
            return Base64.getEncoder().encodeToString(compressed);
        } catch (IOException e) {
            LOGGER.error("Gzip 压缩失败: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 解压 Gzip 压缩的字符串
     * @param compressedStr Base64 编码的压缩数据
     * @return 解压后的原始字符串
     */
    public static String decompress(String compressedStr) {
        if (compressedStr == null || compressedStr.isEmpty()) {
            return compressedStr;
        }
        
        try {
            byte[] compressed = Base64.getDecoder().decode(compressedStr);
            
            ByteArrayInputStream in = new ByteArrayInputStream(compressed);
            GZIPInputStream gzip = new GZIPInputStream(in);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gzip.read(buffer)) > 0) {
                out.write(buffer, 0, len);
            }
            
            gzip.close();
            out.close();
            
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            LOGGER.error("Gzip 解压失败: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 检查并解压前端发送的消息
     * 如果消息是压缩格式（包含 compressed: true），则解压；否则返回原始消息
     * @param message 原始消息
     * @return 解压后的消息或原始消息
     */
    public static String decompressIfNeeded(String message) {
        if (message == null || message.isEmpty()) {
            return message;
        }
        
        try {
            // 尝试解析为 JSON 检查是否为压缩消息
            JSONObject json = JSONObject.parseObject(message);
            
            if (json.containsKey("compressed") && json.getBoolean("compressed")) {
                // 这是一个压缩消息
                String compressedData = json.getString("data");
                if (compressedData != null) {
                    LOGGER.info("检测到压缩消息，开始解压");
                    String decompressed = decompress(compressedData);
                    if (decompressed != null) {
                        LOGGER.info("消息解压成功，原始大小: {} bytes, 解压后大小: {} bytes", 
                            message.getBytes(StandardCharsets.UTF_8).length,
                            decompressed.getBytes(StandardCharsets.UTF_8).length);
                        return decompressed;
                    } else {
                        LOGGER.error("消息解压失败，返回原始消息");
                        return message;
                    }
                }
            }
            
            // 不是压缩消息，返回原始消息
            return message;
        } catch (JSONException e) {
            // 不是 JSON 格式，返回原始消息
            return message;
        }
    }
    
    /**
     * 压缩消息并包装成前端期望的格式
     * @param message 原始消息
     * @return 包装后的压缩消息 JSON
     */
    public static String compressAndWrap(String message) {
        if (message == null || message.isEmpty()) {
            return message;
        }
        
        String compressed = compress(message);
        if (compressed == null) {
            return message;
        }
        
        JSONObject wrapper = new JSONObject();
        wrapper.put("compressed", true);
        wrapper.put("data", compressed);
        
        return wrapper.toJSONString();
    }
}
