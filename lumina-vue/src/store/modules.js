import { reactive, computed } from 'vue';
import { modulesApi } from '../api/modules';
import { setLoading } from './app';

export const modulesState = reactive({
  list: [],
  activeModule: null, // Moved from UI store
  configs: {}
});

/**
 * currentConfig Computed: Based on local activeModule
 */
export const currentConfig = computed(() => {
  const modId = modulesState.activeModule?.id;
  if (!modId) return { primaryEntity: { name: 'loading', desc: '请选择模块' }, entities: [], mappings: [] };
  return modulesState.configs[modId] || { primaryEntity: { name: 'loading', desc: '加载中...' }, entities: [], mappings: [] };
});

export const setActiveModule = (module) => {
  modulesState.activeModule = module;
};

export const fetchModules = async () => {
  try {
    setLoading(true);
    const modules = await modulesApi.getAll() || [];
    modulesState.list = modules.map(m => ({
      ...m,
      active: !!m.active
    }));
  } catch (e) {
    console.error('[Store:Modules] Fetch failed:', e);
  } finally {
    setLoading(false);
  }
};

export const fetchConfig = async (modId) => {
  if (modulesState.configs[modId]) return;
  try {
    setLoading(true);
    modulesState.configs[modId] = await modulesApi.getById(modId) || { entities: [], mappings: [] };
  } catch (e) {
    console.error(`[Store:Modules] Fetch config failed for ${modId}:`, e);
  } finally {
    setLoading(false);
  }
};

export const addModule = async (moduleData) => {
  try {
    setLoading(true);
    const payload = {
      ...moduleData,
      primaryEntity: { name: moduleData.entity, desc: moduleData.desc || '主表' },
      count: 0,
      active: true
    };
    const data = await modulesApi.create(payload);
    
    if (data) {
      const finalModule = { ...moduleData, ...data, active: !!(data.active ?? true) };
      modulesState.list.unshift(finalModule);
      modulesState.configs[finalModule.id] = {
        primaryEntity: finalModule.primaryEntity || { name: finalModule.entity, desc: finalModule.desc },
        entities: [],
        mappings: []
      };
      return true;
    }
  } catch (e) {
    console.error('[Store:Modules] Add failed:', e);
  } finally {
    setLoading(false);
  }
  return false;
};

export const deleteModule = async (moduleId) => {
  if (!confirm('确定要删除该模块吗？此操作不可逆。')) return false;
  try {
    setLoading(true);
    await modulesApi.delete(moduleId);
    modulesState.list = modulesState.list.filter(m => m.id !== moduleId);
    if (modulesState.activeModule?.id === moduleId) {
      modulesState.activeModule = null;
    }
    return true;
  } catch (e) {
    console.error('[Store:Modules] Delete failed:', e);
    return false;
  } finally {
    setLoading(false);
  }
};

export const addEntityToCurrentConfig = async (entity) => {
  const modId = modulesState.activeModule?.id;
  if (!modId) return;
  try {
    setLoading(true);
    const payload = {
      ...entity,
      id: entity.id || `entity_${Date.now()}`,
      status: 'active',
      relationType: entity.cardinality || '1:1',
      joinCondition: { left: entity.left, right: entity.right }
    };

    const data = await modulesApi.addEntity(modId, payload);
    if (data && currentConfig.value) {
      const finalEntity = { ...payload, ...data };
      currentConfig.value.entities.push(finalEntity);
    }
  } catch (e) {
    console.error('[Store:Modules] Add entity failed:', e);
  } finally {
    setLoading(false);
  }
};

export const removeEntityFromCurrentConfig = async (entityId) => {
  const modId = modulesState.activeModule?.id;
  if (!modId || !confirm('确定要移除此关联表吗？')) return;
  try {
    setLoading(true);
    await modulesApi.deleteEntity(modId, entityId);
    const entities = currentConfig.value?.entities;
    if (entities) {
      const index = entities.findIndex(e => e.id === entityId);
      if (index !== -1) entities.splice(index, 1);
    }
  } catch (e) {
    console.error('[Store:Modules] Remove entity failed:', e);
  } finally {
    setLoading(false);
  }
};

export const addMappingToCurrentConfig = async (mapping) => {
  const modId = modulesState.activeModule?.id;
  if (!modId) return;
  try {
    setLoading(true);
    const data = await modulesApi.addField(modId, mapping);
    if (data && currentConfig.value) {
      const finalMapping = { ...mapping, ...data };
      currentConfig.value.mappings.push(finalMapping);
    }
  } catch (e) {
    console.error('[Store:Modules] Add mapping failed:', e);
  } finally {
    setLoading(false);
  }
};

export const deleteMappingFromCurrentConfig = async (logicalField) => {
  const modId = modulesState.activeModule?.id;
  if (!modId || !confirm('确定要删除此字段配置吗？')) return;
  try {
    setLoading(true);
    await modulesApi.deleteField(modId, logicalField);
    if (currentConfig.value?.mappings) {
      const index = currentConfig.value.mappings.findIndex(m => m.logicalField === logicalField);
      if (index !== -1) currentConfig.value.mappings.splice(index, 1);
    }
  } catch (e) {
    console.error('[Store:Modules] Delete mapping failed:', e);
  } finally {
    setLoading(false);
  }
};
