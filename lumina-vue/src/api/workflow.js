import client from './client';

export const workflowApi = {
  /**
   * 获取所有流程实例
   */
  getInstances() {
    return client.get('/workflow/instances');
  },

  /**
   * 获取流程全景视图（详情）
   */
  getPanorama(businessNo) {
    return client.get(`/workflow/panorama/${businessNo}`);
  },

  /**
   * 获取单据当前活跃任务
   */
  getTasks(businessNo) {
    return client.get(`/workflow/tasks/${businessNo}`);
  },

  /**
   * 发起审批流程
   */
  startProcess(payload) {
    return client.post('/workflow/start', payload);
  },

  /**
   * 处理节点任务 (同意/驳回)
   */
  handleTask(businessNo, data) {
    return client.post(`/workflow/handle/${businessNo}`, data);
  },

  /**
   * 模拟数据变更触发回退
   */
  mockDataChange(businessNo) {
    return client.post(`/workflow/mock-data-change/${businessNo}`);
  }
};
