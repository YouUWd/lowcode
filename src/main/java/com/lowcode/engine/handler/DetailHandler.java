package com.lowcode.engine.handler;

import com.lowcode.engine.builder.DynamicQueryBuilder;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import org.jooq.Record;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 单条详情查询处理器（带 JOIN）
 */
@Component
@RequiredArgsConstructor
public class DetailHandler {

    private final DynamicQueryBuilder builder;

    public Map<String, Object> query(TableMeta main, List<TableMeta> joinTables, Long id, java.util.Map<String, java.util.List<String>> withMap) {
        Record row = builder.buildDetailQuery(main, joinTables, id, withMap);
        if (row == null) {
            return null;
        }
        return DynamicQueryBuilder.unflatten(row.intoMap(), main, joinTables);
    }
}
