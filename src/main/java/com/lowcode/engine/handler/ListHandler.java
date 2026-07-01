package com.lowcode.engine.handler;

import com.lowcode.api.dto.PageResult;
import com.lowcode.api.dto.QueryRequest;
import com.lowcode.engine.builder.DynamicQueryBuilder;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 列表分页查询处理器
 */
@Component
@RequiredArgsConstructor
public class ListHandler {

    private final DynamicQueryBuilder builder;

    public PageResult query(TableMeta main, List<TableMeta> joinTables,
                            QueryRequest req, Map<String, List<String>> withMap,
                            Map<Long, com.lowcode.meta.domain.FieldPerm> perms) {
        var query = builder.buildListQuery(main, joinTables, req, withMap, perms);
        PageResult pr = builder.fetchPage(query, req.getPage(), req.getSize());

        // 反平铺所有表（包括主表）的数据为嵌套对象
        List<Map<String, Object>> unflattenedRows = new ArrayList<>();
        for (Map<String, Object> row : pr.getRows()) {
            unflattenedRows.add(DynamicQueryBuilder.unflatten(row, main, joinTables));
        }
        pr.setRows(unflattenedRows);

        return pr;
    }
}
