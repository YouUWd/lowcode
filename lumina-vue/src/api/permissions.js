import client from './client';

export const permissionsApi = {
  /**
   * 获取指定模块的详细权限节点
   */
  getModulePermissions(moduleId) {
    return client.get(`/permissions/module/${moduleId}`);
  },

  /**
   * 设置指定模块的权限
   */
  updateModulePermissions(moduleId, permissions) {
    return client.post(`/permissions/module/${moduleId}`, { permissions });
  },

  /**
   * 清空模块权限
   */
  clearModulePermissions(moduleId) {
    return client.post(`/permissions/module/${moduleId}/clear`);
  },

  /**
   * 获取全局物理字段权限配置
   */
  getGlobalPermissions(roleCode) {
    return client.get(`/admin/permission/global/${roleCode}`);
  },

  /**
   * 批量更新全局物理字段权限配置
   */
  updateGlobalPermissions(roleCode, tables) {
    return client.post(`/admin/permission/field/batch`, { roleCode, tables });
  }
};
