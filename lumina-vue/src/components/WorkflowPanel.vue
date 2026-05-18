<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-white">
    <!-- View Switcher Tabs -->
    <div class="px-8 pt-8 shrink-0">
      <div class="flex p-1 bg-surface-container-high rounded-xl w-72 border border-outline-variant/20 shadow-inner mb-4">
        <button @click="viewMode = 'list'" 
                class="flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                :class="viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/50'">
          <span class="material-symbols-outlined text-[16px]">list_alt</span> 流程实例
        </button>
        <button @click="viewMode = 'designer'" 
                class="flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                :class="viewMode === 'designer' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/50'">
          <span class="material-symbols-outlined text-[16px]">architecture</span> 流程设计器
        </button>
      </div>
    </div>

    <!-- Instance List View -->
    <div v-if="viewMode === 'list'" class="p-8 pt-2 flex-1 overflow-y-auto w-full animate-in fade-in duration-500 text-on-surface">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h2 class="font-headline text-lg font-bold flex items-center text-on-surface">
            <span class="material-symbols-outlined mr-2 text-primary">account_tree</span>
            工作流测试面板 (Workflow V2)
          </h2>
          <p class="text-xs text-on-surface-variant mt-1 text-on-surface-variant">演示彻底解耦的 Fork-Join 架构与靶向回退</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm font-medium">
            <span class="text-on-surface-variant">模拟身份:</span>
            <select v-model="currentUserRole" @change="fetchList" class="bg-primary/5 border border-primary/20 text-primary font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="admin">系统管理员</option>
              <option value="head_teacher">任课老师</option>
              <option value="academic_admin">教务处</option>
              <option value="finance">财务处</option>
              <option value="principal">校长</option>
            </select>
          </div>
          <button @click="mockSubmitNew" class="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 transition-all flex items-center">
            <span class="material-symbols-outlined text-[18px] mr-2">add</span> 发起新申请
          </button>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] overflow-hidden">
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
                <button @click="openModal(biz.businessNo)" class="px-4 py-1.5 rounded-lg text-xs font-bold bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant/50 transition flex items-center ml-auto">
                  <span class="material-symbols-outlined text-[14px] mr-1">edit_document</span> 详情/处理
                </button>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="4" class="p-10 text-center text-on-surface-variant opacity-50 italic">暂无流程实例，请点击右上角发起</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Designer View -->
    <div v-else class="flex-1 p-8 pt-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white mx-8 mb-8 rounded-2xl border border-outline-variant/10 shadow-sm">
      <LightweightWorkflowBuilder />
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-[#191c1d]/60 backdrop-blur-sm" @click="closeModal"></div>
          <div class="bg-surface-container-lowest w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col relative z-10 h-full max-h-[90vh] overflow-hidden border border-outline-variant/20">
            
            <div class="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center bg-surface shrink-0">
              <div>
                <h3 class="font-headline font-bold text-lg text-on-surface flex items-center">
                   <span class="material-symbols-outlined mr-2 text-primary">fact_check</span>
                   审批处理台
                   <span class="ml-4 text-xs font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant tracking-tighter">{{ currentBizNo }}</span>
                </h3>
              </div>
              <button @click="closeModal" class="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant/50 transition-colors">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <!-- Vue Flow Monitor Area -->
            <div class="h-[200px] border-b border-outline-variant/15 bg-white relative shrink-0">
              <VueFlow
                v-if="elements.length"
                v-model="elements"
                :node-types="nodeTypes"
                :default-edge-options="{ type: 'smoothstep', borderRadius: 12 }"
                :fit-view-on-init="true"
                :nodes-draggable="false"
                :pan-on-drag="false"
                :zoom-on-scroll="false"
                :zoom-on-pinch="false"
                :zoom-on-double-click="false"
                :prevent-scrolling="false"
                class="workflow-monitor-v2"
                @pane-ready="onFlowReady"
              >
              </VueFlow>
              <div v-else class="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <div class="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
                <span class="text-xs font-bold uppercase tracking-widest text-slate-400">加载流程视图...</span>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8 bg-white text-on-surface">
              <!-- Left: Logs -->
              <div class="col-span-7 space-y-6 border-r border-outline-variant/15 pr-8">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black text-on-surface uppercase tracking-widest font-headline flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">history</span> 日志轨迹
                  </h4>
                  <button v-if="currentDetail?.macroStatus === 1" @click="mockDataChange" 
                          class="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-200 hover:bg-amber-100 transition shadow-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[12px]">warning</span> 模拟数据回退
                  </button>
                </div>
                
                <div class="space-y-4 pb-8">
                  <div v-for="(log, idx) in [...(currentDetail?.logs || [])].reverse()" :key="idx" 
                       class="p-4 rounded-2xl border border-outline-variant/10 text-sm bg-surface shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner" :class="getLogColorClass(log)">
                      <span class="material-symbols-outlined text-sm">{{ getLogIcon(log) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center mb-1">
                        <span class="font-black text-xs text-on-surface" :class="log.isSystem ? 'text-amber-600' : 'text-on-surface'">{{ log.isSystem ? '系统操作' : getLogActionText(log.action) }}</span>
                        <span class="text-[10px] font-bold opacity-30 text-on-surface-variant">{{ new Date(log.time).toLocaleTimeString() }}</span>
                      </div>
                      <p v-if="!log.isSystem" class="text-[10px] font-black opacity-50 mb-2 uppercase tracking-tighter text-on-surface-variant">{{ log.node || '起点' }} | {{ log.operator }}</p>
                      <p class="text-xs italic text-on-surface-variant opacity-80 bg-white/50 p-2 rounded-xl border border-black/5 mt-1">"{{ log.comment }}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Task Dispatcher -->
              <div class="col-span-5 space-y-6">
                <h4 class="text-xs font-black text-on-surface uppercase tracking-widest font-headline flex items-center gap-2 text-on-surface">
                  <span class="material-symbols-outlined text-base">pending_actions</span> 任务调度台
                </h4>
                
                <div v-if="!currentDetail || currentDetail.macroStatus !== 1 || activeTasks.length === 0" 
                     class="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-outline-variant/20 opacity-50 flex flex-col items-center text-on-surface">
                  <span class="material-symbols-outlined text-4xl mb-3 text-slate-300">lock_clock</span>
                  <p class="text-sm font-bold text-on-surface-variant italic">当前无待办任务</p>
                </div>

                <div class="space-y-4">
                  <div v-for="task in activeTasks" :key="task.id" 
                       class="bg-white border-2 border-primary/10 rounded-[1.5rem] p-6 shadow-md hover:shadow-xl transition-all relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                    <div class="flex items-center justify-between mb-4">
                      <span class="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-widest">{{ task.nodeConfig.node_name }}</span>
                      <span v-if="task.branch_id" class="text-[9px] font-black text-secondary uppercase text-on-surface-variant">{{ task.branch_id }} 分支</span>
                    </div>
                    
                    <div v-if="hasPermission(task.nodeConfig, task.branch_id)" class="space-y-4">
                      <textarea v-model="taskComments[task.id]" class="w-full bg-slate-50 border border-outline-variant/20 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-on-surface" placeholder="请输入审核意见..."></textarea>
                      <div class="flex gap-3">
                        <button @click="handleTask(task.id, 'PASS')" class="flex-1 bg-primary text-on-primary text-xs font-black py-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">同意</button>
                        <button @click="handleTask(task.id, 'REJECT')" class="flex-[0.5] bg-error-container text-on-error-container text-xs font-black py-3 rounded-2xl hover:bg-error-container/80 transition-all">驳回</button>
                      </div>
                    </div>
                    <div v-else class="text-xs font-bold text-on-surface-variant bg-slate-50 p-5 rounded-2xl border border-dashed border-outline-variant/30 flex items-center gap-3 text-on-surface">
                      <span class="material-symbols-outlined text-slate-300">lock</span>
                      <span class="opacity-60">需角色 [{{ getTargetRole(task.nodeConfig, task.branch_id) }}] 处理。</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, markRaw } from 'vue';
import { VueFlow } from '@vue-flow/core';
import LightweightWorkflowBuilder from './LightweightWorkflowBuilder.vue';
import FlowNodes from './workflow-nodes/FlowNodes.vue';

const nodeTypes = {
  custom: markRaw(FlowNodes),
};

const viewMode = ref('list');
const API_BASE = 'http://localhost:3001/api';
const list = ref([]);
const currentUserRole = ref('admin');
const showModal = ref(false);
const currentBizNo = ref(null);
const currentDetail = ref(null);
const activeTasks = ref([]);
const taskComments = ref({});

const elements = shallowRef([]);

const onFlowReady = (instance) => {
  instance.fitView({ padding: 0.1 });
};

const buildGraph = () => {
  if (!currentDetail.value?.nodes) return;
  
  const newElements = [];
  let currentX = 20; const spacingX = 220;
  const backboneY = 100; // 主干道 Y 轴绝对锁定 100

  // 1. Start Node (H=32, offset 16 -> y=84)
  const isStartPassed = currentDetail.value.nodes.length > 0;
  newElements.push({ 
    id: 'start', type: 'custom', 
    position: { x: currentX, y: backboneY - 16 }, 
    data: { kind: 'start', status: isStartPassed ? 'PASSED' : 'ACTIVE' } 
  });
  let prevId = 'start'; let prevStatus = isStartPassed ? 'PASSED' : 'ACTIVE';
  currentX += 80;

  currentDetail.value.nodes.forEach((node) => {
    if (node.type === 'user_task') {
      const nodeId = `node-${node.id}`;
      // Task (H=56, offset 28 -> y=72)
      newElements.push({ 
        id: nodeId, type: 'custom', 
        position: { x: currentX, y: backboneY - 28 }, 
        data: { kind: 'task', label: node.name, code: node.role, status: node.status } 
      });
      newElements.push({ 
        id: `e-${prevId}-${nodeId}`, source: prevId, target: nodeId, targetHandle: 'in-main', sourceHandle: 'out-main',
        type: 'smoothstep', 
        animated: node.status === 'ACTIVE',
        style: { stroke: node.status === 'PASSED' || node.status === 'ACTIVE' ? (node.status === 'PASSED' ? '#10b981' : '#2563eb') : '#e2e8f0', strokeWidth: 2 }
      });
      prevId = nodeId; prevStatus = node.status; currentX += spacingX;
    } else if (node.type === 'parallel_group') {
      const forkId = `fork-${node.id}`; const joinId = `join-${node.id}`;
      
      // Gateway (H=40, offset 20 -> y=80)
      newElements.push({ 
        id: forkId, type: 'custom', 
        position: { x: currentX, y: backboneY - 20 }, 
        data: { kind: 'gateway', status: node.status } 
      });
      
      newElements.push({ 
        id: `e-${prevId}-${forkId}`, source: prevId, target: forkId, targetHandle: 'in-main', sourceHandle: 'out-main',
        type: 'smoothstep', 
        animated: node.status === 'ACTIVE',
        style: { stroke: node.status === 'PASSED' || node.status === 'ACTIVE' ? (node.status === 'PASSED' ? '#10b981' : '#2563eb') : '#e2e8f0', strokeWidth: 2 }
      });
      
      const branches = node.branches || []; 
      const branchHeight = 60; 
      const offsets = [-branchHeight, branchHeight]; 
      const outHandles = ['out-top', 'out-bottom'];
      const inHandles = ['in-top', 'in-bottom'];

      branches.forEach((b, bIdx) => {
        const branchTaskId = `branch-${b.branch_id}`;
        const tasks = currentDetail.value?.tasks || [];
        const task = tasks.find(t => t.nodeId == node.id && t.branchId == b.branch_id);
        const taskStatus = task?.status || 'PENDING';
        const isAnim = taskStatus === 'PENDING' && node.status === 'ACTIVE';

        // 任务节点偏移 Y
        const bY = backboneY + (offsets[bIdx % 2] || 0);

        newElements.push({ 
          id: branchTaskId, type: 'custom', 
          position: { x: currentX + 110, y: bY - 28 }, 
          data: { kind: 'task', label: b.name, code: b.role_target, status: taskStatus === 'PASS' ? 'PASSED' : (taskStatus === 'PENDING' && node.status === 'ACTIVE' ? 'ACTIVE' : (taskStatus === 'INVALIDATED' ? 'INVALIDATED' : 'PENDING')) } 
        });
        
        newElements.push({ 
          id: `e-${forkId}-${branchTaskId}`, source: forkId, sourceHandle: outHandles[bIdx % 2], target: branchTaskId, 
          type: 'smoothstep', 
          animated: isAnim,
          style: { stroke: taskStatus === 'PASS' || isAnim ? (taskStatus === 'PASS' ? '#10b981' : '#2563eb') : '#e2e8f0', strokeWidth: 2 }
        });
        
        newElements.push({ 
          id: `e-${branchTaskId}-${joinId}`, source: branchTaskId, target: joinId, targetHandle: inHandles[bIdx % 2],
          type: 'smoothstep', 
          animated: isAnim,
          style: { stroke: taskStatus === 'PASS' || isAnim ? (taskStatus === 'PASS' ? '#10b981' : '#2563eb') : '#e2e8f0', strokeWidth: 2 }
        });
      });
      
      newElements.push({ 
        id: joinId, type: 'custom', 
        position: { x: currentX + spacingX + 90, y: backboneY - 20 }, 
        data: { kind: 'gateway', status: node.status } 
      });
      prevId = joinId; prevStatus = node.status; currentX += spacingX + 190;
    }
  });

  // End Node (H=32, offset 16 -> y=84)
  const isEndReached = currentDetail.value.macroStatus === 99;
  newElements.push({ 
    id: 'end', type: 'custom', 
    position: { x: currentX, y: backboneY - 16 }, 
    data: { kind: 'end', status: isEndReached ? 'PASSED' : 'PENDING' } 
  });
  newElements.push({ 
    id: `e-${prevId}-end`, source: prevId, sourceHandle: prevId.startsWith('join-') ? 'out-main' : undefined, target: 'end', 
    type: 'smoothstep',
    style: { stroke: isEndReached ? '#10b981' : '#e2e8f0', strokeWidth: 2 }
  });
  
  elements.value = newElements;
};

const fetchList = async () => {
  try {
    const res = await fetch(`${API_BASE}/workflow/instances`);
    if (res.ok) {
      const data = await res.json();
      list.value = data;
      data.forEach(async (inst, index) => {
        try {
          const taskRes = await fetch(`${API_BASE}/workflow/tasks/${inst.businessNo}`);
          if (taskRes.ok) {
            const tasks = await taskRes.json();
            list.value[index].tasks = tasks;
          }
        } catch (err) { console.warn(err); }
      });
    }
  } catch (e) { console.error(e); }
};

const mockSubmitNew = async () => {
  try {
    const res = await fetch(`${API_BASE}/workflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: 'MOD-SCORE-DETAIL', targetEntity: 'score', targetRecordId: '1', actionType: 'UPDATE', reason: '手工录入错误', payload: { score: 99 }, submitterId: currentUserRole.value })
    });
    if (res.ok) fetchList();
  } catch (e) { alert(e.message); }
};

const openModal = async (no) => {
  currentBizNo.value = no;
  elements.value = [];
  await fetchDetail(no);
  showModal.value = true;
};

const closeModal = () => { 
  showModal.value = false; 
  currentDetail.value = null; 
  elements.value = [];
  fetchList(); 
};

const fetchDetail = async (no) => {
  try {
    const res = await fetch(`${API_BASE}/workflow/panorama/${no}`);
    if (res.ok) {
      const data = await res.json();
      currentDetail.value = data;
      
      buildGraph();

      // Refresh active tasks for dispatcher
      activeTasks.value = (data.tasks || []).filter(t => t.status === 'PENDING').map(t => {
        const node = data.nodes.find(n => n.id == t.nodeId);
        return { ...t, nodeConfig: node ? { node_name: node.name, node_type: node.type, role_target: node.role } : { node_name: '未知' } };
      });
      activeTasks.value.forEach(t => { if(!taskComments.value[t.id]) taskComments.value[t.id] = ''; });
    }
  } catch (e) { console.error(e); }
};

const handleTask = async (taskId, action) => {
  try {
    const res = await fetch(`${API_BASE}/workflow/handle/${currentBizNo.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, action, comment: taskComments.value[taskId], userId: currentUserRole.value })
    });
    if (res.ok) await fetchDetail(currentBizNo.value);
  } catch (e) { console.error(e); }
};

const mockDataChange = async () => {
  try {
    await fetch(`${API_BASE}/workflow/mock-data-change/${currentBizNo.value}`, { method: 'POST' });
    fetchDetail(currentBizNo.value);
  } catch (e) { console.error(e); }
};

const getTargetRole = (n, bId) => {
  if (n.node_type === 'user_task') return n.role_target;
  const branches = n.branches || [];
  return branches.find(x => x.branch_id === bId)?.role_target || 'unknown';
};

const hasPermission = (n, bId) => currentUserRole.value === 'admin' || getTargetRole(n, bId) === currentUserRole.value;
const getLogColorClass = (l) => l.isSystem ? 'bg-amber-100 text-amber-600' : (l.action === 'pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400');
const getLogIcon = (l) => l.isSystem ? 'warning' : ({pass:'done', reject:'undo', submit:'add_task'}[l.action] || 'info');
const getLogActionText = (a) => ({ pass: '审核通过', reject: '审核驳回', submit: '发起申请' }[a] || a);

onMounted(() => { fetchList(); });
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.workflow-monitor-v2 {
  height: 100%;
  width: 100%;
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.98) translateY(20px); }
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.vue-flow__attribution { display: none; }

/* Enforce solid lines for our specific visual style, overrides default dashed */
.vue-flow__edge-path {
  stroke-dasharray: none !important;
}
</style>
