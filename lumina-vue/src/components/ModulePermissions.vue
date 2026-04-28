<template>
  <div class="p-8 space-y-12 w-full animate-in fade-in duration-500">
    <!-- Header Action Section (对齐 ModuleConfig 风格：左标题，右按钮) -->
    <div class="flex justify-between items-center mb-6 mt-[-1rem]">
      <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
        <span class="material-symbols-outlined mr-2 text-primary">security</span>
        物理层级权限拦截规则 (CLS Rules)
      </h2>

      <div class="flex space-x-3">
        <button @click="updateView('config', state.activeModule)" class="px-4 py-2 border border-primary text-primary text-sm font-medium rounded-xl hover:bg-primary/5 transition-colors flex items-center">
          <span class="material-symbols-outlined text-[18px] mr-2">settings_input_component</span>
          模块配置
        </button>
        <div class="w-px h-6 bg-outline-variant/40 mx-1 my-auto"></div>
        <button @click="toggleAll(true)" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
          <span class="material-symbols-outlined text-[18px] mr-2">done_all</span>
          全选所有
        </button>
        <button @click="toggleAll(false)" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
          <span class="material-symbols-outlined text-[18px] mr-2">layers_clear</span>
          重置权限
        </button>
        <button @click="saveAndGoBack" class="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center">
          <span class="material-symbols-outlined text-[18px] mr-2">check</span>
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

    <!-- Info Section (复刻 Footer 提示风格) -->
    <div class="p-6 bg-primary-container/30 rounded-2xl border border-primary/10 flex items-start space-x-4">
      <div class="p-3 bg-white rounded-xl shadow-sm text-primary">
        <span class="material-symbols-outlined">info</span>
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
  // 优先从后端获取的详细权限节点中推导字段列表
  if (state.detailedPermissions && state.detailedPermissions.length > 0) {
    const fieldsMap = new Map();
    state.detailedPermissions.forEach(p => {
      const key = `${p.entity}.${p.field_name}`;
      if (!fieldsMap.has(key)) {
        fieldsMap.set(key, { 
          entity: p.entity, 
          name: p.field_name, 
          id: key,
          logicalField: p.logical_field 
        });
      }
    });
    return Array.from(fieldsMap.values());
  }

  // 兜底方案：从本地配置映射中推导
  const modId = state.activeModule?.id;
  if (!modId) return [];
  const config = state.configs[modId];
  
  const fieldsMap = new Map();
  if (config) {
    config.mappings?.forEach(m => {
      m.physicalFields?.forEach(pf => {
        const key = `${pf.entity}.${pf.name}`;
        if (!fieldsMap.has(key)) {
          fieldsMap.set(key, { entity: pf.entity, name: pf.name, id: key });
        }
      });
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
      const node = `${f.entity}.${f.name}.${type}`;
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
      if (state.activePermissions.has(`${f.entity}.${f.name}.${type}`)) count++;
    });
  });
  return count;
});
</script>
