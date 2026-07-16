import client from './client';

export const dataEngineApi = {
  /**
   * 1. 查询模块的结构元数据 (包含主表、从表、关联表及多对多定义)
   * GET /api/module/:moduleId/meta
   */
  getModuleMeta(moduleId) {
    return client.get(`/module/${moduleId}/meta`);
  },

  /**
   * 2. 通用数据查询 (支持列表分页与单条详情聚合)
   * POST /api/module/:moduleId/query
   * @param {string} moduleId 模块ID
   * @param {Object} payload { id, page, size, filters, sorts, with }
   * @param {string} roleCode 传入的 X-Role 头部用于 CLS 鉴权
   */
  query(moduleId, payload, roleCode) {
    return client.post(`/module/${moduleId}/query`, payload, {
      headers: { 'X-Role': roleCode }
    });
  },

  /**
   * 3. 动态级联保存/更新
   * POST /api/module/:moduleId/save
   * @param {string} moduleId 模块ID
   * @param {Object} data 包含主表及嵌套子表数组 (如 { id, name, order_items: [...] })
   * @param {string} roleCode 传入的 X-Role 头部进行写入/修改权限校验
   */
  save(moduleId, data, roleCode) {
    return client.post(`/module/${moduleId}/save`, { data }, {
      headers: { 'X-Role': roleCode }
    });
  },

  /**
   * 4. 级联物理删除
   * DELETE /api/module/:moduleId/:id
   */
  delete(moduleId, id) {
    return client.delete(`/module/${moduleId}/${id}`);
  }
};

export default dataEngineApi;
