package com.xiaoju.framework.util;

import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.junit.Assert.*;

/**
 * GzipUtils 测试类
 * 用于验证 gzip 压缩解压功能
 */
public class GzipUtilsTest {
    
    private static final Logger LOGGER = LoggerFactory.getLogger(GzipUtilsTest.class);
    
    /**
     * 测试基本的压缩和解压
     */
    @Test
    public void testCompressAndDecompress() {
        String original = "这是一个测试字符串，用于验证 gzip 压缩和解压功能。" +
                "This is a test string for validating gzip compression and decompression.";
        
        // 压缩
        String compressed = GzipUtils.compress(original);
        assertNotNull("压缩结果不应为 null", compressed);
        LOGGER.info("原始字符串长度: {}", original.length());
        LOGGER.info("压缩后长度: {}", compressed.length());
        
        // 解压
        String decompressed = GzipUtils.decompress(compressed);
        assertNotNull("解压结果不应为 null", decompressed);
        assertEquals("解压后应该与原始字符串相同", original, decompressed);
        
        LOGGER.info("基本压缩解压测试通过 ✓");
    }
    
    /**
     * 测试大型 JSON 数据的压缩
     */
    @Test
    public void testCompressLargeJson() {
        StringBuilder jsonBuilder = new StringBuilder("{\"type\":\"edit\",\"data\":{\"root\":{\"children\":[");
        
        // 生成大量节点数据
        for (int i = 0; i < 1000; i++) {
            jsonBuilder.append("{\"id\":\"node").append(i).append("\",")
                    .append("\"data\":{\"text\":\"测试节点").append(i).append("\",\"created\":1234567890},")
                    .append("\"children\":[]}");
            if (i < 999) {
                jsonBuilder.append(",");
            }
        }
        jsonBuilder.append("]}}}");
        
        String largeJson = jsonBuilder.toString();
        int originalSize = largeJson.getBytes().length;
        
        // 压缩
        long startTime = System.currentTimeMillis();
        String compressed = GzipUtils.compress(largeJson);
        long compressTime = System.currentTimeMillis() - startTime;
        
        assertNotNull("压缩结果不应为 null", compressed);
        int compressedSize = compressed.getBytes().length;
        double compressionRatio = (1 - (double) compressedSize / originalSize) * 100;
        
        LOGGER.info("大型 JSON 测试:");
        LOGGER.info("  原始大小: {} bytes", originalSize);
        LOGGER.info("  压缩后大小: {} bytes", compressedSize);
        LOGGER.info("  压缩率: {:.2f}%", compressionRatio);
        LOGGER.info("  压缩耗时: {} ms", compressTime);
        
        // 解压
        startTime = System.currentTimeMillis();
        String decompressed = GzipUtils.decompress(compressed);
        long decompressTime = System.currentTimeMillis() - startTime;
        
        assertNotNull("解压结果不应为 null", decompressed);
        assertEquals("解压后应该与原始 JSON 相同", largeJson, decompressed);
        
        LOGGER.info("  解压耗时: {} ms", decompressTime);
        LOGGER.info("大型 JSON 压缩解压测试通过 ✓");
    }
    
    /**
     * 测试前端格式的消息解压
     */
    @Test
    public void testDecompressIfNeeded() {
        String originalMessage = "{\"type\":\"edit\",\"data\":{\"caseContent\":\"test content\",\"caseVersion\":1}}";
        
        // 1. 测试未压缩消息
        String result1 = GzipUtils.decompressIfNeeded(originalMessage);
        assertEquals("未压缩消息应原样返回", originalMessage, result1);
        LOGGER.info("未压缩消息测试通过 ✓");
        
        // 2. 测试压缩消息
        String compressed = GzipUtils.compress(originalMessage);
        String wrappedMessage = "{\"compressed\":true,\"data\":\"" + compressed + "\"}";
        
        String result2 = GzipUtils.decompressIfNeeded(wrappedMessage);
        assertEquals("压缩消息应正确解压", originalMessage, result2);
        LOGGER.info("压缩消息测试通过 ✓");
        
        // 3. 测试空消息
        String result3 = GzipUtils.decompressIfNeeded("");
        assertEquals("空消息应原样返回", "", result3);
        LOGGER.info("空消息测试通过 ✓");
        
        // 4. 测试 null 消息
        String result4 = GzipUtils.decompressIfNeeded(null);
        assertNull("null 消息应返回 null", result4);
        LOGGER.info("null 消息测试通过 ✓");
    }
    
    /**
     * 测试压缩包装功能
     */
    @Test
    public void testCompressAndWrap() {
        String message = "{\"type\":\"test\",\"data\":\"This is a test message\"}";
        
        String wrapped = GzipUtils.compressAndWrap(message);
        assertNotNull("包装结果不应为 null", wrapped);
        assertTrue("应包含 compressed 标识", wrapped.contains("\"compressed\":true"));
        assertTrue("应包含 data 字段", wrapped.contains("\"data\":"));
        
        // 验证可以正确解压
        String decompressed = GzipUtils.decompressIfNeeded(wrapped);
        assertEquals("解压后应与原始消息相同", message, decompressed);
        
        LOGGER.info("压缩包装测试通过 ✓");
    }
    
    /**
     * 性能压力测试
     */
    @Test
    public void testPerformance() {
        String testMessage = generateLargeMessage(50 * 1024); // 50KB
        
        int iterations = 100;
        long totalCompressTime = 0;
        long totalDecompressTime = 0;
        
        for (int i = 0; i < iterations; i++) {
            // 压缩
            long startTime = System.nanoTime();
            String compressed = GzipUtils.compress(testMessage);
            totalCompressTime += System.nanoTime() - startTime;
            
            // 解压
            startTime = System.nanoTime();
            GzipUtils.decompress(compressed);
            totalDecompressTime += System.nanoTime() - startTime;
        }
        
        double avgCompressTime = totalCompressTime / 1000000.0 / iterations;
        double avgDecompressTime = totalDecompressTime / 1000000.0 / iterations;
        
        LOGGER.info("性能测试 ({}KB 消息, {} 次迭代):", testMessage.length() / 1024, iterations);
        LOGGER.info("  平均压缩时间: {:.2f} ms", avgCompressTime);
        LOGGER.info("  平均解压时间: {:.2f} ms", avgDecompressTime);
        
        assertTrue("压缩时间应合理 (< 50ms)", avgCompressTime < 50);
        assertTrue("解压时间应合理 (< 50ms)", avgDecompressTime < 50);
        
        LOGGER.info("性能测试通过 ✓");
    }
    
    /**
     * 生成指定大小的测试消息
     */
    private String generateLargeMessage(int targetSize) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":\"edit\",\"data\":{\"root\":{\"children\":[");
        
        while (sb.length() < targetSize) {
            sb.append("{\"id\":\"node_").append(System.nanoTime()).append("\",")
                    .append("\"data\":{\"text\":\"测试节点数据\",\"created\":").append(System.currentTimeMillis()).append("},")
                    .append("\"children\":[]},");
        }
        
        // 移除最后的逗号并闭合 JSON
        if (sb.charAt(sb.length() - 1) == ',') {
            sb.setLength(sb.length() - 1);
        }
        sb.append("]}}}");
        
        return sb.toString();
    }
    
    /**
     * 主方法 - 运行所有测试
     */
    public static void main(String[] args) {
        GzipUtilsTest test = new GzipUtilsTest();
        
        LOGGER.info("===== 开始 GzipUtils 测试 =====\n");
        
        try {
            test.testCompressAndDecompress();
            System.out.println();
            
            test.testCompressLargeJson();
            System.out.println();
            
            test.testDecompressIfNeeded();
            System.out.println();
            
            test.testCompressAndWrap();
            System.out.println();
            
            test.testPerformance();
            System.out.println();
            
            LOGGER.info("===== 所有测试通过！ ✓✓✓ =====");
        } catch (Exception e) {
            LOGGER.error("测试失败: " + e.getMessage(), e);
        }
    }
}
