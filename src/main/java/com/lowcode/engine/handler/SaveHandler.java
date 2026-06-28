package com.lowcode.engine.handler;

import com.lowcode.meta.domain.FieldMeta;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 模块保存处理器 — 负责数据表的通用 upsert 与批量保存
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SaveHandler {

    private final DSLContext dsl;

    /**
     * 批量保存从表数据
     */
    public void saveSubTableBatch(TableMeta sub, Long mainId, List<Map<String, Object>> dataList) {
        for (Map<String, Object> data : dataList) {
            data.put(sub.getForeignKey(), mainId);
            Long itemId = data.get("id") != null
                    ? ((Number) data.get("id")).longValue()
                    : null;
            upsertTable(sub, data, itemId);
        }
    }

    /**
     * 通用单表 upsert 操作
     */
    public Long upsertTable(TableMeta table, Map<String, Object> data, Long id) {
        Table<Record> t = DSL.table(DSL.name(table.getTableName()));

        Map<Field<?>, Object> fieldMap = new LinkedHashMap<>();
        data.forEach((columnName, val) -> {
            FieldMeta fm = table.getFieldByName(columnName);
            if (fm != null && fm.isWritable()) {
                fieldMap.put(DSL.field(DSL.name(fm.getColumnName())), val);
            }
        });

        // 注入外键
        if (table.getForeignKey() != null && data.containsKey(table.getForeignKey())) {
            fieldMap.put(
                    DSL.field(DSL.name(table.getForeignKey())),
                    data.get(table.getForeignKey()));
        }

        if (fieldMap.isEmpty()) {
            log.warn("表 [{}] 没有可写字段，跳过保存", table.getTableName());
            return id;
        }

        if (id == null) {
            dsl.insertInto(t)
                    .set(fieldMap)
                    .execute();
            java.math.BigInteger lastId = dsl.lastID();
            return lastId != null ? lastId.longValue() : null;
        } else {
            dsl.update(t)
                    .set(fieldMap)
                    .where(DSL.field("id").eq(id))
                    .execute();
            return id;
        }
    }
}
