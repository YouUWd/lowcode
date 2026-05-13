<template>
  <div class="p-8 space-y-12 w-full animate-in fade-in duration-500">
    <!-- Header Action Section -->
    <div class="flex justify-between items-center mb-6 mt-[-1rem]">
      <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
        <Shield class="mr-2 text-primary w-5 h-5" />
        物理层级权限拦截规则 (CLS Rules)
      </h2>

      <div class="flex space-x-3">
        <button @click="updateView('config', state.activeModule)" class="px-4 py-2 border border-primary text-primary text-sm font-medium rounded-xl hover:bg-primary/5 transition-colors flex items-center">
          <Settings class="w-4 h-4 mr-2" />
          模块配置
        </button>
        <div class="w-px h-6 bg-outline-variant/40 mx-1 my-auto"></div>
        <button @click="toggleAll(true)" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
          <CheckCheck class="w-4 h-4 mr-2" />
          全选所有
        </button>
        <button @click="toggleAll(false)" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
          <Eraser class="w-4 h-4 mr-2" />
          重置权限
        </button>
        <button @click="saveAndGoBack" class="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center">
          <Check class="w-4 h-4 mr-2" />
          保存配置
        </button>
      </div>
    </div>

    <!-- Section 1: Data Source Info -->
    <section>
      <PermissionMatrix 
        :fields="derivedFields" 
        :active-permissions="state.activePermissions"
        @toggle="togglePermission"
      />
    </section>

    <!-- Info Section -->
    <div class="p-6 bg-primary-container/30 rounded-2xl border border-primary/10 flex items-start space-x-4">
      <div class="p-3 bg-white rounded-xl shadow-sm text-primary">
        <Info class="w-5 h-5" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-on-primary-container">关于物理权限拦截模拟</h4>
        <p class="text-xs text-on-primary-container/80 mt-1 leading-relaxed">
          此处定义的节点将作为 <b>ColumnLevelSecurityInterceptor</b> 的决策依据。系统在执行查询时，会遍历 AST 并对比当前节点的激活状态，自动剔除无权限的字段。
          当前共有 <span class="font-bold underline">{{ activePermissionCount }}</span> 个模拟节点生效。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Shield, Settings, CheckCheck, Eraser, Check, Info } from 'lucide-vue-next';
import { state, updateView, updatePermissions } from '../store/mockStore';
import PermissionMatrix from './PermissionMatrix.vue';

const goBack = () => {
  updateView('list');
};

const saveAndGoBack = async () => {
  if (!state.activeModule) return;
  const success = await updatePermissions(state.activeModule.id, state.activePermissions);
  if (success) {
    updateView('list');
  } else {
    alert('保存权限配置失败，请检查后端连接');
  }
};

const derivedFields = computed(() => {
  const fieldsMap = new Map();
  const modId = state.activeModule?.id;
  if (!modId) return [];

  // 1. 首先从本地配置映射中提取所有已定义的物理字段 (确保新增列立即可见)
  const config = state.configs[modId];
  if (config && config.mappings) {
    config.mappings.forEach(m => {
      m.physicalFields?.forEach(pf => {
        const key = `${pf.entity}.${pf.field}`;
        if (!fieldsMap.has(key)) {
          fieldsMap.set(key, { 
            entity: pf.entity, 
            field: pf.field, 
            id: key,
            logicalField: m.logicalField // 关联逻辑字段名
          });
        }
      });
    });
  }

  // 2. 然后用后端返回的详细权限节点信息进行补充/修正 (如逻辑字段名同步)
  if (state.detailedPermissions && state.detailedPermissions.length > 0) {
    state.detailedPermissions.forEach(p => {
      const key = `${p.entity}.${p.field_name}`;
      if (fieldsMap.has(key)) {
        // 如果已存在，更新逻辑字段名（以权限定义为准）
        const existing = fieldsMap.get(key);
        existing.logicalField = p.logical_field || existing.logicalField;
      } else {
        // 如果是权限系统中存在但配置中没有的（可能是历史遗留），也加上
        fieldsMap.set(key, { 
          entity: p.entity, 
          field: p.field_name, 
          id: key,
          logicalField: p.logical_field 
        });
      }
    });
  }

  return Array.from(fieldsMap.values());
});

const togglePermission = (node) => {
  if (state.activePermissions.has(node)) {
    state.activePermissions.delete(node);
  } else {
    state.activePermissions.add(node);
  }
};

const toggleAll = (active) => {
  derivedFields.value.forEach(f => {
    ['READ', 'CREATE', 'UPDATE'].forEach(type => {
      const node = `${f.entity}.${f.field}.${type}`;
      if (active) state.activePermissions.add(node);
      else state.activePermissions.delete(node);
    });
  });
};

const activePermissionCount = computed(() => {
  if (!state.activeModule) return 0;
  let count = 0;
  derivedFields.value.forEach(f => {
    ['READ', 'CREATE', 'UPDATE'].forEach(type => {
      if (state.activePermissions.has(`${f.entity}.${f.field}.${type}`)) count++;
    });
  });
  return count;
});
</script>
