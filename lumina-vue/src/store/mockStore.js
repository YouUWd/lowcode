import { reactive, computed } from 'vue';

const API_BASE = 'http://localhost:3001/api';

// 1. 全局状态存储 (Global State)
export const state = reactive({
  currentView: 'list',
  activeModule: null,
  loading: false,
  
  // 核心模块列表 (初始化为空，由 fetchModules 填充)
  modules: [],
  
  // 模块对应的具体配置数据 (按模块 ID 缓存)
  configs: {},
  
  // 模拟权限节点 (存储当前激活的权限节点)
  activePermissions: new Set(),

  // 详细权限节点信息
  detailedPermissions: []
});

// 2. 模拟底层数据库模型 (保留用于 UI 字段选择参考)
export const mockDbSchema = {
  // 核心
  'hr_employee_base': { desc: '员工主表', fields: ['id', 'emp_no', 'first_name', 'last_name', 'full_name', 'dept_id', 'status', 'created_at'] },
  'hr_organization': { desc: '组织主表', fields: ['id', 'org_code', 'org_name', 'org_type', 'headcount', 'max_headcount', 'effective_date', 'ancestor_code'] },
  'sys_user': { desc: '系统账户表', fields: ['id', 'username', 'real_name', 'emp_no', 'dept_id', 'status'] },
  'sys_operation_log': { desc: '系统操作日志表', fields: ['id', 'operator_name', 'action_type', 'ip_address', 'created_at'] },

  // 组织与岗位
  'hr_org_hierarchy': { desc: '组织树状层级关系', fields: ['id', 'org_code', 'ancestor_code', 'depth'] },
  'hr_position': { desc: '标准岗位编制池', fields: ['id', 'org_id', 'position_code', 'position_name'] },
  'hr_cost_center': { desc: '财务成本中心关联', fields: ['id', 'cost_center_code', 'cost_center_name'] },

  // 员工扩展
  'hr_emp_job': { desc: '员工任职表', fields: ['id', 'emp_id', 'dept_id', 'job_title', 'emp_type'] },
  'hr_emp_personal': { desc: '员工隐私表', fields: ['id', 'emp_id', 'id_card_no', 'bank_account'] },
  'hr_emp_contract': { desc: '员工合同表', fields: ['id', 'emp_id', 'contract_type', 'end_date'] },
  'hr_emp_education': { desc: '教育经历与学历证书', fields: ['id', 'emp_id', 'degree', 'university'] },

  // 薪酬
  'hr_payroll_result': { desc: '核算结果表', fields: ['id', 'emp_id', 'payroll_year', 'payroll_month', 'gross_amount', 'net_amount', 'payment_status'] },
  'hr_salary_structure': { desc: '薪资结构表', fields: ['id', 'structure_code', 'base_salary', 'allowance'] },
  'hr_payroll_element': { desc: '单项薪资条目', fields: ['id', 'result_id', 'element_code', 'element_amount'] },
  'hr_social_security_record': { desc: '五险一金扣缴明细', fields: ['id', 'result_id', 'total_personal_deduct', 'total_company_deduct'] },
  'hr_tax_record': { desc: '个税明细', fields: ['id', 'result_id', 'tax_amount', 'taxable_income'] },

  // 绩效
  'hr_perf_appraisal': { desc: '考核主表', fields: ['id', 'emp_id', 'plan_id', 'self_eval_score', 'manager_eval_score', 'final_grade', 'workflow_status'] },
  'hr_perf_plan': { desc: '考核计划', fields: ['id', 'plan_name', 'start_date', 'end_date'] },
  'hr_perf_kpi': { desc: '考核指标项明细', fields: ['id', 'appraisal_id', 'kpi_name', 'weight'] },
  'hr_perf_eval_flow': { desc: '审批流转节点', fields: ['id', 'appraisal_id', 'node_name', 'evaluator_id'] },

  // 招聘
  'hr_job_requisition': { desc: '需求申请表', fields: ['id', 'req_code', 'job_title', 'city', 'district', 'priority_level', 'req_status', 'headcount_required'] },
  'hr_candidate_application': { desc: '候选人申请', fields: ['id', 'req_id', 'candidate_name', 'resume_url'] },
  'hr_interview_schedule': { desc: '面试安排', fields: ['id', 'req_id', 'interview_time', 'interviewer_id'] },
  'hr_offer_approval': { desc: 'Offer审批', fields: ['id', 'req_id', 'offer_status', 'salary_offer'] },

  // 通用备用表
  'hr_custom_entity_1': { desc: '自定义扩展表1', fields: ['id', 'ref_id', 'custom_field_1', 'custom_field_2'] }
};

// 3. 计算属性 (Getters)
export const currentConfig = computed(() => {
  const modId = state.activeModule?.id;
  if (!modId) return { primaryEntity: { name: 'loading', desc: '请选择模块' }, entities: [], mappings: [] };
  return state.configs[modId] || { primaryEntity: { name: 'loading', desc: '加载中...' }, entities: [], mappings: [] };
});

// 4. 异步动作 (Async Actions)
export const fetchModules = async () => {
  try {
    state.loading = true;
    const res = await fetch(`${API_BASE}/modules`);
    state.modules = await res.json();
  } catch (e) {
    console.error('Failed to fetch modules:', e);
  } finally {
    state.loading = false;
  }
};

export const fetchConfig = async (modId) => {
  if (state.configs[modId]) return; // 简易缓存
  try {
    state.loading = true;
    const res = await fetch(`${API_BASE}/modules/${modId}`);
    state.configs[modId] = await res.json();
  } catch (e) {
    console.error(`Failed to fetch config for ${modId}:`, e);
  } finally {
    state.loading = false;
  }
};

// 5. 视图操作动作 (View Actions)
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

export const addModule = (moduleData) => {
  state.modules.unshift({ ...moduleData, count: 0, active: true });
  state.configs[moduleData.id] = {
    primaryEntity: { name: moduleData.entity, desc: moduleData.desc },
    entities: [],
    mappings: []
  };
};

export const addEntityToCurrentConfig = (entity) => {
  if (currentConfig.value) {
    currentConfig.value.entities.push(entity);
  }
};

export const removeEntityFromCurrentConfig = (entityId) => {
  const entities = currentConfig.value?.entities;
  if (entities) {
    const index = entities.findIndex(e => e.id === entityId);
    if (index !== -1) entities.splice(index, 1);
  }
};

export const addMappingToCurrentConfig = (mapping) => {
  currentConfig.value?.mappings.push(mapping);
};


export const fetchDetailedPermissions = async (moduleId) => {
  try {
    const res = await fetch(`${API_BASE}/permissions/module/${moduleId}`);
    const data = await res.json();
    if (data.success) {
      // 存储原始对象数组，用于渲染表格行
      state.detailedPermissions = data.permissions;
      
      // 提取节点字符串到 Set，用于 UI 开关状态判断
      const nodes = data.permissions.map(p => p.permission_node);
      state.activePermissions = new Set(nodes);
    }
  } catch (e) {
    console.error(`Failed to fetch detailed permissions for ${moduleId}:`, e);
  }
};

export const updatePermissions = async (moduleId, permissions) => {
  try {
    state.loading = true;
    const res = await fetch(`${API_BASE}/permissions/module/${moduleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: Array.from(permissions) })
    });
    const data = await res.json();
    if (data.success) {
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

export const deleteMappingFromCurrentConfig = (index) => {
  currentConfig.value?.mappings.splice(index, 1);
};

// 立即执行初始化数据获取
fetchModules();
