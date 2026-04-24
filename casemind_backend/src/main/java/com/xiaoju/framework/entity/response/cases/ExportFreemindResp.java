package com.xiaoju.framework.entity.response.cases;

import lombok.Data;

@Data
public class ExportFreemindResp {
    private String fileName;

    private byte[] data;
}
