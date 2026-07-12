<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-white">
    <!-- Instance List View -->
    <div class="p-8 flex-1 overflow-y-auto w-full animate-in fade-in duration-500 text-on-surface">
      <!-- Header Action Section (标题与按钮对齐) -->
      <div class="flex justify-between items-center mb-6 mt-[-1rem]">
        <h2 class="font-headline text-lg font-bold flex items-center text-on-surface">
          <Workflow class="mr-2 text-primary w-5 h-5" />
          工作流测试面板 (Workflow V2)
        </h2>
        <div class="flex items-center space-x-3">
          <button @click="mockSubmitNew" class="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center cursor-pointer">
            <Plus class="w-4 h-4 mr-2" /> 发起新申请
          </button>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] overflow-hidden border border-outline-variant/10">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low/50 text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/15">
              <th class="p-5">业务单号</th>
              <th class="p-5">目标实体</th>
              <th class="p-5">宏观状态</th>
              <th class="p-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-surface-container-low">
            <tr v-for="biz in list" :key="biz.businessNo" class="hover:bg-surface-container-low/30 transition-colors">
              <td class="p-5 font-mono text-sm font-bold text-on-surface">{{ biz.businessNo }}</td>
              <td class="p-5 text-on-surface-variant">{{ biz.targetEntity }}</td>
              <td class="p-5">
                <span v-if="biz.macroStatus === 1" class="text-primary bg-primary-container/20 px-2.5 py-1 rounded-full font-bold text-xs">1 审批中</span>
                <span v-else-if="biz.macroStatus === 99" class="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-xs">99 已生效</span>
                <span v-else class="text-error bg-error-container/20 px-2.5 py-1 rounded-full font-bold text-xs">-99 已作废</span>
              </td>
              <td class="p-5 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="goToDetail(biz.businessNo)" class="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer animate-none" title="详情/处理">
                    <ClipboardCheck class="w-5 h-5" />
                  </button>
                  <button @click="goToDesigner(biz.businessNo)" class="p-2 hover:bg-amber-500/10 hover:text-amber-600 rounded-lg transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer animate-none" title="修改流程结构">
                    <PenTool class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="4" class="p-10 text-center text-on-surface-variant opacity-50 italic">暂无流程实例，请点击右上角发起</td>
            </tr>
          </tbody>
        </table>
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
import { Workflow, Plus, ClipboardCheck, PenTool } from 'lucide-vue-next';

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

const goToDetail = (no) => {
  router.push(`/workflow/${no}/detail`);
};

const goToDesigner = (no) => {
  router.push(`/workflow/designer?bizNo=${no}`);
};

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
</style>
