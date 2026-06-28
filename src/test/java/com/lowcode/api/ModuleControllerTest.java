package com.lowcode.api;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 自动回滚测试对数据库所做的修改，保持测试后数据库清洁
@org.springframework.test.context.jdbc.Sql(scripts = "file:sql/init.sql", executionPhase = org.springframework.test.context.jdbc.Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class ModuleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DSLContext dsl;

    // ================================================================
    // 用例 1 - 3：列表查询（含 JOIN、从表、多对多标签）
    // ================================================================

    @Test
    public void testQueryList() throws Exception {
        // 测试最基础的分页查询并携带拉取 JOIN 表 (customer_profiles)
        // 预置数据: 3 条订单，按 id desc 排序，第 1 行为 ID=3 (王五/PENDING)
        String reqJson = "{\"page\":1,\"size\":5,\"with\":[{\"tableName\":\"customer_profiles\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.rows").isArray())
                .andExpect(jsonPath("$.data.rows", hasSize(3)))
                .andExpect(jsonPath("$.data.total").value(3))
                // 第 1 行 (id desc → ID=3, 王五, PENDING)
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(3))
                .andExpect(jsonPath("$.data.rows[0].orders.order_no").value("ORD-20240102-003"))
                .andExpect(jsonPath("$.data.rows[0].orders.customer").value("王五"))
                .andExpect(jsonPath("$.data.rows[0].orders.amount").value(800.00))
                .andExpect(jsonPath("$.data.rows[0].orders.status").value("PENDING"))
                .andExpect(jsonPath("$.data.rows[0].orders.remark").value(nullValue()))
                .andExpect(jsonPath("$.data.rows[0].orders.created_at").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.updated_at").exists())
                // 级联 JOIN 字段全覆盖
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.id").value(3))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.name").value("王五"))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.level").value("REGULAR"))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.contact_phone").value("13700137000"))
                // 第 2 行 (ID=2, 李四, SHIPPED)
                .andExpect(jsonPath("$.data.rows[1].orders.id").value(2))
                .andExpect(jsonPath("$.data.rows[1].orders.customer").value("李四"))
                .andExpect(jsonPath("$.data.rows[1].orders.status").value("SHIPPED"))
                .andExpect(jsonPath("$.data.rows[1].customer_profiles.level").value("GOLD"))
                // 第 3 行 (ID=1, 张三, PAID)
                .andExpect(jsonPath("$.data.rows[2].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[2].orders.customer").value("张三"))
                .andExpect(jsonPath("$.data.rows[2].orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.rows[2].customer_profiles.level").value("VIP"));
    }

    @Test
    public void testQueryListPagination() throws Exception {
        // 测试分页参数生效：size=2, page=1 应只返回 2 条，但 total 仍为 3
        String reqJson = "{\"page\":1,\"size\":2}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.rows", hasSize(2)))
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(3))
                .andExpect(jsonPath("$.data.rows[1].orders.id").value(2));

        // 第 2 页应只返回剩余 1 条
        String page2Json = "{\"page\":2,\"size\":2}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(page2Json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.rows", hasSize(1)))
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(1));
    }

    @Test
    public void testQueryListWithSubTable() throws Exception {
        // 测试列表查询同时携带拉取从表明细 (order_items)
        String reqJson = "{\"page\":1,\"size\":5,\"with\":[{\"tableName\":\"order_items\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.rows").isArray())
                // 关注 rows[2] = 订单 ID=1，有 2 件商品
                .andExpect(jsonPath("$.data.rows[2].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items").isArray())
                .andExpect(jsonPath("$.data.rows[2].order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.rows[2].order_items[0].id").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items[0].order_id").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items[0].product_name").value("鼠标"))
                .andExpect(jsonPath("$.data.rows[2].order_items[0].qty").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items[0].price").value(500.00))
                .andExpect(jsonPath("$.data.rows[2].order_items[0].created_at").exists())
                .andExpect(jsonPath("$.data.rows[2].order_items[1].id").value(2))
                .andExpect(jsonPath("$.data.rows[2].order_items[1].order_id").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items[1].product_name").value("键盘"))
                .andExpect(jsonPath("$.data.rows[2].order_items[1].qty").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items[1].price").value(1000.00))
                .andExpect(jsonPath("$.data.rows[2].order_items[1].created_at").exists())
                // 无订单项的订单也应返回空数组而非 null
                .andExpect(jsonPath("$.data.rows[0].order_items").isArray());
    }

    @Test
    public void testQueryListWithRelations() throws Exception {
        // 测试列表查询同时携带多对多标签 (tags)
        String reqJson = "{\"page\":1,\"size\":5,\"with\":[{\"tableName\":\"tags\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.rows").isArray())
                // rows[2] = ID=1 (张三): 两个标签 VIP(id=1), 特价(id=4)
                .andExpect(jsonPath("$.data.rows[2].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[2].tags", hasSize(2)))
                .andExpect(jsonPath("$.data.rows[2].tags[0].id").value(1))
                .andExpect(jsonPath("$.data.rows[2].tags[0].name").value("VIP"))
                .andExpect(jsonPath("$.data.rows[2].tags[1].id").value(4))
                .andExpect(jsonPath("$.data.rows[2].tags[1].name").value("特价"))
                // rows[1] = ID=2 (李四): 一个标签 加急(id=2)
                .andExpect(jsonPath("$.data.rows[1].orders.id").value(2))
                .andExpect(jsonPath("$.data.rows[1].tags", hasSize(1)))
                .andExpect(jsonPath("$.data.rows[1].tags[0].id").value(2))
                .andExpect(jsonPath("$.data.rows[1].tags[0].name").value("加急"))
                // rows[0] = ID=3 (王五): 两个标签 退货(id=3), 赠品(id=5)
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(3))
                .andExpect(jsonPath("$.data.rows[0].tags", hasSize(2)))
                .andExpect(jsonPath("$.data.rows[0].tags[0].id").value(3))
                .andExpect(jsonPath("$.data.rows[0].tags[0].name").value("退货"))
                .andExpect(jsonPath("$.data.rows[0].tags[1].id").value(5))
                .andExpect(jsonPath("$.data.rows[0].tags[1].name").value("赠品"));
    }

    // ================================================================
    // 用例 4 - 5：单条详情查询（含字段投影）
    // ================================================================

    @Test
    public void testDetailQuery() throws Exception {
        // 测试单条详情查询（ID=1），自动附带所有从表与关联表
        String reqJson = "{\"id\":1}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                // 主表全字段断言
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.orders.order_no").value("ORD-20240101-001"))
                .andExpect(jsonPath("$.data.orders.customer").value("张三"))
                .andExpect(jsonPath("$.data.orders.amount").value(1500.00))
                .andExpect(jsonPath("$.data.orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.orders.remark").value("首单客户"))
                .andExpect(jsonPath("$.data.orders.created_at").exists())
                .andExpect(jsonPath("$.data.orders.updated_at").exists())
                // 从表全字段断言
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.order_items[0].id").value(1))
                .andExpect(jsonPath("$.data.order_items[0].order_id").value(1))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("鼠标"))
                .andExpect(jsonPath("$.data.order_items[0].qty").value(1))
                .andExpect(jsonPath("$.data.order_items[0].price").value(500.00))
                .andExpect(jsonPath("$.data.order_items[0].created_at").exists())
                .andExpect(jsonPath("$.data.order_items[1].id").value(2))
                .andExpect(jsonPath("$.data.order_items[1].order_id").value(1))
                .andExpect(jsonPath("$.data.order_items[1].product_name").value("键盘"))
                .andExpect(jsonPath("$.data.order_items[1].qty").value(1))
                .andExpect(jsonPath("$.data.order_items[1].price").value(1000.00))
                .andExpect(jsonPath("$.data.order_items[1].created_at").exists())
                // 多对多标签全字段断言
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andExpect(jsonPath("$.data.tags[0].id").value(1))
                .andExpect(jsonPath("$.data.tags[0].name").value("VIP"))
                .andExpect(jsonPath("$.data.tags[1].id").value(4))
                .andExpect(jsonPath("$.data.tags[1].name").value("特价"));
    }

    @Test
    public void testDetailQueryNotFound() throws Exception {
        // 测试查询不存在的 ID，整个 data 应返回 null
        String reqJson = "{\"id\":99999}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }

    @Test
    public void testDetailQueryWithProjection() throws Exception {
        // 测试单条详情查询 + 字段投影（仅拉取 order_items 中的 product_name 和 price）
        String reqJson = "{\"id\":1,\"with\":[{\"tableName\":\"order_items\",\"fields\":[\"product_name\",\"price\"]}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                // 主表字段完整，不受 with 投影影响
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.orders.order_no").value("ORD-20240101-001"))
                .andExpect(jsonPath("$.data.orders.customer").value("张三"))
                .andExpect(jsonPath("$.data.orders.amount").value(1500.00))
                .andExpect(jsonPath("$.data.orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.orders.remark").value("首单客户"))
                // 子表：只有被投影的 2 个字段，其余字段严格不存在
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("鼠标"))
                .andExpect(jsonPath("$.data.order_items[0].price").value(500.00))
                .andExpect(jsonPath("$.data.order_items[0].id").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].order_id").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].qty").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].created_at").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[1].product_name").value("键盘"))
                .andExpect(jsonPath("$.data.order_items[1].price").value(1000.00))
                // 未被 with 包含的关联表不应出现
                .andExpect(jsonPath("$.data.tags").doesNotExist());
    }

    // ================================================================
    // 用例 6：多条件过滤
    // ================================================================

    @Test
    public void testQueryFilters() throws Exception {
        // 测试多重 AND 条件筛选（customer LIKE '张' AND amount >= 1000）
        String reqJson = "{\"filters\":[" +
                "{\"tableName\":\"orders\",\"field\":\"customer\",\"op\":\"LIKE\",\"value\":\"张\"}," +
                "{\"tableName\":\"orders\",\"field\":\"amount\",\"op\":\"GTE\",\"value\":1000}" +
                "]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.rows", hasSize(1)))
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[0].orders.order_no").value("ORD-20240101-001"))
                .andExpect(jsonPath("$.data.rows[0].orders.customer").value("张三"))
                .andExpect(jsonPath("$.data.rows[0].orders.amount").value(1500.00))
                .andExpect(jsonPath("$.data.rows[0].orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.rows[0].orders.remark").value("首单客户"))
                .andExpect(jsonPath("$.data.rows[0].orders.created_at").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.updated_at").exists());
    }

    @Test
    public void testQueryFiltersNoMatch() throws Exception {
        // 测试过滤条件无匹配时，应返回空 rows 列表，total=0
        String reqJson = "{\"filters\":[" +
                "{\"tableName\":\"orders\",\"field\":\"customer\",\"op\":\"EQ\",\"value\":\"不存在的客户\"}" +
                "]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.total").value(0))
                .andExpect(jsonPath("$.data.rows").isArray())
                .andExpect(jsonPath("$.data.rows", hasSize(0)));
    }

    // ================================================================
    // 用例 7 - 8：校验器异常流程
    // ================================================================

    @Test
    public void testValidationErrors() throws Exception {
        // 测试非法的 with 表名
        String invalidTableJson = "{\"with\":[{\"tableName\":\"nonexistent_table\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidTableJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Unknown table or relation")));

        // 测试表内非法的列名
        String invalidFieldJson = "{\"with\":[{\"tableName\":\"order_items\",\"fields\":[\"invalid_col\"]}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidFieldJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Unknown field in 'with'")));
    }

    // ================================================================
    // 用例 9 - 13：保存（新增/更新）+ 级联删除完整流程
    // ================================================================

    @Test
    public void testSaveAndCascadeDelete() throws Exception {
        // ── 步骤 1: 新增主从记录 + 多对多关联 ──────────────────────────────
        String saveJson = "{" +
                "\"data\":{" +
                "\"orders\":{\"order_no\":\"ORD-TEST-1234\",\"customer\":\"测试自动\",\"amount\":888.00,\"status\":\"PENDING\"}," +
                "\"order_items\":[" +
                "{\"product_name\":\"测试商品A\",\"qty\":2,\"price\":100.00}," +
                "{\"product_name\":\"测试商品B\",\"qty\":1,\"price\":688.00}" +
                "]," +
                "\"tags\":[{\"id\":1},{\"id\":2}]" +
                "}" +
                "}";

        String resultStr = mockMvc.perform(post("/api/module/order/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data").isNumber())
                .andReturn().getResponse().getContentAsString();

        Number newId = com.jayway.jsonpath.JsonPath.read(resultStr, "$.data");
        long generatedId = newId.longValue();

        // ── DB 严密校验（新增后）──────────────────────────────────────────
        var dbOrder = dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId)).fetchOne();
        assertNotNull(dbOrder);
        assertEquals("ORD-TEST-1234", dbOrder.get("order_no"));
        assertEquals("测试自动", dbOrder.get("customer"));
        assertEquals(0, new BigDecimal("888.00").compareTo((BigDecimal) dbOrder.get("amount")));
        assertEquals("PENDING", dbOrder.get("status"));
        assertNull(dbOrder.get("remark"));
        assertNotNull(dbOrder.get("created_at"));

        var dbItems = dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("id").asc()).fetch();
        assertEquals(2, dbItems.size());
        assertEquals("测试商品A", dbItems.get(0).get("product_name"));
        assertEquals(2, ((Number) dbItems.get(0).get("qty")).intValue());
        assertEquals(0, new BigDecimal("100.00").compareTo((BigDecimal) dbItems.get(0).get("price")));
        assertEquals("测试商品B", dbItems.get(1).get("product_name"));
        assertEquals(1, ((Number) dbItems.get(1).get("qty")).intValue());
        assertEquals(0, new BigDecimal("688.00").compareTo((BigDecimal) dbItems.get(1).get("price")));

        var dbTags = dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("tag_id").asc()).fetch();
        assertEquals(2, dbTags.size());
        assertEquals(1L, ((Number) dbTags.get(0).get("tag_id")).longValue());
        assertEquals(2L, ((Number) dbTags.get(1).get("tag_id")).longValue());

        // ── API 全字段校验（新增后）──────────────────────────────────────
        String detailJson = "{\"id\":" + generatedId + "}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.orders.id").value((int) generatedId))
                .andExpect(jsonPath("$.data.orders.order_no").value("ORD-TEST-1234"))
                .andExpect(jsonPath("$.data.orders.customer").value("测试自动"))
                .andExpect(jsonPath("$.data.orders.amount").value(888.00))
                .andExpect(jsonPath("$.data.orders.status").value("PENDING"))
                .andExpect(jsonPath("$.data.orders.remark").value(nullValue()))
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("测试商品A"))
                .andExpect(jsonPath("$.data.order_items[0].qty").value(2))
                .andExpect(jsonPath("$.data.order_items[0].price").value(100.00))
                .andExpect(jsonPath("$.data.order_items[1].product_name").value("测试商品B"))
                .andExpect(jsonPath("$.data.order_items[1].qty").value(1))
                .andExpect(jsonPath("$.data.order_items[1].price").value(688.00))
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andExpect(jsonPath("$.data.tags[0].id").value(1))
                .andExpect(jsonPath("$.data.tags[0].name").value("VIP"))
                .andExpect(jsonPath("$.data.tags[1].id").value(2))
                .andExpect(jsonPath("$.data.tags[1].name").value("加急"));

        // ── 步骤 2: 级联更新（修改主表，改子项A，删子项B，加子项C，换标签为2,4）──
        long itemAId = ((Number) dbItems.get(0).get("id")).longValue();
        String updateJson = "{" +
                "\"data\":{" +
                "\"orders\":{\"id\":" + generatedId + ",\"order_no\":\"ORD-TEST-1234\",\"customer\":\"测试修改\",\"amount\":999.00,\"status\":\"PAID\"}," +
                "\"order_items\":[" +
                "{\"id\":" + itemAId + ",\"product_name\":\"测试商品A-改\",\"qty\":3,\"price\":120.00}," +
                "{\"product_name\":\"测试商品C\",\"qty\":1,\"price\":639.00}" +
                "]," +
                "\"tags\":[{\"id\":2},{\"id\":4}]" +
                "}" +
                "}";

        mockMvc.perform(post("/api/module/order/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"));

        // ── DB 严密校验（更新后）──────────────────────────────────────────
        var dbOrderUpdated = dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId)).fetchOne();
        assertNotNull(dbOrderUpdated);
        assertEquals("测试修改", dbOrderUpdated.get("customer"));
        assertEquals("PAID", dbOrderUpdated.get("status"));
        assertEquals(0, new BigDecimal("999.00").compareTo((BigDecimal) dbOrderUpdated.get("amount")));

        var dbItemsUpdated = dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("id").asc()).fetch();
        assertEquals(2, dbItemsUpdated.size());
        assertEquals(itemAId, ((Number) dbItemsUpdated.get(0).get("id")).longValue());
        assertEquals("测试商品A-改", dbItemsUpdated.get(0).get("product_name"));
        assertEquals(3, ((Number) dbItemsUpdated.get(0).get("qty")).intValue());
        assertEquals(0, new BigDecimal("120.00").compareTo((BigDecimal) dbItemsUpdated.get(0).get("price")));
        assertEquals("测试商品C", dbItemsUpdated.get(1).get("product_name"));
        assertEquals(1, ((Number) dbItemsUpdated.get(1).get("qty")).intValue());

        var dbTagsUpdated = dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("tag_id").asc()).fetch();
        assertEquals(2, dbTagsUpdated.size());
        assertEquals(2L, ((Number) dbTagsUpdated.get(0).get("tag_id")).longValue());
        assertEquals(4L, ((Number) dbTagsUpdated.get(1).get("tag_id")).longValue());

        // ── API 全字段校验（更新后）──────────────────────────────────────
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.orders.customer").value("测试修改"))
                .andExpect(jsonPath("$.data.orders.amount").value(999.00))
                .andExpect(jsonPath("$.data.orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("测试商品A-改"))
                .andExpect(jsonPath("$.data.order_items[0].qty").value(3))
                .andExpect(jsonPath("$.data.order_items[1].product_name").value("测试商品C"))
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andExpect(jsonPath("$.data.tags[0].id").value(2))
                .andExpect(jsonPath("$.data.tags[0].name").value("加急"))
                .andExpect(jsonPath("$.data.tags[1].id").value(4))
                .andExpect(jsonPath("$.data.tags[1].name").value("特价"));

        // ── 步骤 3: 级联物理删除 ─────────────────────────────────────────
        mockMvc.perform(delete("/api/module/order/" + generatedId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data").value(nullValue()));

        // ── DB 严密校验（删除后）──────────────────────────────────────────
        assertFalse(dsl.fetchExists(dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId))));
        assertFalse(dsl.fetchExists(dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId))));
        assertFalse(dsl.fetchExists(dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId))));

        // ── API 校验（删除后）─────────────────────────────────────────────
        // 确认删除后无法查到该主表与从表，且整体直接返回 null
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }

    // ================================================================
    // 用例 14：缓存刷新后查询仍正常工作
    // ================================================================

    @Test
    public void testRefreshCache() throws Exception {
        // 刷新缓存接口响应正确
        mockMvc.perform(post("/api/module/order/refresh-cache"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"));

        // 刷新后，普通查询依然正常返回数据（验证缓存重建成功）
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"page\":1,\"size\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.rows", hasSize(3)));
    }
}
