import { reactive } from 'vue';
import { permissionsApi } from '../api/permissions';
import { setLoading } from './app';

export const permissionsState = reactive({
  activeNodes: new Set(),
  detailedList: []
});

export const fetchDetailedPermissions = async (moduleId) => {
  try {
    const data = await permissionsApi.getModulePermissions(moduleId);
    if (data) {
      permissionsState.detailedList = data.permissions || [];
      const nodes = (data.permissions || []).map(p => p.permission_node);
      permissionsState.activeNodes = new Set(nodes);
    }
  } catch (e) {
    console.error('[Store:Permissions] Fetch failed:', e);
  }
};

export const updatePermissions = async (moduleId, permissions) => {
  try {
    setLoading(true);
    const data = await permissionsApi.updateModulePermissions(moduleId, Array.from(permissions));
    if (data) {
      permissionsState.activeNodes = new Set(data.permissions || permissions);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Store:Permissions] Update failed:', e);
    return false;
  } finally {
    setLoading(false);
  }
};
