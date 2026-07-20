<template>
  <div class="p-8 space-y-6 w-full">



    <!-- Main Data Table -->
    <div class="bg-surface rounded-2xl shadow-[0px_4px_24px_rgba(25,28,29,0.04)] border border-outline-variant/30 overflow-hidden">
      <!-- Compact Toolbar Row (Aligned with /data) -->
      <div class="flex items-center justify-between px-6 py-3.5 border-b border-outline-variant/30 bg-surface">
        <div class="text-sm font-bold text-on-surface">系统模块架构</div>
        <button 
          @click="router.push('/modules/create/config?mode=create')" 
          class="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          新建
        </button>
      </div>

      <div class="overflow-x-auto overflow-y-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/35">
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
              <th class="px-6 py-4 text-center w-[150px] min-w-[150px] whitespace-nowrap">
                操作
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
              <td class="px-6 py-4 text-center whitespace-nowrap">
                <div class="flex justify-center items-center gap-3 text-xs font-medium whitespace-nowrap">
                  <button @click.stop="goToConfig(mod, 'view')" class="text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap" title="查看配置">
                    <Eye class="w-3.5 h-3.5" />
                    查看
                  </button>
                  <div class="w-px h-3 bg-outline-variant/50"></div>
                  <button @click.stop="goToConfig(mod, 'edit')" class="text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap" title="编辑">
                    <Edit class="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <div class="w-px h-3 bg-outline-variant/50"></div>
                  <button @click.stop="deleteModule(mod.id)" class="text-error hover:text-error/80 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap" title="删除模块">
                    <Trash2 class="w-3.5 h-3.5" />
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
  Plus,
  X,
  Check,
  Hash,
  Database,
  Activity,
  Network,
  Eye,
  Edit,
  Trash2,
  PackagePlus
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
