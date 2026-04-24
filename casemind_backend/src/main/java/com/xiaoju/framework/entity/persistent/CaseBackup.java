package com.xiaoju.framework.entity.persistent;

import com.xiaoju.framework.util.BrotliUtils;
import com.xiaoju.framework.util.DeflaterUtils;
import lombok.Data;

import java.util.Date;

/**
 * 备份
 *
 * @author didi
 * @date 2019/11/05
 */
@Data
public class CaseBackup {

    private Long id;
    private Long caseId;
    private String title;
    private String creator;
    private Date gmtCreated;
    private String caseContent;
    private byte[] caseContentBlob;
    private String recordContent;
    private String extra;
    private Integer isDelete;
    public  Integer version;

    public String getMergeCaseContent(){
        if(caseContent!=null && !caseContent.equals(""))
            return DeflaterUtils.unzipString(caseContent);

        return  BrotliUtils.brotliDecompress(caseContentBlob);
    }

    public void setCaseContentUseBlob(String content){
        caseContentBlob=BrotliUtils.brotliCompress(content);
    }

    public void setCaseContentUseZip(String content) {
        caseContent = DeflaterUtils.zipString(content);
    }
}
