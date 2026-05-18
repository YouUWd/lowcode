import client from './client';

export const metadataApi = {
  /**
   * 获取全量数据库模型
   */
  getSchema() {
    return client.get('/metadata/schema');
  },

  /**
   * 获取特定表详情
   */
  getTableDetail(tableName) {
    return client.get(`/metadata/tables/${tableName}`);
  },

  /**
   * 获取所有表列表
   */
  getAllTables() {
    return client.get('/metadata/tables');
  },

  /**
   * 刷新元数据缓存
   */
  refreshCache() {
    return client.post('/metadata/cache/refresh');
  },

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return client.get('/metadata/cache/stats');
  }
};
