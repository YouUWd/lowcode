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
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

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
    // 所有旧用例通过指定 X-Role: admin 头部保证完全兼容
    // ================================================================

    @Test
    public void testQueryList() throws Exception {
        // 测试最基础的分页查询并携带拉取 JOIN 表 (customer_profiles)
        String reqJson = """
                {
                  "page": 1,
                  "size": 5,
                  "with": [
                    { "tableName": "customer_profiles" }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.contact_phone").value("13700137000"));
    }

    @Test
    public void testQueryListPagination() throws Exception {
        // 测试分页参数生效：size=2, page=1 应只返回 2 条，但 total 仍为 3
        String reqJson = """
                {
                  "page": 1,
                  "size": 2
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
        String page2Json = """
                {
                  "page": 2,
                  "size": 2
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
        String reqJson = """
                {
                  "page": 1,
                  "size": 5,
                  "with": [
                    { "tableName": "order_items" }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
                .andExpect(jsonPath("$.data.rows[2].order_items[0].created_at").exists());
    }

    @Test
    public void testQueryListWithRelations() throws Exception {
        // 测试列表查询同时携带多对多标签 (tags)
        String reqJson = """
                {
                  "page": 1,
                  "size": 5,
                  "with": [
                    { "tableName": "tags" }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
                .andExpect(jsonPath("$.data.rows[2].tags[1].name").value("特价"));
    }

    // ================================================================
    // 用例 4 - 5：单条详情查询（含字段投影）
    // ================================================================

    @Test
    public void testDetailQuery() throws Exception {
        // 测试单条详情查询（ID=1），自动附带所有从表与关联表
        String reqJson = """
                {
                  "id": 1
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
                // 从表全字段断言
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("鼠标"))
                .andExpect(jsonPath("$.data.order_items[0].price").value(500.00))
                // 多对多标签全字段断言
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andExpect(jsonPath("$.data.tags[0].id").value(1))
                .andExpect(jsonPath("$.data.tags[0].name").value("VIP"));
    }

    @Test
    public void testDetailQueryNotFound() throws Exception {
        // 测试查询不存在的 ID，整个 data 应返回 null
        String reqJson = """
                {
                  "id": 99999
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
        String reqJson = """
                {
                  "id": 1,
                  "with": [
                    {
                      "tableName": "order_items",
                      "fields": ["product_name", "price"]
                    }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.orders.customer").value("张三"))
                // 子表：只有被投影的 2 个字段，其余字段严格不存在
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("鼠标"))
                .andExpect(jsonPath("$.data.order_items[0].price").value(500.00))
                .andExpect(jsonPath("$.data.order_items[0].id").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].qty").doesNotExist())
                // 未被 with 包含的关联表不应出现
                .andExpect(jsonPath("$.data.tags").doesNotExist());
    }

    // ================================================================
    // 用例 6：多条件过滤
    // ================================================================

    @Test
    public void testQueryFilters() throws Exception {
        // 测试多重 AND 条件筛选（customer LIKE '张' AND amount >= 1000）
        String reqJson = """
                {
                  "filters": [
                    { "tableName": "orders", "field": "customer", "op": "LIKE", "value": "张" },
                    { "tableName": "orders", "field": "amount", "op": "GTE", "value": 1000 }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.rows", hasSize(1)))
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[0].orders.customer").value("张三"));
    }

    @Test
    public void testQueryFiltersNoMatch() throws Exception {
        // 测试过滤条件无匹配时，应返回空 rows 列表，total=0
        String reqJson = """
                {
                  "filters": [
                    { "tableName": "orders", "field": "customer", "op": "EQ", "value": "不存在的客户" }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.total").value(0))
                .andExpect(jsonPath("$.data.rows", hasSize(0)));
    }

    // ================================================================
    // 用例 7 - 8：校验器异常流程
    // ================================================================

    @Test
    public void testValidationErrors() throws Exception {
        // 测试非法的 with 表名
        String invalidTableJson = """
                {
                  "with": [
                    { "tableName": "nonexistent_table" }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidTableJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Unknown table or relation in 'with'")));

        // 测试表内非法的列名
        String invalidFieldJson = """
                {
                  "with": [
                    { "tableName": "order_items", "fields": ["invalid_col"] }
                  ]
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
        String saveJson = """
                {
                  "data": {
                    "orders": {
                      "order_no": "ORD-TEST-1234",
                      "customer": "测试自动",
                      "amount": 888.00,
                      "status": "PENDING"
                    },
                    "order_items": [
                      { "product_name": "测试商品A", "qty": 2, "price": 100.00 },
                      { "product_name": "测试商品B", "qty": 1, "price": 688.00 }
                    ],
                    "tags": [
                      { "id": 1 },
                      { "id": 2 }
                    ]
                  }
                }
                """;

        String resultStr = mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "admin")
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

        var dbItems = dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("id").asc()).fetch();
        assertEquals(2, dbItems.size());
        assertEquals("测试商品A", dbItems.get(0).get("product_name"));
        assertEquals("测试商品B", dbItems.get(1).get("product_name"));

        var dbTags = dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("tag_id").asc()).fetch();
        assertEquals(2, dbTags.size());

        // ── API 全字段校验（新增后）──────────────────────────────────────
        String detailJson = String.format("""
                {
                  "id": %d
                }
                """, generatedId);
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.orders.customer").value("测试自动"))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("测试商品A"))
                .andExpect(jsonPath("$.data.tags[0].id").value(1));

        // ── 步骤 2: 级联更新（修改主表，改子项A，删子项B，加子项C，换标签为2,4）──
        long itemAId = ((Number) dbItems.get(0).get("id")).longValue();
        String updateJson = String.format("""
                {
                  "data": {
                    "orders": {
                      "id": %d,
                      "order_no": "ORD-TEST-1234",
                      "customer": "测试修改",
                      "amount": 999.00,
                      "status": "PAID"
                    },
                    "order_items": [
                      { "id": %d, "product_name": "测试商品A-改", "qty": 3, "price": 120.00 },
                      { "product_name": "测试商品C", "qty": 1, "price": 639.00 }
                    ],
                    "tags": [
                      { "id": 2 },
                      { "id": 4 }
                    ]
                  }
                }
                """, generatedId, itemAId);

        mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "admin")
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

        var dbItemsUpdated = dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("id").asc()).fetch();
        assertEquals(2, dbItemsUpdated.size());
        assertEquals(itemAId, ((Number) dbItemsUpdated.get(0).get("id")).longValue());
        assertEquals("测试商品A-改", dbItemsUpdated.get(0).get("product_name"));

        var dbTagsUpdated = dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("tag_id").asc()).fetch();
        assertEquals(2, dbTagsUpdated.size());

        // ── API 全字段校验（更新后）──────────────────────────────────────
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"))
                .andExpect(jsonPath("$.data.orders.customer").value("测试修改"))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("测试商品A-改"))
                .andExpect(jsonPath("$.data.tags[0].id").value(2));

        // ── 步骤 3: 级联物理删除 ─────────────────────────────────────────
        mockMvc.perform(delete("/api/module/order/" + generatedId)
                        .header("X-Role", "admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"));

        // ── DB 严密校验（删除后）──────────────────────────────────────────
        assertFalse(dsl.fetchExists(dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId))));
        assertFalse(dsl.fetchExists(dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId))));
        assertFalse(dsl.fetchExists(dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId))));

        // ── API 校验（删除后）─────────────────────────────────────────────
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
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
        String queryJson = """
                {
                  "page": 1,
                  "size": 5
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(queryJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.rows", hasSize(3)));
    }

    // ================================================================
    // 新增：白名单字段级权限完整校验集成测试用例
    // ================================================================

    @Test
    public void testPermissionsForViewerRole() throws Exception {
        // 1. 测试 viewer 角色（查看员）查询详情 (ID=1)
        // viewer 角色未配置 remark 字段权限记录，根据白名单原则，该字段应在响应中彻底被剥离
        String reqJson = """
                {
                  "id": 1
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "viewer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.orders.order_no").value("ORD-20240101-001"))
                .andExpect(jsonPath("$.data.orders.amount").value(1500.00))
                // 验证 remark 字段在 API 返回中彻底不存在（即白名单过滤生效）
                .andExpect(jsonPath("$.data.orders.remark").doesNotExist())
                // viewer 角色有 level 与 contact_phone 权限
                .andExpect(jsonPath("$.data.customer_profiles.level").value("VIP"))
                .andExpect(jsonPath("$.data.customer_profiles.contact_phone").value("13800138000"));
    }

    @Test
    public void testPermissionsForAnonymousRole() throws Exception {
        // 2. 测试未传角色请求头（自动归为 anonymous 角色，没有任何字段权限配置）
        // 按照纯白名单原则，没有配置任何可读列将直接抛出异常（400，无任何可读字段）
        String reqJson = """
                {
                  "page": 1,
                  "size": 5
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("无任何可读字段")));
    }

    @Test
    public void testSaveAndUpdatePermissionsForEditorRole() throws Exception {
        // 3. 测试 editor 角色写入与更新过滤规则
        // editor 角色对 amount 字段具有 w (can_write=true)，但不具备 u (can_update=false, 权限位为 6 = rw-)
        // editor 角色对 status 字段不具备 w (can_write=false)，但具备 u (can_update=true, 权限位为 5 = r-u)

        // ── 步骤 1: 写入测试 (INSERT) ──
        // 只传入可写的 amount，不传入无权写的 status，应当成功
        String saveJson = """
                {
                  "data": {
                    "orders": {
                      "order_no": "ORD-EDIT-11",
                      "customer": "编辑新增",
                      "amount": 555.00
                    }
                  }
                }
                """;

        String resultStr = mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "editor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn().getResponse().getContentAsString();

        Number newId = com.jayway.jsonpath.JsonPath.read(resultStr, "$.data");
        long generatedId = newId.longValue();

        // ── 数据库直接验证写入状态 ──
        var dbOrder = dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId)).fetchOne();
        assertNotNull(dbOrder);
        assertEquals("ORD-EDIT-11", dbOrder.get("order_no"));
        assertEquals("编辑新增", dbOrder.get("customer"));
        assertEquals(0, new BigDecimal("555.00").compareTo((BigDecimal) dbOrder.get("amount")));
        assertEquals("PENDING", dbOrder.get("status")); // 默认值

        // ── 步骤 2: 更新测试 (UPDATE) ──
        // 只传入可更新的 status，不传入无更新权限的 amount，应当成功
        String updateJson = String.format("""
                {
                  "data": {
                    "orders": {
                      "id": %d,
                      "order_no": "ORD-EDIT-11",
                      "customer": "编辑新增",
                      "status": "PAID"
                    }
                  }
                }
                """, generatedId);

        mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "editor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // ── 数据库直接验证更新状态 ──
        var dbOrderUpdated = dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId)).fetchOne();
        assertNotNull(dbOrderUpdated);
        assertEquals(0, new BigDecimal("555.00").compareTo((BigDecimal) dbOrderUpdated.get("amount"))); // 没传，保持原值
        assertEquals("PAID", dbOrderUpdated.get("status")); // 传入可更新的 status，应该成功更新

        // ── 步骤 3: 级联物理清理 ──
        mockMvc.perform(delete("/api/module/order/" + generatedId)
                        .header("X-Role", "admin"))
                .andExpect(status().isOk());
    }

    @Test
    public void testViewerListQueryAndExcludeRemark() throws Exception {
        // viewer 角色列表查询应该正常，但是不包含任何 orders.remark 字段值
        String queryJson = """
                {
                  "page": 1,
                  "size": 5
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "viewer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(queryJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rows", hasSize(3)))
                // 第一行数据字段校验：不能含有 remark 字段
                .andExpect(jsonPath("$.data.rows[0].orders.id").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.order_no").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.remark").doesNotExist());
    }

    @Test
    public void testViewerSaveRejected() throws Exception {
        // viewer 角色的所有字段都是只读 (4)，不具备写操作权限，保存时应该因为没有任何可写字段而抛出错误 (400)
        String saveJson = """
                {
                  "data": {
                    "orders": {
                      "order_no": "ORD-VIEW-99",
                      "customer": "只读人员试图写入",
                      "amount": 99.00,
                      "status": "PENDING"
                    }
                  }
                }
                """;
        mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "viewer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("无权写入字段: orders.order_no")));
    }

    @Test
    public void testEditorListQuery() throws Exception {
        // editor 角色进行列表查询，应当正常工作并返回其被授权的字段
        String queryJson = """
                {
                  "page": 1,
                  "size": 5
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "editor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(queryJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rows[0].orders.id").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.amount").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.status").exists());
    }

    @Test
    public void testViewerUpdateRejected() throws Exception {
        // viewer 只有只读权限 (4)，试图修改订单数据（customer 和 amount）
        // 期望直接抛出无权更新字段异常并返回 400
        String updateJson = """
                {
                  "data": {
                    "orders": {
                      "id": 1,
                      "order_no": "ORD-20240101-001",
                      "customer": "恶意篡改的姓名",
                      "amount": 999999.99,
                      "status": "COMPLETED"
                    }
                  }
                }
                """;
        mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "viewer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("无权更新字段: orders.order_no")));
    }

    @Test
    public void testEditorSaveUnauthorizedFieldRejected() throws Exception {
        // editor 角色对 status 字段无写入权限 (can_write=false)，试图传入该字段保存
        // 期望直接拦截并返回 400
        String saveJson = """
                {
                  "data": {
                    "orders": {
                      "order_no": "ORD-EDIT-BAD-1",
                      "customer": "编辑写入非法",
                      "amount": 100.00,
                      "status": "PAID"
                    }
                  }
                }
                """;
        mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "editor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("无权写入字段: orders.status")));
    }

    @Test
    public void testEditorUpdateUnauthorizedFieldRejected() throws Exception {
        // editor 角色对 amount 字段无更新权限 (can_update=false)，试图传入该字段修改
        // 期望直接拦截并返回 400
        String updateJson = """
                {
                  "data": {
                    "orders": {
                      "id": 1,
                      "order_no": "ORD-20240101-001",
                      "amount": 999.00
                    }
                  }
                }
                """;
        mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "editor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("无权更新字段: orders.amount")));
    }

    @Test
    public void testEditorSubTableSaveAndUpdatePermissions() throws Exception {
        // editor 角色对 order_items 的普通字段（product_name, qty, price）有 w & u 权限
        // 但对 created_at 字段只有只读权限 (4)，没有写入和更新权限。

        // ── 步骤 1: 新增测试 (INSERT) ──
        // 我们尝试在明细项中传入自定义的 created_at 时间
        // 注意：orders 中省略了 editor 无权写入的 status 字段
        String saveJson = """
                {
                  "data": {
                    "orders": {
                      "order_no": "ORD-EDIT-SUB",
                      "customer": "编辑从表测试",
                      "amount": 100.00
                    },
                    "order_items": [
                      {
                        "product_name": "测试鼠标",
                        "qty": 5,
                        "price": 20.00,
                        "created_at": "2020-01-01 12:00:00"
                      }
                    ]
                  }
                }
                """;

        String resultStr = mockMvc.perform(post("/api/module/order/save")
                        .header("X-Role", "editor")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn().getResponse().getContentAsString();

        Number newId = com.jayway.jsonpath.JsonPath.read(resultStr, "$.data");
        long generatedId = newId.longValue();

        try {
            // 验证数据库：
            var dbItem = dsl.selectFrom("order_items")
                    .where(DSL.field("order_id").eq(generatedId))
                    .fetchOne();
            assertNotNull(dbItem);
            assertEquals("测试鼠标", dbItem.get("product_name"));
            // 应该忽略传入的自定义时间，由数据库生成默认当前时间（即不等于 2020 年）
            Object createdAtObj = dbItem.get("created_at");
            assertNotNull(createdAtObj);
            assertFalse(createdAtObj.toString().startsWith("2020"));

            // ── 步骤 2: 更新测试 (UPDATE) ──
            // 注意：orders 中省略了 editor 无权更新的 amount 字段
            long itemId = ((Number) dbItem.get("id")).longValue();
            String updateJson = String.format("""
                    {
                      "data": {
                        "orders": {
                          "id": %d,
                          "order_no": "ORD-EDIT-SUB",
                          "customer": "编辑从表测试",
                          "status": "PENDING"
                        },
                        "order_items": [
                          {
                            "id": %d,
                            "product_name": "测试鼠标-改",
                            "qty": 10,
                            "price": 18.00,
                            "created_at": "2021-05-05 12:00:00"
                          }
                        ]
                      }
                    }
                    """, generatedId, itemId);

            mockMvc.perform(post("/api/module/order/save")
                            .header("X-Role", "editor")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updateJson))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            // 验证更新后状态：
            var dbItemUpdated = dsl.selectFrom("order_items")
                    .where(DSL.field("id").eq(itemId))
                    .fetchOne();
            assertNotNull(dbItemUpdated);
            assertEquals("测试鼠标-改", dbItemUpdated.get("product_name"));
            assertEquals(10, dbItemUpdated.get("qty"));
            // created_at 依旧不能被更新，应当维持原有的插入时间
            Object createdAtObjUpdated = dbItemUpdated.get("created_at");
            assertNotNull(createdAtObjUpdated);
            assertEquals(createdAtObj.toString(), createdAtObjUpdated.toString());
        } finally {
            // ── 步骤 3: 物理清理 ──
            mockMvc.perform(delete("/api/module/order/" + generatedId)
                            .header("X-Role", "admin"))
                    .andExpect(status().isOk());
        }
    }

    @Test
    public void testPermissionAdminGet() throws Exception {
        // 验证管理员获取权限接口 GET /api/admin/permission/order/viewer
        mockMvc.perform(get("/api/admin/permission/order/viewer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                // 验证 orders.remark 字段存在于列表中且 perm 权限值为 0
                .andExpect(jsonPath("$.data[?(@.tableName=='orders')].fields[?(@.columnName=='remark')].perm", contains(0)));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testPermissionAdminBatchUpdateAndTakeEffect() throws Exception {
        // 1. 获取现有权限数据，用于还原和获取 fieldMetaId
        String getResult = mockMvc.perform(get("/api/admin/permission/order/viewer"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        List<Map<String, Object>> tables = com.jayway.jsonpath.JsonPath.read(getResult, "$.data");
        assertNotNull(tables);

        // 找到 orders.remark 的记录，并且修改为可读
        Long remarkFieldId = null;
        List<Map<String, Object>> updateTables = new ArrayList<>();
        for (var t : tables) {
            Map<String, Object> newTable = new HashMap<>();
            newTable.put("tableMetaId", t.get("tableMetaId"));
            
            List<Map<String, Object>> fields = (List<Map<String, Object>>) t.get("fields");
            List<Map<String, Object>> newFields = new ArrayList<>();
            for (var f : fields) {
                Map<String, Object> newField = new HashMap<>();
                newField.put("fieldMetaId", f.get("fieldMetaId"));
                
                int perm = ((Number) f.get("perm")).intValue();
                if ("remark".equals(f.get("columnName")) && "orders".equals(t.get("tableName"))) {
                    remarkFieldId = ((Number) f.get("fieldMetaId")).longValue();
                    perm = 4; // 修改为 4 (r--) 只读
                }
                newField.put("perm", perm);
                newFields.add(newField);
            }
            newTable.put("fields", newFields);
            updateTables.add(newTable);
        }

        assertNotNull(remarkFieldId);

        // 2. 调用批量修改权限接口，将 orders.remark 对 viewer 的读权限改为启用
        Map<String, Object> batchRequest = new HashMap<>();
        batchRequest.put("roleCode", "viewer");
        batchRequest.put("moduleId", "order");
        batchRequest.put("tables", updateTables);

        String batchJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(batchRequest);

        mockMvc.perform(post("/api/admin/permission/field/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(batchJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 3. 用 viewer 角色请求详情，验证原本屏蔽的 remark 字段现在可查到了（说明权限更新+缓存失效全链路生效）
        String detailJson = """
                {
                  "id": 1
                }
                """;
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "viewer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders.remark").value("首单客户"));

        // 4. 恢复测试前 viewer 角色在 orders.remark 上的屏蔽状态
        for (var t : updateTables) {
            List<Map<String, Object>> fields = (List<Map<String, Object>>) t.get("fields");
            for (var f : fields) {
                if (remarkFieldId.equals(((Number) f.get("fieldMetaId")).longValue())) {
                    f.put("perm", 0);
                }
            }
        }
        String restoreJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(batchRequest);
        mockMvc.perform(post("/api/admin/permission/field/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(restoreJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testPermissionAdminGetModuleNotFound() throws Exception {
        // 边界测试：获取不存在的模块权限，验证返回 400 (IllegalArgumentException) 以及 Module not found 错误提示
        mockMvc.perform(get("/api/admin/permission/nonexistent_module/viewer"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("模块不存在: nonexistent_module"));
    }

    @Test
    public void testPermissionAdminGetNonexistentRole() throws Exception {
        // 边界测试：获取一个完全不存在的角色的权限列表，应该返回所有字段权限均为 0 (NONE)
        mockMvc.perform(get("/api/admin/permission/order/nonexistent_role"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                // 验证首张表的所有字段权限值（perm）皆为 0
                .andExpect(jsonPath("$.data[0].fields[*].perm", everyItem(is(0))));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testPermissionAdminBatchUpdateClearAll() throws Exception {
        // 边界测试：物理清除某角色在模块的所有权限配置，直接传一个空 tables 列表
        // 1. 先备份原有配置
        String getResult = mockMvc.perform(get("/api/admin/permission/order/viewer"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<Map<String, Object>> originalTables = com.jayway.jsonpath.JsonPath.read(getResult, "$.data");

        // 2. 发送批量修改请求，传入空列表以清空角色权限配置
        Map<String, Object> clearRequest = new HashMap<>();
        clearRequest.put("roleCode", "viewer");
        clearRequest.put("moduleId", "order");
        clearRequest.put("tables", new ArrayList<>());

        String clearJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(clearRequest);

        mockMvc.perform(post("/api/admin/permission/field/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(clearJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 3. 此时以 viewer 角色查询模块订单列表，应直接被彻底拦截抛出 400 (无任何可读字段)
        String queryJson = "{\"page\": 1, \"size\": 5}";
        mockMvc.perform(post("/api/module/order/query")
                        .header("X-Role", "viewer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(queryJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("表 [orders] 无任何可读字段"));

        // 4. 物理还原备份的配置数据
        List<Map<String, Object>> restoreTables = new ArrayList<>();
        for (var t : originalTables) {
            Map<String, Object> newTable = new HashMap<>();
            newTable.put("tableMetaId", t.get("tableMetaId"));
            List<Map<String, Object>> fields = (List<Map<String, Object>>) t.get("fields");
            List<Map<String, Object>> newFields = new ArrayList<>();
            for (var f : fields) {
                Map<String, Object> newField = new HashMap<>();
                newField.put("fieldMetaId", f.get("fieldMetaId"));
                newField.put("perm", f.get("perm"));
                newFields.add(newField);
            }
            newTable.put("fields", newFields);
            restoreTables.add(newTable);
        }
        clearRequest.put("tables", restoreTables);
        String restoreJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(clearRequest);
        mockMvc.perform(post("/api/admin/permission/field/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(restoreJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testModuleGetMeta() throws Exception {
        // 测试获取模块元数据结构，用于前端动态渲染/构建页面模型
        mockMvc.perform(get("/api/module/order/meta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value("order"))
                .andExpect(jsonPath("$.data.name").value("订单模块"))
                .andExpect(jsonPath("$.data.mainTable.tableName").value("orders"))
                .andExpect(jsonPath("$.data.mainTable.fields", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.data.subTables[0].tableName").value("order_items"));
    }

    @Test
    public void testModuleSaveDesign() throws Exception {
        // 1. 获取原有 Meta 结构
        String metaStr = mockMvc.perform(get("/api/module/order/meta"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        Map<String, Object> metaMap = mapper.readValue(
                mapper.readTree(metaStr).get("data").toString(),
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
        );

        String originalDesc = (String) metaMap.get("description");

        // 2. 更改字段 description 发起设计更新
        metaMap.put("description", "设计更新后的订单描述");
        String updateJson = mapper.writeValueAsString(metaMap);

        mockMvc.perform(post("/api/module/design")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk());

        // 3. 再次获取并验证更新与缓存刷新成功生效
        mockMvc.perform(get("/api/module/order/meta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.description").value("设计更新后的订单描述"));

        // 4. 环境还原
        metaMap.put("description", originalDesc);
        String restoreJson = mapper.writeValueAsString(metaMap);
        mockMvc.perform(post("/api/module/design")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(restoreJson))
                .andExpect(status().isOk());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testGlobalSchemaLoadAndSave() throws Exception {
        // 1. 获取当前项目的完整 Schema 信息
        String schemaStr = mockMvc.perform(get("/api/meta/schema"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.datasources", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.data.relations", hasSize(greaterThan(0))))
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        Map<String, Object> schemaMap = mapper.readValue(
                mapper.readTree(schemaStr).get("data").toString(),
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
        );

        // 2. 更改 table_meta 的 display_name 标签并提交保存
        List<Map<String, Object>> datasources = (List<Map<String, Object>>) schemaMap.get("datasources");
        List<Map<String, Object>> tables = (List<Map<String, Object>>) datasources.get(0).get("tables");
        Map<String, Object> orderTable = tables.stream()
                .filter(t -> "orders".equals(t.get("tableName")))
                .findFirst().orElseThrow();

        String originalDisplayName = (String) orderTable.get("displayName");
        orderTable.put("displayName", "协同设计新表名");

        String saveJson = mapper.writeValueAsString(schemaMap);
        mockMvc.perform(post("/api/meta/schema")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(saveJson))
                .andExpect(status().isOk());

        // 3. 重新拉取并验证更新成功且缓存刷新
        mockMvc.perform(get("/api/meta/schema"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.datasources[0].tables[0].displayName").value("协同设计新表名"));

        // 4. 数据还原
        orderTable.put("displayName", originalDisplayName);
        String restoreJson = mapper.writeValueAsString(schemaMap);
        mockMvc.perform(post("/api/meta/schema")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(restoreJson))
                .andExpect(status().isOk());
    }
}

