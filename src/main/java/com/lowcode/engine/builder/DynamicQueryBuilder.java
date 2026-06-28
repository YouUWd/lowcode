package com.lowcode.engine.builder;

import com.lowcode.api.dto.PageResult;
import com.lowcode.api.dto.QueryRequest;
import com.lowcode.meta.domain.FieldMeta;
import com.lowcode.meta.domain.TableMeta;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectConditionStep;
import org.jooq.SelectOnConditionStep;
import org.jooq.SelectSeekStepN;
import org.jooq.SortField;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 动态 SQL 构建器 — 负责列表查询、详情查询的 SQL 拼装
 */
@Component
@RequiredArgsConstructor
public class DynamicQueryBuilder {

    private final DSLContext dsl;

    /**
     * 构建列表查询 SQL。
     * withMap 由调用方（ModuleEngine）统一构建，不再重复解析 req.getWith()。
     */
    public SelectSeekStepN<Record> buildListQuery(TableMeta main, List<TableMeta> joinTables,
                                                   QueryRequest req, Map<String, List<String>> withMap) {
        Table<Record> mainTable = DSL.table(DSL.name(main.getTableName())).as(main.getTableName());

        List<Field<?>> selectFields = collectAllFields(main, joinTables, withMap);

        var joinStep = dsl
                .select(selectFields)
                .from(mainTable);

        SelectConditionStep<Record> whereStep;
        if (joinTables == null || joinTables.isEmpty()) {
            whereStep = joinStep.where(buildConditions(main, joinTables, req.getFilters()));
        } else {
            SelectOnConditionStep<Record> onStep = null;
            for (TableMeta jt : joinTables) {
                Table<Record> joinTable = DSL.table(DSL.name(jt.getTableName()))
                        .as(jt.getTableName());

                // #1 修复：使用结构化 JOIN 条件替代 DSL.condition(raw SQL)
                Condition joinOn = buildStructuredJoinCondition(jt);

                var source = (onStep == null) ? joinStep : onStep;
                onStep = switch (jt.getJoinType()) {
                    case "INNER" -> source.join(joinTable).on(joinOn);
                    case "RIGHT" -> source.rightJoin(joinTable).on(joinOn);
                    default -> source.leftJoin(joinTable).on(joinOn);
                };
            }
            whereStep = onStep.where(buildConditions(main, joinTables, req.getFilters()));
        }

        return applySorting(whereStep, main, req);
    }

    /**
     * 构建详情查询 SQL
     */
    public Record buildDetailQuery(TableMeta main, List<TableMeta> joinTables,
                                    Long id, Map<String, List<String>> withFields) {
        Table<Record> mainTable = DSL.table(DSL.name(main.getTableName()))
                .as(main.getTableName());

        List<Field<?>> allFields = collectAllFields(main, joinTables, withFields);

        var joinStep = dsl
                .select(allFields)
                .from(mainTable);

        SelectConditionStep<Record> whereStep;
        if (joinTables == null || joinTables.isEmpty()) {
            whereStep = joinStep
                    .where(DSL.field(DSL.name(main.getTableName(), "id")).eq(id));
        } else {
            SelectOnConditionStep<Record> onStep = null;
            for (TableMeta jt : joinTables) {
                Table<Record> joinTable = DSL.table(DSL.name(jt.getTableName()))
                        .as(jt.getTableName());
                Condition joinOn = buildStructuredJoinCondition(jt);
                var source = (onStep == null) ? joinStep : onStep;
                onStep = switch (jt.getJoinType()) {
                    case "INNER" -> source.join(joinTable).on(joinOn);
                    case "RIGHT" -> source.rightJoin(joinTable).on(joinOn);
                    default -> source.leftJoin(joinTable).on(joinOn);
                };
            }
            whereStep = onStep
                    .where(DSL.field(DSL.name(main.getTableName(), "id")).eq(id));
        }

        return whereStep.fetchOne();
    }

    /**
     * 分页查询。
     * #6 修复：分开构建 count 查询和数据查询，避免 query 对象被 limit/offset 修改的副作用。
     */
    public PageResult fetchPage(SelectSeekStepN<Record> query, int page, int size) {
        // 使用子查询包装来获取 count，避免 ORDER BY 干扰
        int total = dsl.fetchCount(DSL.selectFrom(query.asTable("t")));

        List<Map<String, Object>> rows = dsl
                .select().from(query.asTable("t"))
                .limit(size)
                .offset((long) (page - 1) * size)
                .fetchMaps();

        return new PageResult(rows, total, page, size);
    }

    // ==================== 条件构建 ====================

    private Condition buildConditions(TableMeta main, List<TableMeta> joinTables,
                                      List<QueryRequest.Filter> filters) {
        Condition condition = DSL.trueCondition();
        if (filters == null || filters.isEmpty()) return condition;

        Map<String, TableMeta> tableMap = new java.util.HashMap<>();
        tableMap.put(main.getTableName(), main);
        if (joinTables != null) {
            joinTables.forEach(jt -> tableMap.put(jt.getTableName(), jt));
        }

        for (QueryRequest.Filter filter : filters) {
            String tName = filter.getTableName() != null ? filter.getTableName() : main.getTableName();
            TableMeta table = tableMap.get(tName);
            if (table == null) {
                throw new IllegalArgumentException("Unknown table in filter: " + tName);
            }

            FieldMeta fm = table.getFieldByName(filter.getField());
            if (fm == null) {
                throw new IllegalArgumentException(
                        "Unknown field in filter: " + filter.getField() + " for table: " + tName);
            }
            if (!fm.isQueryable()) {
                throw new IllegalArgumentException(
                        "Field is not queryable: " + filter.getField() + " for table: " + tName);
            }

            Field<Object> col = DSL.field(DSL.name(table.getTableName(), fm.getColumnName()));
            Object val = filter.getValue();
            String op = filter.getOp() != null ? filter.getOp() : (fm.getQueryOp() != null ? fm.getQueryOp() : "EQ");

            condition = condition.and(buildSingleCondition(col, op, val));
        }
        return condition;
    }

    @SuppressWarnings("unchecked")
    private Condition buildSingleCondition(Field<Object> col, String op, Object val) {
        return switch (op.toUpperCase()) {
            case "LIKE" -> col.like("%" + val + "%");
            case "GT" -> col.gt(val);
            case "LT" -> col.lt(val);
            case "GTE" -> col.ge(val);
            case "LTE" -> col.le(val);
            case "IN" -> col.in((List<?>) val);
            case "BETWEEN" -> {
                List<?> range = (List<?>) val;
                yield col.between(range.get(0), range.get(1));
            }
            default -> col.eq(val);
        };
    }

    // ==================== 排序 ====================

    private SelectSeekStepN<Record> applySorting(
            SelectConditionStep<Record> step, TableMeta table, QueryRequest req) {
        List<SortField<?>> sorts = new ArrayList<>();
        if (req.getSorts() != null) {
            for (QueryRequest.SortItem sort : req.getSorts()) {
                FieldMeta fm = table.getFieldByName(sort.getField());
                if (fm == null || !fm.isSortable()) continue;
                Field<?> col = DSL.field(DSL.name(table.getTableName(), fm.getColumnName()));
                sorts.add("DESC".equalsIgnoreCase(sort.getDir()) ? col.desc() : col.asc());
            }
        }
        if (sorts.isEmpty()) {
            sorts.add(DSL.field(DSL.name(table.getTableName(), "id")).desc());
        }
        return step.orderBy(sorts);
    }

    // ==================== 字段收集 ====================

    private List<Field<?>> collectAllFields(TableMeta main, List<TableMeta> joins,
                                             Map<String, List<String>> withFields) {
        List<Field<?>> fields = new ArrayList<>();

        // 主表字段
        List<String> mainSelect = withFields != null ? withFields.get(main.getTableName()) : null;
        if (mainSelect != null && !mainSelect.isEmpty() && !mainSelect.contains("*")) {
            for (String req : mainSelect) {
                if (main.getFieldByName(req) == null) {
                    throw new IllegalArgumentException(
                            "Unknown field in 'with': " + req + " for table: " + main.getTableName());
                }
            }
        }
        main.getFields().forEach(f -> {
            if (mainSelect == null || mainSelect.isEmpty()
                    || mainSelect.contains("*") || mainSelect.contains(f.getColumnName())) {
                fields.add(DSL.field(DSL.name(main.getTableName(), f.getColumnName()))
                        .as(main.getTableName() + "_" + f.getColumnName()));
            }
        });

        // JOIN 表字段
        if (joins != null) {
            joins.forEach(jt -> {
                List<String> joinSelect = withFields != null ? withFields.get(jt.getTableName()) : null;
                if (joinSelect != null && !joinSelect.isEmpty() && !joinSelect.contains("*")) {
                    for (String req : joinSelect) {
                        if (jt.getFieldByName(req) == null) {
                            throw new IllegalArgumentException(
                                    "Unknown field in 'with': " + req + " for table: " + jt.getTableName());
                        }
                    }
                }
                jt.getFields().forEach(f -> {
                    if (joinSelect == null || joinSelect.isEmpty()
                            || joinSelect.contains("*") || joinSelect.contains(f.getColumnName())) {
                        fields.add(DSL.field(DSL.name(jt.getTableName(), f.getColumnName()))
                                .as(jt.getTableName() + "_" + f.getColumnName()));
                    }
                });
            });
        }

        return fields;
    }

    // ==================== JOIN 条件构建 ====================

    /**
     * #1 修复：将 joinOn 字符串解析为结构化条件。
     * 支持格式：`table1.col1 = table2.col2`
     * 如果格式不匹配白名单，抛出异常而不是直接拼入 SQL。
     */
    private Condition buildStructuredJoinCondition(TableMeta jt) {
        String joinOn = jt.getJoinOn();
        if (joinOn == null || joinOn.isBlank()) {
            throw new IllegalArgumentException(
                    "JOIN table [" + jt.getTableName() + "] 的 joinOn 条件不能为空");
        }

        // 只允许 `a.b = c.d` 格式，用正则白名单校验
        String trimmed = joinOn.trim();
        if (!trimmed.matches("^[a-zA-Z_][a-zA-Z0-9_]*\\.[a-zA-Z_][a-zA-Z0-9_]*\\s*=\\s*[a-zA-Z_][a-zA-Z0-9_]*\\.[a-zA-Z_][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException(
                    "joinOn 格式不合法（仅支持 table.column = table.column）: " + joinOn);
        }

        String[] parts = trimmed.split("\\s*=\\s*");
        String[] left = parts[0].split("\\.");
        String[] right = parts[1].split("\\.");

        return DSL.field(DSL.name(left[0], left[1]))
                .eq(DSL.field(DSL.name(right[0], right[1])));
    }

    // ==================== unflatten ====================

    /**
     * 将平铺的 `tableName_columnName` 格式的查询结果，还原为嵌套的 Map 结构
     */
    public static Map<String, Object> unflatten(Map<String, Object> row, TableMeta main, List<TableMeta> joins) {
        if (row == null) return null;

        Map<String, Object> result = new java.util.LinkedHashMap<>();

        List<TableMeta> allTables = new ArrayList<>();
        allTables.add(main);
        if (joins != null) {
            allTables.addAll(joins);
        }

        for (TableMeta jt : allTables) {
            String prefix = jt.getTableName() + "_";
            Map<String, Object> nested = new java.util.LinkedHashMap<>();
            boolean hasData = false;

            for (FieldMeta f : jt.getFields()) {
                String flatKey = prefix + f.getColumnName();
                if (row.containsKey(flatKey)) {
                    Object val = row.get(flatKey);
                    if (val != null) hasData = true;
                    nested.put(f.getColumnName(), val);
                }
            }

            if (hasData) {
                result.put(jt.getTableName(), nested);
            }
        }
        return result;
    }
}
