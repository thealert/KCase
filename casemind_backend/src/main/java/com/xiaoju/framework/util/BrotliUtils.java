package com.xiaoju.framework.util;

import com.aayushatharva.brotli4j.Brotli4jLoader;
import com.aayushatharva.brotli4j.decoder.Decoder;
import com.aayushatharva.brotli4j.decoder.DecoderJNI;
import com.aayushatharva.brotli4j.decoder.DirectDecompress;
import com.aayushatharva.brotli4j.encoder.Encoder;
import org.apache.commons.io.IOUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class BrotliUtils {
    static {
        Brotli4jLoader.ensureAvailability();
    }
    private static final Logger LOGGER = LoggerFactory.getLogger(BrotliUtils.class);


    public static byte[] brotliCompress(String input) {

        try {

            byte[] compressed = Encoder.compress(input.getBytes());

            return compressed;
        } catch (IOException e) {
            LOGGER.error("brotliCompress error "+e.toString());
            return null;
        }
    }

    // 解压Brotli压缩的数据
    public static String brotliDecompress(byte[] input)  {

        try  {
            DirectDecompress directDecompress = Decoder.decompress(input);
            if (directDecompress.getResultStatus() == DecoderJNI.Status.DONE) {
                return new String(directDecompress.getDecompressedData());
            }
            else{
                return "";
            }
        } catch (Exception e) {
            LOGGER.error("brotliDecompress error "+e.toString());
            return "";
        }
    }
}
