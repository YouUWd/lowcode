import { reactive, computed, markRaw } from 'vue';

const API_BASE = 'http://localhost:3001/api';

// 1. 全局状态存储 (Global State)
export const state = reactive({
  // --- UI 状态 ---
  currentView: 'list',
  activeModule: null,
  loading: false,
  
  // --- 业务数据 ---
  modules: [],       // 核心模块列表
  configs: {},       // 模块对应的具体配置数据 (按模块 ID 缓存)
  
  // --- 权限管理 ---
  activePermissions: new Set(),
  detailedPermissions: [],
  
  // --- 元数据状态 ---
  dbSchema: null,      // 原始数据库模型信息
  dbSchemaUI: null,    // 经过转换的前端格式模型
  dbSchemaLoaded: false,
  dbSchemaError: null,
  cacheStats: null,    // 缓存统计信息
  lastUpdated: null,   // 最后更新时间
});

// 兼容旧代码的 mockDbSchema 导出
export const mockDbSchema = computed(() => state.dbSchemaUI || {});


// 2. 基础 Fetch 包装器
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    
    // 智能提取数据：
    // 1. 如果有 .data 字段 (NestJS 包装格式)，则提取 .data
    // 2. 否则直接返回 result (纯数组或对象格式)
    const finalData = (result && typeof result === 'object' && 'data' in result) 
      ? result.data 
      : result;

    console.log(`[API] ${url} ->`, finalData);
    return finalData;
  } catch (error) {
    console.error(`[API Error] ${url}:`, error);
    throw error;
  }
}

// 3. 元数据 API (Metadata Actions)

export const loadDatabaseSchema = async (database = 'lumina_business') => {
  try {
    state.loading = true;
    state.dbSchemaError = null;
    
    // 1. 加载全量模型
    const schema = await apiFetch(`/metadata/schema?database=${database}`);
    state.dbSchema = schema;
    
    // 2. 本地转换为 UI 所需格式 (不再需要后端简化模型接口)
    const transformedUI = {};
    if (schema && schema.tables) {
      schema.tables.forEach(table => {
        transformedUI[table.tableName] = {
          desc: table.tableComment || table.tableName,
          fields: table.fields.map(f => f.columnName)
        };
      });
    }
    
    state.dbSchemaUI = transformedUI;
    state.dbSchemaLoaded = true;
    state.lastUpdated = new Date();
  } catch (error) {
    console.error('[Store] 加载元数据失败:', error);
    state.dbSchemaError = error.message;
    state.dbSchemaUI = {}; // 失败时设为空对象
    state.dbSchemaLoaded = true;
  } finally {
    state.loading = false;
  }
};

export const getTableDetail = (tableName, database = 'lumina_business') => 
  apiFetch(`/metadata/tables/${tableName}?database=${database}`);

export const getAllTables = (database = 'lumina_business') =>
  apiFetch(`/metadata/tables?database=${database}`);

export const refreshMetadataCache = async (database = 'lumina_business') => {
  await apiFetch(`/metadata/cache/refresh?database=${database}`, { method: 'POST' });
  await loadDatabaseSchema(database);
};

export const fetchCacheStats = async () => {
  state.cacheStats = await apiFetch('/metadata/cache/stats');
  return state.cacheStats;
};

// 4. 业务 API (Business Actions)

export const fetchModules = async () => {
  try {
    state.loading = true;
    const modules = await apiFetch('/modules') || [];
    // 将 active: 1 转换为 active: true，确保 Vue Checkbox 正确显示
    state.modules = modules.map(m => ({
      ...m,
      active: !!m.active
    }));
  } catch (e) {
    console.error('Failed to fetch modules:', e);
  } finally {
    state.loading = false;
  }
};

export const fetchConfig = async (modId) => {
  if (state.configs[modId]) return;
  try {
    state.loading = true;
    state.configs[modId] = await apiFetch(`/modules/${modId}`) || { entities: [], mappings: [] };
  } catch (e) {
    console.error(`Failed to fetch config for ${modId}:`, e);
  } finally {
    state.loading = false;
  }
};

export const fetchDetailedPermissions = async (moduleId) => {
  try {
    const data = await apiFetch(`/permissions/module/${moduleId}`);
    if (data) {
      state.detailedPermissions = data.permissions || [];
      const nodes = (data.permissions || []).map(p => p.permission_node);
      state.activePermissions = new Set(nodes);
    }
  } catch (e) {
    console.error(`Failed to fetch detailed permissions for ${moduleId}:`, e);
  }
};

export const updatePermissions = async (moduleId, permissions) => {
  try {
    state.loading = true;
    const data = await apiFetch(`/permissions/module/${moduleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: Array.from(permissions) })
    });
    if (data) {
      state.activePermissions = new Set(data.permissions || permissions);
      return true;
    }
    return false;
  } catch (e) {
    console.error(`Failed to update permissions for ${moduleId}:`, e);
    return false;
  } finally {
    state.loading = false;
  }
};

// 5. UI 辅助动作 (UI Actions)

export const updateView = async (view, module = null) => {
  state.currentView = view;
  if (module) {
    state.activeModule = module;
    await fetchConfig(module.id);
  }
  if (view === 'permissions' && state.activeModule) {
    await fetchDetailedPermissions(state.activeModule.id);
  }
};

export const addModule = async (moduleData) => {
  try {
    state.loading = true;
    const data = await apiFetch('/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...moduleData,
        primaryEntity: { name: moduleData.entity, desc: moduleData.desc || '主表' },
        count: 0,
        active: true
      })
    });
    
    if (data) {
      // 关键修复：合并后端返回数据和前端输入数据，防止后端返回字段名不一致导致渲染失败
      const finalModule = {
        ...moduleData, // 优先保留前端输入的名称和描述
        ...data,       // 用后端返回的数据补充（如自动生成的 ID 或 状态）
        active: !!(data.active ?? true)
      };
      
      console.log('[Store] 模块创建成功:', finalModule);
      
      state.modules.unshift(finalModule);
      state.configs[finalModule.id] = {
        primaryEntity: finalModule.primaryEntity || { name: finalModule.entity, desc: finalModule.desc },
        entities: [],
        mappings: []
      };
      return true;
    }
  } catch (e) {
    console.error('Failed to add module:', e);
  } finally {
    state.loading = false;
  }
  return false;
};

export const deleteModule = async (moduleId) => {
  if (!confirm('确定要删除该模块吗？此操作不可逆。')) return false;
  try {
    state.loading = true;
    await apiFetch(`/modules/${moduleId}`, { method: 'DELETE' });
    state.modules = state.modules.filter(m => m.id !== moduleId);
    if (state.activeModule?.id === moduleId) {
      state.activeModule = null;
      state.currentView = 'list';
    }
    return true;
  } catch (e) {
    console.error('Failed to delete module:', e);
    return false;
  } finally {
    state.loading = false;
  }
};

export const addEntityToCurrentConfig = async (entity) => {
  const modId = state.activeModule?.id;
  if (!modId) return;
  try {
    state.loading = true;
    const payload = {
      ...entity,
      id: entity.id || `entity_${Date.now()}`,
      status: 'active',
      relationType: entity.cardinality || '1:1',
      joinCondition: { left: entity.left, right: entity.right }
    };

    const data = await apiFetch(`/modules/${modId}/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (data && currentConfig.value) {
      // 关键修复：合并后端返回的 ID 和前端的完整数据
      const finalEntity = {
        ...payload,
        ...data // 覆盖 ID 等后端生成的字段
      };
      console.log('[Store] 关联表添加成功:', finalEntity);
      currentConfig.value.entities.push(finalEntity);
    }
  } catch (e) {
    console.error('Failed to add entity:', e);
  } finally {
    state.loading = false;
  }
};

export const removeEntityFromCurrentConfig = async (entityId) => {
  const modId = state.activeModule?.id;
  if (!modId || !confirm('确定要移除此关联表吗？')) return;
  try {
    state.loading = true;
    await apiFetch(`/modules/${modId}/entities/${entityId}`, { method: 'DELETE' });
    const entities = currentConfig.value?.entities;
    if (entities) {
      const index = entities.findIndex(e => e.id === entityId);
      if (index !== -1) entities.splice(index, 1);
    }
  } catch (e) {
    console.error('Failed to remove entity:', e);
  } finally {
    state.loading = false;
  }
};

export const addMappingToCurrentConfig = async (mapping) => {
  const modId = state.activeModule?.id;
  if (!modId) return;
  try {
    state.loading = true;
    const data = await apiFetch(`/modules/${modId}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping)
    });
    if (data && currentConfig.value) {
      // 合并数据确保 UI 立即显示名称等信息
      const finalMapping = {
        ...mapping,
        ...data
      };
      console.log('[Store] 字段映射添加成功:', finalMapping);
      currentConfig.value.mappings.push(finalMapping);
    }
  } catch (e) {
    console.error('Failed to add mapping:', e);
  } finally {
    state.loading = false;
  }
};

export const deleteMappingFromCurrentConfig = async (logicalField) => {
  const modId = state.activeModule?.id;
  if (!modId || !confirm('确定要删除此字段配置吗？')) return;
  try {
    state.loading = true;
    await apiFetch(`/modules/${modId}/fields/${logicalField}`, { method: 'DELETE' });
    if (currentConfig.value?.mappings) {
      const index = currentConfig.value.mappings.findIndex(m => m.logicalField === logicalField);
      if (index !== -1) currentConfig.value.mappings.splice(index, 1);
    }
  } catch (e) {
    console.error('Failed to delete mapping:', e);
  } finally {
    state.loading = false;
  }
};

// 6. 初始化与计算属性

export const currentConfig = computed(() => {
  const modId = state.activeModule?.id;
  if (!modId) return { primaryEntity: { name: 'loading', desc: '请选择模块' }, entities: [], mappings: [] };
  return state.configs[modId] || { primaryEntity: { name: 'loading', desc: '加载中...' }, entities: [], mappings: [] };
});

export const initStore = async () => {
  console.log('[Store] 集中化 API 初始化...');
  try {
    await Promise.all([
      fetchModules(),
      loadDatabaseSchema('lumina_business')
    ]);
  } catch (error) {
    console.error('[Store] 初始化失败:', error);
  }
};

// 启动
initStore();

export default {
  state,
  currentConfig,
  mockDbSchema,
  loadDatabaseSchema,
  getTableDetail,
  getAllTables,
  refreshMetadataCache,
  fetchCacheStats,
  fetchModules,
  fetchConfig,
  updateView,
  addModule,
  addEntityToCurrentConfig,
  removeEntityFromCurrentConfig,
  addMappingToCurrentConfig,
  deleteMappingFromCurrentConfig,
  fetchDetailedPermissions,
  updatePermissions,
  initStore
};
