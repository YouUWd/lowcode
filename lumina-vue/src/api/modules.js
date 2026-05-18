import client from './client';

export const modulesApi = {
  /**
   * 获取所有模块
   */
  getAll() {
    return client.get('/modules');
  },

  /**
   * 获取单个模块配置
   */
  getById(id) {
    return client.get(`/modules/${id}`);
  },

  /**
   * 创建新模块
   */
  create(data) {
    return client.post('/modules', data);
  },

  /**
   * 更新模块
   */
  update(id, data) {
    return client.put(`/modules/${id}`, data);
  },

  /**
   * 删除模块
   */
  delete(id) {
    return client.delete(`/modules/${id}`);
  },

  /**
   * 添加关联实体
   */
  addEntity(moduleId, entityData) {
    return client.post(`/modules/${moduleId}/entities`, entityData);
  },

  /**
   * 删除关联实体
   */
  deleteEntity(moduleId, entityId) {
    return client.delete(`/modules/${moduleId}/entities/${entityId}`);
  },

  /**
   * 添加字段映射
   */
  addField(moduleId, fieldData) {
    return client.post(`/modules/${moduleId}/fields`, fieldData);
  },

  /**
   * 删除字段映射
   */
  deleteField(moduleId, logicalField) {
    return client.delete(`/modules/${moduleId}/fields/${logicalField}`);
  }
};
