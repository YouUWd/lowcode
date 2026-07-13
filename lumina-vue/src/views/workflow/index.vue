<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-white">
    <!-- Instance List View -->
    <div class="p-8 flex-1 overflow-y-auto w-full animate-in fade-in duration-500 text-on-surface">
      <div class="bg-white rounded-xl shadow-[0px_4px_24px_rgba(25,28,29,0.04)] overflow-hidden border border-slate-200">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-xs font-extrabold text-slate-600 uppercase tracking-widest border-b border-slate-200">
              <th class="px-6 py-4 w-[25%] border-r border-slate-200">
                <div class="flex items-center gap-2">
                  <Hash class="w-4 h-4 text-slate-400" />
                  业务单号
                </div>
              </th>
              <th class="px-6 py-4 border-r border-slate-200">
                <div class="flex items-center gap-2">
                  <Database class="w-4 h-4 text-slate-400" />
                  目标表
                </div>
              </th>
              <th class="px-6 py-4 w-[20%] border-r border-slate-200">
                <div class="flex items-center gap-2">
                  <Activity class="w-4 h-4 text-slate-400" />
                  宏观状态
                </div>
              </th>
              <th class="px-6 py-4 text-center w-[160px] min-w-[160px]">
                <div class="flex items-center justify-center gap-1.5">
                  <span>操作</span>
                  <div class="w-px h-3 bg-slate-300 mx-1"></div>
                  <button @click="mockSubmitNew" 
                          class="px-2 py-0.5 text-primary hover:bg-primary/10 rounded transition-all active:scale-95 cursor-pointer bg-white border border-primary/20 hover:border-primary/40 shadow-sm" 
                          title="发起新申请">
                    发起
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-for="biz in list" :key="biz.businessNo" class="hover:bg-slate-50/50 transition-colors border-b border-slate-200 last:border-b-0">
              <td class="px-6 py-4 border-r border-slate-200">{{ biz.businessNo }}</td>
              <td class="px-6 py-4 border-r border-slate-200">{{ biz.targetEntity }}</td>
              <td class="px-6 py-4 border-r border-slate-200">
                <span v-if="biz.macroStatus === 1" class="px-2.5 py-1 text-xs font-medium rounded bg-blue-50 text-blue-600">审批中</span>
                <span v-else-if="biz.macroStatus === 99" class="px-2.5 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-600">已生效</span>
                <span v-else class="px-2.5 py-1 text-xs font-medium rounded bg-rose-50 text-rose-600">已作废</span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-3 text-sm font-medium">
                  <button @click="goToDetail(biz.businessNo)" class="text-primary hover:text-primary/80 transition-colors cursor-pointer">
                    办理
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="4" class="p-10 text-center text-on-surface-variant opacity-50 italic">暂无流程实例，请点击右上角发起</td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="px-5 py-4 bg-white flex items-center justify-between border-t border-slate-200 rounded-b-xl">
          <div class="text-sm text-slate-500">
            共 {{ list.length }} 条记录
          </div>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-1.5">
              <button class="w-8 h-8 flex items-center justify-center rounded border border-slate-300 text-slate-400 hover:text-primary hover:border-primary transition-colors disabled:opacity-50" disabled>
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary/5 text-primary font-medium text-sm transition-colors">1</button>
              <button class="w-8 h-8 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:text-primary hover:border-primary transition-colors text-sm">2</button>
              <button class="w-8 h-8 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:text-primary hover:border-primary transition-colors text-sm">3</button>
              <button class="w-8 h-8 flex items-center justify-center rounded border border-slate-300 text-slate-400 hover:text-primary hover:border-primary transition-colors disabled:opacity-50">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchWorkflowInstances } from '../../store/workflow';
import { workflowApi } from '../../api/workflow';
import { appState } from '../../store/app';
import { Workflow, Plus, ClipboardCheck, Hash, Database, Activity, Settings2, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const router = useRouter();
const list = ref([]);

const fetchList = async () => {
  const data = await fetchWorkflowInstances();
  list.value = data || [];
};

watch(() => appState.refreshTrigger, () => {
  fetchList();
});

watch(() => appState.currentView, (newVal) => {
  if (newVal === 'workflow-list') {
    fetchList();
  }
});

const mockSubmitNew = async () => {
  const currentUserRole = appState.simulationMode === 'role' ? appState.currentUserRole : 'admin';
  const currentUser = appState.simulationMode === 'user' ? appState.currentUser : 'admin_sys';
  const submitterId = appState.simulationMode === 'user' ? currentUser : currentUserRole;

  try {
    await workflowApi.startProcess({ 
      moduleId: 'MOD-SCORE-DETAIL', 
      targetEntity: 'score', 
      targetRecordId: '1', 
      actionType: 'UPDATE', 
      reason: '手工录入错误', 
      payload: { score: 99 }, 
      submitterId
    });
    fetchList();
  } catch (e) { 
    alert(e.message); 
  }
};

const goToDetail = (bizNo) => {
  router.push(`/workflow/detail?bizNo=${bizNo}`);
};

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
</style>
