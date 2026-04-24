package com.xiaoju.framework.entity.request.record;
import com.xiaoju.framework.entity.request.ParamValidate;
import lombok.Data;

@Data
public class RecordPrviewReq implements ParamValidate{

    private Long id;
    private Integer review_result;
    private String user_name;

    @Override
    public void validate(){
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("任务id为空或不正确");
        }
        if (review_result == null || review_result < 0) {
            throw new IllegalArgumentException("评审结果为空或不正确");
        }
    }
}
