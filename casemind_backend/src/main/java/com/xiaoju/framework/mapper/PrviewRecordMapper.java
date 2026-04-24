package com.xiaoju.framework.mapper;

import com.xiaoju.framework.entity.dto.PrviewNumDto;
import com.xiaoju.framework.entity.persistent.PrviewRecord;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrviewRecordMapper {
    Long insert(PrviewRecord record);

    List<PrviewRecord> getRecordListByCaseId(Long caseId);

    List<PrviewNumDto> getPrviewNumByCaseIds(List<Long> caseIds);
}
