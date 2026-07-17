<template>
  <div class="p-8 space-y-6 w-full">



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
                  <button @click="router.push('/modules/create/config?mode=create')" 
                          class="px-2.5 py-1 bg-primary text-on-primary text-xs font-semibold rounded shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1 cursor-pointer" 
                          title="新建模块">
                    <PackagePlus class="w-3.5 h-3.5" />
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
                  <button @click.stop="goToConfig(mod, 'view')" class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all cursor-pointer" title="查看配置">
                    查看
                  </button>
                  <button @click.stop="goToConfig(mod, 'edit')" class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all cursor-pointer" title="编辑">
                    编辑
                  </button>
                  <button @click.stop="deleteModule(mod.id)" class="px-2.5 py-1 border border-error/30 text-error hover:bg-error/10 text-xs font-semibold rounded transition-all cursor-pointer" title="删除模块">
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
import { ref, computed, onMounted } from 'vue';
import {
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

onMounted(() => {
  fetchModules();
});

const goToConfig = (mod, mode = 'view') => {
  router.push(`/modules/${mod.id}/config?mode=${mode}`);
};

const availableTables = computed(() => {
  return Object.keys(tableMap.value).map(key => ({
    name: key,
    desc: tableMap.value[key].desc
  }));
});
</script>
