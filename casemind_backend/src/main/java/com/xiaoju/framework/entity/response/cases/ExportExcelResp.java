package com.xiaoju.framework.entity.response.cases;

import lombok.Data;

@Data
public class ExportExcelResp {
    private String fileName;

    private byte[] data;
}
