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
  }
};
