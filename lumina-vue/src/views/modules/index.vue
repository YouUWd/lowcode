<template>
  <div class="p-8 space-y-6 w-full">

    <!-- Collapsible Add Module Panel -->
    <Transition name="panel-slide">
      <div v-if="isAddPanelOpen" class="bg-surface rounded-2xl shadow-[0px_4px_24px_rgba(25,28,29,0.03)] border border-outline-variant/30 overflow-hidden">
        <div class="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
            <PackagePlus class="text-primary w-4 h-4" />
            新建系统模块
          </h3>
          <button @click="isAddPanelOpen = false" class="p-1.5 hover:bg-surface-container rounded-md text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-6 space-y-5">
          <div class="grid grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-on-surface-variant">模块名称 <span class="text-error">*</span></label>
              <input v-model="newModule.name" type="text" class="w-full px-3 py-1.5 bg-surface border border-outline-variant/30 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：员工档案管理" />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-semibold text-on-surface-variant">模块标识 (ID) <span class="text-error">*</span></label>
              <input v-model="newModule.id" type="text" class="w-full px-3 py-1.5 bg-surface border border-outline-variant/30 rounded-md text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：MOD-HR-EMP" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-on-surface-variant">绑定的主表 <span class="text-error">*</span></label>
            <div class="relative">
              <TableChart class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <select v-model="newModule.entity" class="w-full pl-10 pr-3 py-1.5 bg-surface border border-outline-variant/30 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow appearance-none">
                <option disabled value="">请选择物理表</option>
                <option v-for="table in availableTables" :key="table.name" :value="table.name">
                  {{ table.name }} ({{ table.desc }})
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-on-surface-variant">模块描述</label>
            <textarea v-model="newModule.desc" rows="2" class="w-full px-3 py-1.5 bg-surface border border-outline-variant/30 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow resize-none" placeholder="简要描述该模块的业务边界和职责..."></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2 border-t border-outline-variant/30">
            <button @click="isAddPanelOpen = false" class="px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-md transition-colors cursor-pointer">
              取消
            </button>
            <button @click="submitModule" class="px-5 py-1.5 text-xs font-semibold bg-primary text-on-primary hover:bg-primary/95 shadow-sm rounded-md transition-colors flex items-center gap-2 cursor-pointer">
              <Check class="w-4 h-4" />
              确认创建
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main Data Table -->
    <div class="bg-surface rounded-2xl shadow-[0px_4px_24px_rgba(25,28,29,0.04)] border border-outline-variant/30">
      <div class="overflow-x-auto overflow-y-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-lowest text-xs font-extrabold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30">
              <th class="px-6 py-4 border-r border-outline-variant/30">
                <div class="flex items-center gap-2">
                  <Hash class="w-4 h-4 text-on-surface-variant" />
                  模块 ID
                </div>
              </th>
              <th class="px-6 py-4 border-r border-outline-variant/30">
                <div class="flex items-center gap-2">
                  <PackagePlus class="w-4 h-4 text-on-surface-variant" />
                  模块名称
                </div>
              </th>
              <th class="px-6 py-4 border-r border-outline-variant/30">
                <div class="flex items-center gap-2">
                  <Database class="w-4 h-4 text-on-surface-variant" />
                  主表 (Primary)
                </div>
              </th>
              <th class="px-6 py-4 border-r border-outline-variant/30">
                <div class="flex items-center justify-center gap-2">
                  <Network class="w-4 h-4 text-on-surface-variant" />
                  关联表数
                </div>
              </th>
              <th class="px-6 py-4 border-r border-outline-variant/30">
                <div class="flex items-center gap-2">
                  <Activity class="w-4 h-4 text-on-surface-variant" />
                  状态
                </div>
              </th>
              <th class="px-6 py-4 text-center w-[160px] min-w-[160px]">
                <div class="flex items-center justify-center gap-1.5">
                  <span>操作</span>
                  <div class="w-px h-3 bg-outline-variant/30 mx-1"></div>
                  <button @click="isAddPanelOpen = true" 
                          class="px-2 py-0.5 font-bold text-primary hover:bg-primary/10 rounded transition-all active:scale-95 cursor-pointer bg-surface border border-primary/20 hover:border-primary/40 shadow-sm" 
                          title="新建模块">
                    新建
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-for="mod in modulesState.list" :key="mod.id" class="border-b border-outline-variant/30 last:border-b-0 hover:bg-surface-container-lowest transition-colors group">
              <td class="px-6 py-4 border-r border-outline-variant/30">{{ mod.id }}</td>
              <td class="px-6 py-4 border-r border-outline-variant/30">{{ mod.name }}</td>
              <td class="px-6 py-4 border-r border-outline-variant/30">{{ mod.entity }}</td>
              <td class="px-6 py-4 text-center border-r border-outline-variant/30">{{ mod.count }}</td>
              <td class="px-6 py-4 border-r border-outline-variant/30">
                <button @click.stop="mod.active = !mod.active" class="px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors" :class="mod.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
                  {{ mod.active ? '已启用' : '已停用' }}
                </button>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-3 text-sm font-medium">
                  <button @click.stop="goToConfig(mod, 'view')" class="text-primary hover:text-primary/80 transition-colors" title="查看配置">
                    查看
                  </button>
                  <button @click.stop="goToConfig(mod, 'edit')" class="text-primary hover:text-primary/80 transition-colors" title="编辑">
                    编辑
                  </button>
                  <button @click.stop="deleteModule(mod.id)" class="text-error hover:text-error/80 transition-colors" title="删除模块">
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="px-5 py-4 bg-surface flex items-center justify-between border-t border-outline-variant/30 rounded-b-2xl">
        <div class="text-sm text-on-surface-variant">
          共 {{ modulesState.list.length }} 条记录
        </div>
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-1.5">
            <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-50" disabled>
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button class="w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary/5 text-primary font-medium text-sm transition-colors">1</button>
            <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-colors text-sm">2</button>
            <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-colors text-sm">3</button>
            <button class="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-50">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  TableProperties as TableChart,
  PackagePlus,
  X,
  Check,
  Hash,
  Database,
  Activity,
  Network
} from 'lucide-vue-next';
import { appState } from '../../store/app';
import { modulesState, fetchModules, addModule, deleteModule } from '../../store/modules';
import { tableMap } from '../../store/metadata';

import { useRouter } from 'vue-router';

const router = useRouter();

const goToConfig = (mod, mode = 'view') => {
  router.push(`/modules/${mod.id}/config?mode=${mode}`);
};

const availableTables = computed(() => {
  return Object.keys(tableMap.value).map(key => ({
    name: key,
    desc: tableMap.value[key].desc
  }));
});

const isAddPanelOpen = ref(false);

const newModule = ref({
  id: '',
  name: '',
  entity: '',
  desc: ''
});

const submitModule = async () => {
  if (!newModule.value.name || !newModule.value.id || !newModule.value.entity) return;
  
  const success = await addModule({
    id: newModule.value.id,
    name: newModule.value.name,
    desc: newModule.value.desc,
    entity: newModule.value.entity
  });
  
  if (success) {
    isAddPanelOpen.value = false;
    newModule.value = { id: '', name: '', entity: '', desc: '' };
  }
};
</script>

<style>
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.panel-slide-enter-to,
.panel-slide-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
