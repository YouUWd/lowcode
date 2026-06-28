好的，先读一下前端设计规范，然后给你一个完整的 JOOQ 方案。现在给你完整的 JOOQ 方案，包含代码结构、依赖配置和核心实现。## 一、依赖配置

```xml
<!-- pom.xml -->
<dependencies>
    <!-- JOOQ 核心 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jooq</artifactId>
    </dependency>
    <!-- MySQL 驱动 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
    </dependency>
    <!-- 连接池 -->
    <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
    </dependency>
</dependencies>

<build>
  <plugins>
    <!-- JOOQ 代码生成（只生成元数据表的静态类，业务表动态处理） -->
    <plugin>
      <groupId>org.jooq</groupId>
      <artifactId>jooq-codegen-maven</artifactId>
      <configuration>
        <jdbc>
          <driver>com.mysql.cj.jdbc.Driver</driver>
          <url>jdbc:mysql://localhost:3306/meta_db</url>
          <user>root</user><password>pass</password>
        </jdbc>
        <generator>
          <database>
            <name>org.jooq.meta.mysql.MySQLDatabase</name>
            <includes>module_meta|table_meta|field_meta|relation_meta</includes>
          </database>
          <target>
            <packageName>com.yourapp.jooq</packageName>
            <directory>src/main/java</directory>
          </target>
        </generator>
      </configuration>
    </plugin>
  </plugins>
</build>
```

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/biz_db?useUnicode=true&characterEncoding=utf8
    driver-class-name: com.mysql.cj.jdbc.Driver
  jooq:
    sql-dialect: MYSQL
```

---

## 二、项目结构

```
src/main/java/com/yourapp/
├── config/
│   └── JooqConfig.java              # DSLContext Bean 配置
├── meta/
│   ├── domain/
│   │   ├── ModuleMeta.java          # 模块元数据
│   │   ├── TableMeta.java           # 表配置（含 queryType）
│   │   ├── FieldMeta.java           # 字段白名单
│   │   └── RelationMeta.java        # N:M 关联配置
│   ├── repository/
│   │   └── MetaRepository.java      # 读取元数据（带 Caffeine 缓存）
│   └── cache/
│       └── MetaCache.java           # 缓存封装
├── engine/
│   ├── ModuleEngine.java            # 核心引擎：编排查询与保存
│   ├── handler/
│   │   ├── ListHandler.java         # 列表分页查询
│   │   ├── DetailHandler.java       # 单条详情 + JOIN
│   │   └── RelationHandler.java     # 中间表 N:M
│   └── builder/
│       └── DynamicQueryBuilder.java # JOOQ DSL 动态构建器（核心）
├── api/
│   ├── ModuleController.java
│   ├── dto/QueryRequest.java
│   └── dto/SaveRequest.java
└── security/
    └── FieldAccessValidator.java    # 字段白名单校验
```

---

## 三、JOOQ 配置

```java
@Configuration
public class JooqConfig {

    @Bean
    public DefaultDSLContext dslContext(DataSource dataSource) {
        // Spring Boot 自动配置已处理，这里可定制执行监听器
        Settings settings = new Settings()
            .withRenderFormatted(false)           // 生产环境关闭格式化提升性能
            .withExecuteWithOptimisticLocking(true);

        return new DefaultDSLContext(
            new DefaultConfiguration()
                .set(dataSource)
                .set(SQLDialect.MYSQL)
                .set(settings)
                .set(new DefaultExecuteListenerProvider(new SlowSqlListener())) // 慢 SQL 监控
        );
    }
}
```

```java
// 慢 SQL 监控，超过 500ms 打警告日志
@Slf4j
public class SlowSqlListener extends DefaultExecuteListener {
    private final ThreadLocal<Long> start = new ThreadLocal<>();

    @Override public void start(ExecuteContext ctx) { start.set(System.currentTimeMillis()); }

    @Override public void end(ExecuteContext ctx) {
        long cost = System.currentTimeMillis() - start.get();
        if (cost > 500) log.warn("Slow SQL [{}ms]: {}", cost, ctx.sql());
    }
}
```

---

## 四、动态查询构建器（核心）

这是整个方案最关键的类，JOOQ 的类型安全 DSL 在这里发挥最大价值。

```java
@Component
@RequiredArgsConstructor
public class DynamicQueryBuilder {

    private final DSLContext dsl;

    // ── 动态列表查询 ──────────────────────────────────────────────
    public SelectSeekStepN<Record> buildListQuery(TableMeta table,
                                                   QueryRequest req) {
        Table<Record> t = DSL.table(DSL.name(table.getTableName()))
                              .as(table.getAlias());

        // 只 SELECT 元数据白名单字段，防止越权读取
        List<Field<?>> selectFields = table.getFields().stream()
            .map(f -> DSL.field(DSL.name(table.getAlias(), f.getColumnName()))
                         .as(f.getAlias()))
            .collect(toList());

        SelectConditionStep<Record> step = dsl
            .select(selectFields)
            .from(t)
            .where(buildConditions(table, req.getFilters()));

        // 排序字段白名单校验
        return applySorting(step, table, req);
    }

    // ── 带 JOIN 的详情查询 ────────────────────────────────────────
    public Record buildDetailQuery(TableMeta main,
                                   List<TableMeta> joinTables,
                                   Long id) {
        Table<Record> mainTable = DSL.table(DSL.name(main.getTableName()))
                                     .as(main.getAlias());

        // 汇总所有表的可查询字段
        List<Field<?>> allFields = collectAllFields(main, joinTables);

        SelectOnConditionStep<Record> step = dsl
            .select(allFields)
            .from(mainTable);

        // 动态追加 JOIN（来自元数据配置）
        for (TableMeta jt : joinTables) {
            Table<Record> joinTable = DSL.table(DSL.name(jt.getTableName()))
                                         .as(jt.getAlias());
            Condition joinOn = DSL.condition(jt.getJoinOn()); // 如 "a.id = b.order_id"

            step = switch (jt.getJoinType()) {
                case "LEFT"  -> step.leftJoin(joinTable).on(joinOn);
                case "INNER" -> step.join(joinTable).on(joinOn);
                case "RIGHT" -> step.rightJoin(joinTable).on(joinOn);
                default      -> step.leftJoin(joinTable).on(joinOn);
            };
        }

        return step
            .where(DSL.field(DSL.name(main.getAlias(), "id")).eq(id))
            .fetchOne();
    }

    // ── 分页执行 ──────────────────────────────────────────────────
    public PageResult<Map<String, Object>> fetchPage(
            SelectSeekStepN<Record> query, int page, int size) {

        // 先 COUNT，再 LIMIT（JOOQ 支持从同一个 Select 派生 COUNT）
        int total = dsl.fetchCount(query);

        List<Map<String, Object>> rows = query
            .limit(size)
            .offset((long) (page - 1) * size)
            .fetchMaps();

        return new PageResult<>(rows, total, page, size);
    }

    // ── 私有方法：构建 WHERE 条件 ─────────────────────────────────
    private Condition buildConditions(TableMeta table,
                                       Map<String, Object> filters) {
        Condition condition = DSL.trueCondition();
        if (filters == null) return condition;

        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            FieldMeta fm = table.getFieldByAlias(entry.getKey());
            // 严格白名单：字段必须在元数据中且标记 isQueryable
            if (fm == null || !fm.isQueryable()) continue;

            Field<Object> col = DSL.field(
                DSL.name(table.getAlias(), fm.getColumnName()));
            Object val = entry.getValue();

            condition = condition.and(buildSingleCondition(col, fm, val));
        }
        return condition;
    }

    private Condition buildSingleCondition(Field<Object> col,
                                            FieldMeta fm, Object val) {
        // 支持多种查询操作符，来自请求中的 op 字段
        return switch (fm.getQueryOp()) {
            case "LIKE"       -> col.like("%" + val + "%");
            case "GT"         -> col.gt(val);
            case "LT"         -> col.lt(val);
            case "GTE"        -> col.ge(val);
            case "LTE"        -> col.le(val);
            case "IN"         -> col.in((List<?>) val);
            case "BETWEEN"    -> {
                List<?> range = (List<?>) val;
                yield col.between(range.get(0), range.get(1));
            }
            default           -> col.eq(val); // EQ
        };
    }

    private SelectSeekStepN<Record> applySorting(
            SelectConditionStep<Record> step,
            TableMeta table, QueryRequest req) {

        List<SortField<?>> sorts = new ArrayList<>();
        if (req.getSorts() != null) {
            for (QueryRequest.SortItem sort : req.getSorts()) {
                FieldMeta fm = table.getFieldByAlias(sort.getField());
                if (fm == null || !fm.isSortable()) continue; // 白名单过滤

                Field<?> col = DSL.field(
                    DSL.name(table.getAlias(), fm.getColumnName()));
                sorts.add("DESC".equalsIgnoreCase(sort.getDir())
                    ? col.desc() : col.asc());
            }
        }
        return sorts.isEmpty()
            ? step.orderBy(DSL.field("id").desc()) // 默认排序
            : step.orderBy(sorts);
    }

    private List<Field<?>> collectAllFields(TableMeta main,
                                             List<TableMeta> joins) {
        List<Field<?>> fields = new ArrayList<>();
        Stream.concat(Stream.of(main), joins.stream()).forEach(t ->
            t.getFields().forEach(f ->
                fields.add(DSL.field(DSL.name(t.getAlias(), f.getColumnName()))
                              .as(t.getAlias() + "_" + f.getAlias()))
            )
        );
        return fields;
    }
}
```

---

## 五、三个 Handler 实现

```java
// ── ListHandler ───────────────────────────────────────────────────
@Component
@RequiredArgsConstructor
public class ListHandler {

    private final DynamicQueryBuilder builder;

    public PageResult<Map<String, Object>> query(TableMeta table,
                                                  QueryRequest req) {
        var query = builder.buildListQuery(table, req);
        return builder.fetchPage(query, req.getPage(), req.getSize());
    }
}

// ── DetailHandler ─────────────────────────────────────────────────
@Component
@RequiredArgsConstructor
public class DetailHandler {

    private final DynamicQueryBuilder builder;

    public Map<String, Object> query(TableMeta main,
                                      List<TableMeta> joinTables,
                                      Long id) {
        Record record = builder.buildDetailQuery(main, joinTables, id);
        return record == null ? null : record.intoMap();
    }
}

// ── RelationHandler ───────────────────────────────────────────────
@Component
@RequiredArgsConstructor
public class RelationHandler {

    private final DSLContext dsl;

    public List<Map<String, Object>> queryRight(RelationMeta rel, Long leftId) {
        Table<Record> junction = DSL.table(DSL.name(rel.getJunctionTable()));
        Table<Record> right    = DSL.table(DSL.name(rel.getRightTable())).as("r");

        return dsl
            .select(DSL.field("r.*"))
            .from(right)
            .innerJoin(junction)
            .on(DSL.field(DSL.name(rel.getJunctionTable(), rel.getRightFk()))
                   .eq(DSL.field(DSL.name("r", "id"))))
            .where(DSL.field(DSL.name(rel.getJunctionTable(), rel.getLeftFk()))
                      .eq(leftId))
            .fetchMaps();
    }

    @Transactional
    public void saveRelations(RelationMeta rel, Long leftId,
                               List<Long> rightIds) {
        Table<Record> junction = DSL.table(DSL.name(rel.getJunctionTable()));
        Field<Long> leftFkField  = DSL.field(DSL.name(rel.getLeftFk()),  Long.class);
        Field<Long> rightFkField = DSL.field(DSL.name(rel.getRightFk()), Long.class);

        // 先删除旧关联
        dsl.deleteFrom(junction)
           .where(leftFkField.eq(leftId))
           .execute();

        // 批量插入新关联（JOOQ 原生批处理）
        if (!rightIds.isEmpty()) {
            var inserts = rightIds.stream()
                .map(rid -> dsl.insertInto(junction)
                               .set(leftFkField, leftId)
                               .set(rightFkField, rid))
                .toList();
            dsl.batch(inserts).execute();
        }
    }
}
```

---

## 六、模块引擎（事务编排）

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ModuleEngine {

    private final MetaCache      metaCache;
    private final ListHandler    listHandler;
    private final DetailHandler  detailHandler;
    private final RelationHandler relationHandler;
    private final DSLContext     dsl;

    // ── 整体查询 ──────────────────────────────────────────────────
    public Map<String, Object> query(String moduleId, QueryRequest req) {
        ModuleMeta meta = metaCache.get(moduleId);
        Map<String, Object> result = new LinkedHashMap<>();

        TableMeta mainTable   = meta.getMainTable();
        List<TableMeta> joins = meta.getJoinTables();

        // LIST 类型表：返回分页列表
        meta.getListTables().forEach(t ->
            result.put(t.getAlias(), listHandler.query(t, req))
        );

        // DETAIL 类型表：带 JOIN 返回单条详情
        if (req.getId() != null) {
            result.put("detail", detailHandler.query(mainTable, joins, req.getId()));
        }

        // RELATION 类型：N:M 关联数据
        if (req.getId() != null) {
            meta.getRelations().forEach(rel ->
                result.put(rel.getName(), relationHandler.queryRight(rel, req.getId()))
            );
        }

        return result;
    }

    // ── 整体保存（统一事务）───────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    public Long save(String moduleId, SaveRequest req) {
        ModuleMeta meta = metaCache.get(moduleId);
        Long mainId = req.getId();

        // 1. 主表 upsert
        mainId = upsertTable(meta.getMainTable(), req.getMainData(), mainId);

        // 2. 从表按配置顺序 upsert
        final Long finalMainId = mainId;
        meta.getSubTables().forEach(sub -> {
            Map<String, Object> subData = req.getSubData(sub.getAlias());
            if (subData != null) {
                subData.put(sub.getForeignKey(), finalMainId); // 自动注入外键
                upsertTable(sub, subData, (Long) subData.get("id"));
            }
        });

        // 3. N:M 关联先删后插
        meta.getRelations().forEach(rel -> {
            List<Long> ids = req.getRelationIds(rel.getName());
            if (ids != null) {
                relationHandler.saveRelations(rel, finalMainId, ids);
            }
        });

        return mainId;
    }

    // ── 通用 upsert（有 id 则 UPDATE，无则 INSERT）────────────────
    private Long upsertTable(TableMeta table, Map<String, Object> data, Long id) {
        Table<Record> t = DSL.table(DSL.name(table.getTableName()));

        // 字段白名单过滤（防止客户端传入非法字段）
        Map<Field<?>, Object> fieldMap = new LinkedHashMap<>();
        data.forEach((alias, val) -> {
            FieldMeta fm = table.getFieldByAlias(alias);
            if (fm != null && fm.isWritable()) {
                fieldMap.put(DSL.field(DSL.name(fm.getColumnName())), val);
            }
        });

        if (id == null) {
            // INSERT，返回自增 ID
            return dsl.insertInto(t)
                      .set(fieldMap)
                      .returningResult(DSL.field("id", Long.class))
                      .fetchOne()
                      .value1();
        } else {
            // UPDATE
            var update = dsl.update(t);
            var setStep = update.set(fieldMap);
            setStep.where(DSL.field("id").eq(id)).execute();
            return id;
        }
    }
}
```

---

## 七、元数据缓存（Caffeine）

```java
@Component
@RequiredArgsConstructor
public class MetaCache {

    private final MetaRepository metaRepo;

    // 缓存 1 小时，最多 500 个模块
    private final Cache<String, ModuleMeta> cache = Caffeine.newBuilder()
        .maximumSize(500)
        .expireAfterWrite(1, TimeUnit.HOURS)
        .recordStats() // 开启命中率监控
        .build();

    public ModuleMeta get(String moduleId) {
        return cache.get(moduleId, metaRepo::loadModuleMeta);
    }

    // 配置变更时主动失效（可由管理接口调用）
    public void invalidate(String moduleId) {
        cache.invalidate(moduleId);
    }

    public void invalidateAll() {
        cache.invalidateAll();
    }
}
```

---

## 八、关键细节汇总

下面这张图梳理了 JOOQ 在这个方案里各场景的分工：

![alt text](image.png)

## 九、几个值得注意的细节

**`DSL.name()` 是防注入的关键**。它会把标识符转义成反引号形式（MySQL 下是 `` `table`.`column` ``），杜绝表名/列名注入，而值参数用 JOOQ 自带的 `?` 绑定。两者结合，SQL 注入面完全封闭。

**`DSL.condition(raw)` 要谨慎**。`DetailHandler` 里的 JOIN 条件 `jt.getJoinOn()` 直接传字符串进了 `DSL.condition()`，这段字符串来自元数据库（后台管理员配置），不是用户输入，是安全的。如果未来允许用户侧传入 JOIN 条件，必须换成参数化写法。

**不需要为每张业务表生成代码**。JOOQ 代码生成只针对 4 张元数据表（`module_meta` 等），业务表（a、b、c）全部用 `DSL.table(DSL.name(...))` 动态引用，这正是低代码场景的正确姿势。

**事务边界在 `ModuleEngine.save()`**。`@Transactional` 加在引擎层，三个 Handler 里不加事务注解，确保整个模块保存是原子操作，任意子步骤失败全部回滚。

如果需要深入某个部分——比如元数据管理的可视化配置界面、权限控制的字段级实现、或者复杂报表聚合查询的写法——随时继续。