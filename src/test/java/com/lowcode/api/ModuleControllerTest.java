package com.lowcode.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 自动回滚测试对数据库所做的修改，保持测试后数据库清洁
@org.springframework.test.context.jdbc.Sql(scripts = "file:sql/init.sql", executionPhase = org.springframework.test.context.jdbc.Sql.ExecutionPhase.BEFORE_TEST_CLASS)
public class ModuleControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
                .andExpect(jsonPath("$.data.total").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.rows[0].customer_profiles.level").exists());
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
                .andExpect(jsonPath("$.data.rows[0].order_items").isArray());
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
                .andExpect(jsonPath("$.data.rows[0].tags").isArray());
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
                .andExpect(jsonPath("$.data.orders.id").value(1))
                .andExpect(jsonPath("$.data.order_items").isArray())
                .andExpect(jsonPath("$.data.tags").isArray());
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
                .andExpect(jsonPath("$.data.order_items[0].product_name").exists())
                .andExpect(jsonPath("$.data.order_items[0].qty").doesNotExist()) // 字段未被选择，不应存在
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
                .andExpect(jsonPath("$.data.rows[0].orders.customer").value(containsString("张")));
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
                "\"order_items\":[{\"product_name\":\"测试商品X\",\"qty\":5,\"price\":100.00}]," +
                "\"tags\":[{\"id\":1}]" +
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

        // 10. 测试保存后读取主表与明细数据正确
        String detailJson = "{\"id\":" + generatedId + "}";
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders.customer").value("测试自动"))
                .andExpect(jsonPath("$.data.order_items[0].product_name").value("测试商品X"))
                .andExpect(jsonPath("$.data.tags[0].id").value(1));

        // 11. 执行删除操作
        mockMvc.perform(delete("/api/module/order/" + generatedId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 12. 确认删除后无法查到该主表与从表明细数据
        mockMvc.perform(post("/api/module/order/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(detailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orders").doesNotExist());
    }

    @Test
    public void testRefreshCache() throws Exception {
        // 13. 测试缓存刷新接口
        mockMvc.perform(post("/api/module/order/refresh-cache"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
