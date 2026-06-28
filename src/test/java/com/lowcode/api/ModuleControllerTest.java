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

    @Test
    public void testQueryList() throws Exception {
        // 1. 测试最基础的分页查询并携带拉取 JOIN 表 (customer_profiles)
        String reqJson = "{\"page\":1,\"size\":5,\"with\":[{\"tableName\":\"customer_profiles\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rows").isArray())
                .andExpect(jsonPath("$.data.total").value(3))
                // 精确校验第 1 行 (ID 3):
                .andExpect(jsonPath("$.data.rows[0].orders.id").value(3))
                .andExpect(jsonPath("$.data.rows[0].orders.order_no").value("ORD-20240102-003"))
                .andExpect(jsonPath("$.data.rows[0].orders.customer").value("王五"))
                .andExpect(jsonPath("$.data.rows[0].orders.amount").value(800.00))
                .andExpect(jsonPath("$.data.rows[0].orders.status").value("PENDING"))
                .andExpect(jsonPath("$.data.rows[0].orders.remark").value(nullValue()))
                .andExpect(jsonPath("$.data.rows[0].orders.created_at").exists())
                .andExpect(jsonPath("$.data.rows[0].orders.updated_at").exists())
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.id").value(3))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.name").value("王五"))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.level").value("REGULAR"))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.contact_phone").value("13700137000"));
    }

    @Test
    public void testQueryListWithSubTable() throws Exception {
        // 2. 测试列表查询同时携带拉取从表明细 (order_items)
        String reqJson = "{\"page\":1,\"size\":5,\"with\":[{\"tableName\":\"order_items\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rows").isArray())
                .andExpect(jsonPath("$.data.rows[2].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[2].order_items").isArray())
                .andExpect(jsonPath("$.data.rows[2].order_items", hasSize(2)))
                // 校验订单 1 绑定的所有明细项的完整属性映射
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
                .andExpect(jsonPath("$.data.rows[2].order_items[1].created_at").exists());
    }

    @Test
    public void testQueryListWithRelations() throws Exception {
        // 3. 测试列表查询同时携带多对多标签 (tags)
        String reqJson = "{\"page\":1,\"size\":5,\"with\":[{\"tableName\":\"tags\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rows").isArray())
                .andExpect(jsonPath("$.data.rows[2].orders.id").value(1))
                .andExpect(jsonPath("$.data.rows[2].tags").isArray())
                .andExpect(jsonPath("$.data.rows[2].tags", hasSize(2)))
                // 校验订单 1 多对多绑定的全部标签细节
                .andExpect(jsonPath("$.data.rows[2].tags[0].id").value(1))
                .andExpect(jsonPath("$.data.rows[2].tags[0].name").value("VIP"))
                .andExpect(jsonPath("$.data.rows[2].tags[1].id").value(4))
                .andExpect(jsonPath("$.data.rows[2].tags[1].name").value("特价"));
    }

    @Test
    public void testDetailQuery() throws Exception {
        // 4. 测试单条详情查询
        String reqJson = "{\"id\":1}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                // 精确断言主表行每一个字段
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.orders.order_no").value("ORD-20240101-001"))
                .andExpect(jsonPath("$.data.orders.customer").value("张三"))
                .andExpect(jsonPath("$.data.orders.amount").value(1500.00))
                .andExpect(jsonPath("$.data.orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.orders.remark").value("首单客户"))
                .andExpect(jsonPath("$.data.orders.created_at").exists())
                .andExpect(jsonPath("$.data.orders.updated_at").exists())
                // 精确断言子表行每一个字段
                .andExpect(jsonPath("$.data.order_items").isArray())
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
                // 精确断言多对多关联每一个字段
                .andExpect(jsonPath("$.data.tags").isArray())
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andExpect(jsonPath("$.data.tags[0].id").value(1))
                .andExpect(jsonPath("$.data.tags[0].name").value("VIP"))
                .andExpect(jsonPath("$.data.tags[1].id").value(4))
                .andExpect(jsonPath("$.data.tags[1].name").value("特价"));
    }

    @Test
    public void testDetailQueryWithProjection() throws Exception {
        // 5. 测试单条详情查询 + 指定拉取特定的列
        String reqJson = "{\"id\":1,\"with\":[{\"tableName\":\"order_items\",\"fields\":[\"product_name\",\"price\"]}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.orders.order_no").value("ORD-20240101-001"))
                .andExpect(jsonPath("$.data.orders.customer").value("张三"))
                .andExpect(jsonPath("$.data.orders.amount").value(1500.00))
                .andExpect(jsonPath("$.data.orders.status").value("PAID"))
                .andExpect(jsonPath("$.data.orders.remark").value("首单客户"))
                .andExpect(jsonPath("$.data.order_items").isArray())
                .andExpect(jsonPath("$.data.order_items", hasSize(2)))
                // 精确检验投影拉取出来的特定列存在性与正确值，并且其他未选中的列必须不存在
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("鼠标"))
                .andExpect(jsonPath("$.data.order_items[0].price").value(500.00))
                .andExpect(jsonPath("$.data.order_items[0].id").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].order_id").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].qty").doesNotExist())
                .andExpect(jsonPath("$.data.order_items[0].created_at").doesNotExist())
                .andExpect(jsonPath("$.data.tags").doesNotExist()); // 标签未被 with 包含，不应存在
    }

    @Test
    public void testQueryFilters() throws Exception {
        // 6. 测试多重 AND 条件筛选
        String reqJson = "{\"filters\":[" +
                "{\"tableName\":\"orders\",\"field\":\"customer\",\"op\":\"LIKE\",\"value\":\"张\"}," +
                "{\"tableName\":\"orders\",\"field\":\"amount\",\"op\":\"GTE\",\"value\":1000}" +
                "]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.rows").isArray())
                .andExpect(jsonPath("$.data.rows", hasSize(1)))
                // 校验被筛选出的唯一条订单的每一个字段，没有缺失
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
    public void testValidationErrors() throws Exception {
        // 7. 测试校验器异常流程 (非法的 with 表名)
        String invalidTableJson = "{\"with\":[{\"tableName\":\"nonexistent_table\"}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidTableJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Unknown table or relation")));

        // 8. 测试校验器异常流程 (表内非法的列名)
        String invalidFieldJson = "{\"with\":[{\"tableName\":\"order_items\",\"fields\":[\"invalid_col\"]}]}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidFieldJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value(containsString("Unknown field in 'with'")));
    }

    @Test
    public void testSaveAndCascadeDelete() throws Exception {
        // 9. 测试一键新增主从记录 + 多对多关联绑定
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
                .andExpect(jsonPath("$.data").isNumber())
                .andReturn().getResponse().getContentAsString();

        // 提取新插入的主表 ID
        Number newId = com.jayway.jsonpath.JsonPath.read(resultStr, "$.data");
        long generatedId = newId.longValue();

        // --- 数据库严密校验 (新增后) ---
        // 1. 主表订单确认存在，且字段正确
        var dbOrder = dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId)).fetchOne();
        assertNotNull(dbOrder);
        assertEquals("ORD-TEST-1234", dbOrder.get("order_no"));
        assertEquals("测试自动", dbOrder.get("customer"));
        assertEquals(0, new BigDecimal("888.00").compareTo((BigDecimal) dbOrder.get("amount")));

        // 2. 从表订单项应包含2个商品，且名称和价格无误
        var dbItems = dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("id").asc()).fetch();
        assertEquals(2, dbItems.size());
        assertEquals("测试商品A", dbItems.get(0).get("product_name"));
        assertEquals("测试商品B", dbItems.get(1).get("product_name"));

        // 3. 关联标签确认存在2个
        var dbTags = dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("tag_id").asc()).fetch();
        assertEquals(2, dbTags.size());
        assertEquals(1L, ((Number) dbTags.get(0).get("tag_id")).longValue());
        assertEquals(2L, ((Number) dbTags.get(1).get("tag_id")).longValue());

        // 10. 测试保存后读取主表与明细数据正确 (API 端校验)
        String detailJson = "{\"id\":" + generatedId + "}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders.customer").value("测试自动"))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("测试商品A"))
                .andExpect(jsonPath("$.data.tags[0].id").value(1));

        // 11. 执行级联更新 (更新主表 customer，修改 A，删除 B，新增 C，更换标签为 2, 4)
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
                .andExpect(jsonPath("$.code").value(200));

        // --- 数据库严密校验 (更新后) ---
        // 1. 主表更新正确
        var dbOrderUpdated = dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId)).fetchOne();
        assertNotNull(dbOrderUpdated);
        assertEquals("测试修改", dbOrderUpdated.get("customer"));
        assertEquals(0, new BigDecimal("999.00").compareTo((BigDecimal) dbOrderUpdated.get("amount")));

        // 2. 从表订单项：商品 B 应当已被自动删除；商品 A 的属性已被更新；商品 C 已被插入
        var dbItemsUpdated = dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("id").asc()).fetch();
        assertEquals(2, dbItemsUpdated.size());
        // 第一个是修改后的 A
        assertEquals(itemAId, ((Number) dbItemsUpdated.get(0).get("id")).longValue());
        assertEquals("测试商品A-改", dbItemsUpdated.get(0).get("product_name"));
        assertEquals(3, ((Number) dbItemsUpdated.get(0).get("qty")).intValue());
        // 第二个是新增的 C
        assertEquals("测试商品C", dbItemsUpdated.get(1).get("product_name"));

        // 3. 关联关系：标签应当已经更新为 2, 4
        var dbTagsUpdated = dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId)).orderBy(DSL.field("tag_id").asc()).fetch();
        assertEquals(2, dbTagsUpdated.size());
        assertEquals(2L, ((Number) dbTagsUpdated.get(0).get("tag_id")).longValue());
        assertEquals(4L, ((Number) dbTagsUpdated.get(1).get("tag_id")).longValue());

        // 12. 执行删除操作
        mockMvc.perform(delete("/api/module/order/" + generatedId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // --- 数据库严密校验 (删除后) ---
        // 确保所有关联数据在底层数据库已物理清除干净
        assertFalse(dsl.fetchExists(dsl.selectFrom("orders").where(DSL.field("id").eq(generatedId))));
        assertFalse(dsl.fetchExists(dsl.selectFrom("order_items").where(DSL.field("order_id").eq(generatedId))));
        assertFalse(dsl.fetchExists(dsl.selectFrom("order_tags").where(DSL.field("order_id").eq(generatedId))));

        // 13. 确认删除后无法查到该主表与从表明细数据 (API 端校验)
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders").doesNotExist());
    }

    @Test
    public void testRefreshCache() throws Exception {
        // 14. 测试缓存刷新接口
        mockMvc.perform(post("/api/module/order/refresh-cache"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
