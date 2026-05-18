import { reactive } from 'vue';
import { workflowApi } from '../api/workflow';
import { setLoading } from './app';

export const workflowState = reactive({
  instances: [],
  currentDetail: null,
  activeTasks: []
});

export const fetchWorkflowInstances = async () => {
  try {
    setLoading(true);
    const data = await workflowApi.getInstances();
    workflowState.instances = data;
    return data;
  } catch (e) {
    console.error('[Store:Workflow] Fetch instances failed:', e);
  } finally {
    setLoading(false);
  }
};

export const fetchWorkflowDetail = async (businessNo) => {
  try {
    const data = await workflowApi.getPanorama(businessNo);
    workflowState.currentDetail = data;
    
    // Refresh active tasks
    workflowState.activeTasks = (data.tasks || []).filter(t => t.status === 'PENDING').map(t => {
      const node = data.nodes.find(n => n.id == t.nodeId);
      return { 
        ...t, 
        nodeConfig: node ? { node_name: node.name, node_type: node.type, role_target: node.role } : { node_name: '未知' } 
      };
    });
    
    return data;
  } catch (e) {
    console.error(`[Store:Workflow] Fetch detail failed for ${businessNo}:`, e);
  }
};

export const submitWorkflowTask = async (businessNo, taskId, action, comment, userId) => {
  try {
    await workflowApi.handleTask(businessNo, { taskId, action, comment, userId });
    await fetchWorkflowDetail(businessNo);
    return true;
  } catch (e) {
    console.error('[Store:Workflow] Task handling failed:', e);
    return false;
  }
};
