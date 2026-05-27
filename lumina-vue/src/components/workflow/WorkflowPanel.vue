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
        <div class="flex items-center gap-6">
          <div class="flex flex-col gap-1.5 text-left">
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">模拟操作身份 (Clearance Dock)</span>
            <div class="flex items-center gap-2">
              <button 
                v-for="role in simulatorRoles" 
                :key="role.val" 
                @click="currentUserRole = role.val; fetchList()"
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all relative overflow-hidden group/role"
                :class="currentUserRole === role.val 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.03] ring-2 ring-primary/20' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80'"
              >
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover/role:opacity-100 transition-opacity"></div>
                <span class="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover/role:rotate-12" :class="currentUserRole === role.val ? 'text-white' : role.color.split(' ')[0]">{{ role.icon }}</span>
                <span>{{ role.label }}</span>
                <span class="text-[9px] px-1 rounded font-mono tracking-tighter" :class="currentUserRole === role.val ? 'bg-white/15 text-white/90' : 'bg-slate-100 text-slate-400'">{{ role.code }}</span>
              </button>
            </div>
          </div>
          <button @click="mockSubmitNew" class="px-5 py-3 bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-black rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-95 transition-all flex items-center shrink-0 self-end">
            <span class="material-symbols-outlined text-[16px] mr-1.5 font-bold">add</span> 发起新申请
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
              <div class="flex items-center gap-3">
                <h3 class="font-headline font-bold text-lg text-on-surface flex items-center">
                   <span class="material-symbols-outlined mr-2 text-primary">fact_check</span>
                   审批处理台
                   <span class="ml-3 text-xs font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant tracking-tighter">{{ currentBizNo }}</span>
                </h3>
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 animate-pulse">
                  <span class="material-symbols-outlined text-[13px]">{{ simulatorRoles.find(r => r.val === currentUserRole)?.icon }}</span>
                  <span>模拟席: {{ simulatorRoles.find(r => r.val === currentUserRole)?.label }}</span>
                </span>
              </div>
              <button @click="closeModal" class="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-variant/50 transition-colors">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <!-- Vue Flow Monitor Area -->
            <div class="h-[200px] border-b border-outline-variant/15 bg-slate-50/50 relative shrink-0">
              <VueFlow
                v-if="elements.length"
                v-model="elements"
                :node-types="nodeTypes"
                :default-edge-options="{ type: 'smoothstep', borderRadius: 12 }"
                :fit-view-on-init="true"
                :nodes-draggable="true"
                :nodes-connectable="false"
                :elements-selectable="true"
                :zoom-on-scroll="true"
                :pan-on-drag="true"
                :prevent-scrolling="false"
                class="workflow-monitor-v2"
                @pane-ready="onFlowReady"
              >
                <Background :gap="20" pattern-color="#cbd5e1" />
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
                
                <div class="relative border-l-2 border-slate-100 pl-8 ml-4 space-y-6 py-2 text-left pb-8">
                  <!-- Vertical Glowing Path Accent -->
                  <div class="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-slate-100 to-slate-200"></div>

                  <div v-for="(log, idx) in [...(currentDetail?.logs || [])].reverse()" :key="idx" 
                       class="relative animate-in fade-in slide-in-from-left-2 duration-300">
                    
                    <!-- Floating Indicator Orb on Left Border Line -->
                    <div class="absolute -left-11 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-md z-10 transition-all duration-300"
                         :class="getLogBorderClass(log)">
                      <span class="material-symbols-outlined text-[12px] font-bold" :class="getLogTextClass(log)">{{ getLogIcon(log) }}</span>
                    </div>

                    <!-- Beautiful Frosted Card -->
                    <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative group/log">
                      <!-- Left border glowing accent line on card hover -->
                      <div class="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-transparent transition-colors duration-300"
                           :class="{
                             'group-hover/log:bg-amber-400': log.isSystem,
                             'group-hover/log:bg-emerald-400': !log.isSystem && log.action === 'pass',
                             'group-hover/log:bg-rose-400': !log.isSystem && log.action === 'reject',
                             'group-hover/log:bg-slate-300': !log.isSystem && log.action !== 'pass' && log.action !== 'reject'
                           }">
                      </div>

                      <div class="flex justify-between items-center mb-1">
                        <span class="font-extrabold text-xs tracking-tight" :class="log.isSystem ? 'text-amber-600' : 'text-slate-800'">{{ log.isSystem ? '系统自动处理' : getLogActionText(log.action) }}</span>
                        <span class="text-[10px] font-bold opacity-30 text-on-surface-variant">{{ new Date(log.time).toLocaleTimeString() }}</span>
                      </div>
                      
                      <div class="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span class="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">{{ log.node || '起点' }}</span>
                        <span class="opacity-50">|</span>
                        <span>操作人: {{ log.operator }}</span>
                      </div>

                      <div class="text-xs italic text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 mt-1 flex items-start gap-1">
                        <span class="material-symbols-outlined text-[14px] text-slate-400 opacity-60 mt-0.5">format_quote</span>
                        <span class="opacity-90">{{ log.comment }}</span>
                      </div>
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
                     class="text-center py-16 bg-slate-50/50 rounded-3xl border border-slate-200/60 opacity-60 flex flex-col items-center justify-center p-8 text-on-surface">
                   <span class="material-symbols-outlined text-4xl mb-3 text-slate-300 animate-pulse">lock_clock</span>
                   <p class="text-xs font-extrabold text-slate-500 uppercase tracking-widest">系统暂无待办任务</p>
                   <p class="text-[10px] text-slate-400 mt-1 font-medium">当前审批流未激活，或已完成流转归档</p>
                 </div>

                 <div class="space-y-4">
                   <div v-for="task in activeTasks" :key="task.id" 
                        class="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden animate-in zoom-in-95 duration-300">
                     <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                     <div class="flex items-center justify-between mb-4">
                       <span class="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-widest">{{ task.nodeConfig.node_name }}</span>
                       <span v-if="task.branch_id" class="text-[9px] font-black text-secondary uppercase text-slate-400">{{ task.branch_id }} 分支</span>
                     </div>
                     
                     <div v-if="hasPermission(task)" class="space-y-4 text-left">
                       <div class="flex flex-col gap-2">
                         <textarea v-model="taskComments[task.id]" class="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-800 placeholder-slate-400" placeholder="请录入审核意见或直接点击下方快捷短语..."></textarea>
                         
                         <!-- Quick-fill Tag Container -->
                         <div class="flex items-center gap-1.5 flex-wrap">
                           <span class="text-[9px] font-black text-slate-400 uppercase mr-1">快捷语:</span>
                           <button 
                             v-for="tpl in quickComments" 
                             :key="tpl"
                             @click="taskComments[task.id] = tpl"
                             class="px-2.5 py-1 bg-slate-50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 border border-slate-200/60 rounded-xl text-[10px] font-extrabold text-slate-500 transition-all active:scale-95"
                           >
                             {{ tpl }}
                           </button>
                         </div>
                       </div>

                       <div class="flex gap-3 mt-2">
                         <button @click="handleTask(task.id, 'PASS')" class="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5">
                           <span class="material-symbols-outlined text-[16px] font-bold">check_circle</span> 同意批准
                         </button>
                         <button @click="handleTask(task.id, 'REJECT')" class="flex-[0.4] bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-black py-3.5 rounded-2xl shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5">
                           <span class="material-symbols-outlined text-[16px] font-bold">cancel</span> 驳回
                         </button>
                       </div>
                     </div>
                     <div v-else class="text-xs font-bold text-on-surface-variant bg-slate-50 p-5 rounded-2xl border border-dashed border-outline-variant/30 flex items-center gap-3 text-on-surface text-left">
                       <span class="material-symbols-outlined text-slate-300">lock</span>
                       <span class="opacity-60">需角色 [{{ getTargetRole(task) }}] 处理。</span>
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
import { ref, onMounted, shallowRef, markRaw, computed } from 'vue';
import { VueFlow, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import LightweightWorkflowBuilder from './LightweightWorkflowBuilder.vue';
import FlowNodes from './FlowNodes.vue';
import { 
  fetchWorkflowInstances, 
  fetchWorkflowDetail, 
  submitWorkflowTask,
  workflowState as state
} from '../../store/workflow';
import { workflowApi } from '../../api/workflow';

const nodeTypes = {
  custom: markRaw(FlowNodes),
};

const viewMode = ref('list');
const currentUserRole = ref('admin');
const showModal = ref(false);
const currentBizNo = ref(null);
const taskComments = ref({});

const elements = shallowRef([]);

const simulatorRoles = [
  { val: 'admin', label: '系统管理员', code: 'ADM', icon: 'manage_accounts', color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { val: 'head_teacher', label: '任课老师', code: 'TEA', icon: 'school', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { val: 'academic_admin', label: '教务处', code: 'EDU', icon: 'account_balance', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { val: 'finance', label: '财务处', code: 'FIN', icon: 'payments', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { val: 'principal', label: '校长', code: 'PRN', icon: 'shield', color: 'text-purple-600 bg-purple-50 border-purple-200' }
];

const quickComments = [
  '核对无误，同意批准。',
  '材料完整，同意通过。',
  '资金预算充足，予以批准。',
  '申报材料有瑕疵，退回修改。'
];

const getLogBorderClass = (l) => {
  if (l.isSystem) return 'border-amber-400 bg-white text-amber-600 shadow-amber-100/50';
  if (l.action === 'pass') return 'border-emerald-400 bg-white text-emerald-600 shadow-emerald-100/50';
  if (l.action === 'reject') return 'border-rose-400 bg-white text-rose-600 shadow-rose-100/50';
  return 'border-slate-300 bg-white text-slate-500 shadow-slate-100/50';
};

const getLogTextClass = (l) => {
  if (l.isSystem) return 'text-amber-500';
  if (l.action === 'pass') return 'text-emerald-500';
  if (l.action === 'reject') return 'text-rose-500';
  return 'text-slate-500';
};

// Computed properties mapping to store state
const list = computed(() => state.instances || []);
const currentDetail = computed(() => state.currentDetail);
const activeTasks = computed(() => state.activeTasks || []);

const onFlowReady = (instance) => {
  instance.fitView({ padding: 0.1 });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'PASSED':
    case 'completed': 
      return '#10b981'; // Green
    case 'ACTIVE':
    case 'processing': 
      return '#3b82f6'; // Blue
    case 'INVALIDATED':
    case 'rejected': 
      return '#ef4444'; // Red
    default: 
      return '#9ca3af'; // Gray
  }
};

const getEdgeConfig = (status) => {
  const color = getStatusColor(status);
  const isAnimated = status === 'PASSED' || status === 'ACTIVE';
  return {
    type: 'smoothstep',
    animated: isAnimated,
    style: {
      stroke: color,
      strokeWidth: status === 'ACTIVE' ? 3 : 2,
      opacity: status === 'PENDING' ? 0.7 : 1
    },
    markerEnd: { 
      type: MarkerType.ArrowClosed, 
      color 
    }
  };
};

const autoLayout = (nodes, edges) => {
  if (!nodes.length) return [];
  
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [], parents: [], level: -1 }]));
  
  // 1. 构建拓扑关系
  edges.forEach(edge => {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      nodeMap.get(edge.source).children.push(edge.target);
      nodeMap.get(edge.target).parents.push(edge.source);
    }
  });

  // 2. 计算层级 (Longest Path Leveling)
  const starts = nodes.filter(n => n.data.kind === 'start');
  const queue = starts.map(n => n.id);
  starts.forEach(n => {
    const node = nodeMap.get(n.id);
    if (node) node.level = 0;
  });

  let count = 0;
  const MAX_ITERATIONS = 500;
  while (queue.length > 0 && count < MAX_ITERATIONS) {
    count++;
    const id = queue.shift();
    const node = nodeMap.get(id);
    if (!node) continue;
    
    node.children.forEach(childId => {
      const child = nodeMap.get(childId);
      if (!child || child.data.kind === 'start') return;
      
      const newLevel = node.level + 1;
      if (newLevel > child.level) {
        child.level = newLevel;
        queue.push(childId);
      }
    });
  }

  nodeMap.forEach(node => {
    if (node.level === -1) node.level = 0;
  });

  const levels = {};
  nodeMap.forEach(node => {
    if (!levels[node.level]) levels[node.level] = [];
    levels[node.level].push(node);
  });

  const sortedLevels = Object.keys(levels)
    .map(Number)
    .sort((a, b) => a - b);

  const X_GAP = 230; // 宽 150px 的卡片 + X_GAP 230px = 净边长 80px
  const Y_CENTER = 100;
  const Y_GAP = 110;  // 垂直卡片间距设为 110px，非常宽敞且不会重叠

  const laidOutNodes = [];
  sortedLevels.forEach(level => {
    const nodesInLevel = levels[level];
    const nodeCount = nodesInLevel.length;
    
    nodesInLevel.forEach((node, index) => {
      let x = level * X_GAP + 20; // 稍微增加起点偏置，保证左侧不拥挤
      let y = Y_CENTER;

      if (nodeCount > 1) {
        const totalHeight = (nodeCount - 1) * Y_GAP;
        y = (Y_CENTER - totalHeight / 2) + (index * Y_GAP);
      }

      laidOutNodes.push({
        id: node.id,
        type: node.type,
        data: node.data,
        position: { x, y: y - 30 }, // 所有卡片规格统一为 60px 高度，中心位于 y - 30，主轴连线绝对水平对齐在 Y_CENTER 上！
      });
    });
  });

  return laidOutNodes;
};

const buildGraph = () => {
  if (!currentDetail.value?.nodes) return;
  
  const nodes = [];
  const edges = [];

  // 1. Start Node
  const isStartPassed = currentDetail.value.nodes.length > 0;
  const startStatus = isStartPassed ? 'PASSED' : 'ACTIVE';
  nodes.push({ 
    id: 'start', type: 'custom', 
    position: { x: 0, y: 0 }, 
    data: { kind: 'start', status: startStatus } 
  });
  let prevId = 'start';

  currentDetail.value.nodes.forEach((node) => {
    if (node.type === 'user_task') {
      const nodeId = `node-${node.id}`;
      nodes.push({ 
        id: nodeId, type: 'custom', 
        position: { x: 0, y: 0 }, 
        data: { kind: 'task', label: node.name, code: node.role, status: node.status } 
      });
      edges.push({ 
        id: `e-${prevId}-${nodeId}`, source: prevId, target: nodeId, targetHandle: 'in-main', sourceHandle: 'out-main',
        ...getEdgeConfig(node.status)
      });
      prevId = nodeId;
    } else if (node.type === 'parallel_group') {
      const forkId = `fork-${node.id}`; const joinId = `join-${node.id}`;
      
      nodes.push({ 
        id: forkId, type: 'custom', 
        position: { x: 0, y: 0 }, 
        data: { kind: 'gateway', status: node.status } 
      });
      
      edges.push({ 
        id: `e-${prevId}-${forkId}`, source: prevId, target: forkId, targetHandle: 'in-main', sourceHandle: 'out-main',
        ...getEdgeConfig(node.status)
      });
      
      const branches = node.branches || []; 
      const outHandles = ['out-top', 'out-bottom'];
      const inHandles = ['in-top', 'in-bottom'];

      branches.forEach((b, bIdx) => {
        const branchTaskId = `branch-${b.branch_id}`;
        const tasks = currentDetail.value?.tasks || [];
        const task = tasks.find(t => t.nodeId == node.id && t.branchId == b.branch_id);
        const taskStatus = task?.status || 'PENDING';

        const branchStatus = taskStatus === 'PASS' ? 'PASSED' : 
                             (taskStatus === 'REJECT' || taskStatus === 'INVALIDATED' ? 'INVALIDATED' : 
                             (taskStatus === 'PENDING' && node.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'));

        nodes.push({ 
          id: branchTaskId, type: 'custom', 
          position: { x: 0, y: 0 }, 
          data: { kind: 'task', label: b.name, code: b.role_target, status: branchStatus } 
        });
        
        edges.push({ 
          id: `e-${forkId}-${branchTaskId}`, source: forkId, sourceHandle: outHandles[bIdx % 2], target: branchTaskId, 
          ...getEdgeConfig(branchStatus)
        });
        
        edges.push({ 
          id: `e-${branchTaskId}-${joinId}`, source: branchTaskId, target: joinId, targetHandle: inHandles[bIdx % 2],
          ...getEdgeConfig(branchStatus)
        });
      });
      
      nodes.push({ 
        id: joinId, type: 'custom', 
        position: { x: 0, y: 0 }, 
        data: { kind: 'gateway', status: node.status } 
      });
      prevId = joinId;
    }
  });

  // End Node
  const isEndReached = currentDetail.value.macroStatus === 99;
  const endStatus = isEndReached ? 'PASSED' : 'PENDING';
  nodes.push({ 
    id: 'end', type: 'custom', 
    position: { x: 0, y: 0 }, 
    data: { kind: 'end', status: endStatus } 
  });
  edges.push({ 
    id: `e-${prevId}-end`, source: prevId, sourceHandle: prevId.startsWith('join-') ? 'out-main' : 'out-main', target: 'end', targetHandle: 'in-main',
    ...getEdgeConfig(endStatus)
  });
  
  // 运行拓扑自适应布局
  const positionedNodes = autoLayout(nodes, edges);
  
  elements.value = [...positionedNodes, ...edges];
};

const fetchList = async () => {
  await fetchWorkflowInstances();
};

const mockSubmitNew = async () => {
  try {
    await workflowApi.startProcess({ 
      moduleId: 'MOD-SCORE-DETAIL', 
      targetEntity: 'score', 
      targetRecordId: '1', 
      actionType: 'UPDATE', 
      reason: '手工录入错误', 
      payload: { score: 99 }, 
      submitterId: currentUserRole.value 
    });
    fetchList();
  } catch (e) { 
    alert(e.message); 
  }
};

const openModal = async (no) => {
  currentBizNo.value = no;
  elements.value = [];
  await fetchDetail(no);
  showModal.value = true;
};

const closeModal = () => { 
  showModal.value = false; 
  state.currentDetail = null; 
  elements.value = [];
  fetchList(); 
};

const fetchDetail = async (no) => {
  const data = await fetchWorkflowDetail(no);
  if (data) {
    buildGraph();
    activeTasks.value.forEach(t => { 
      if(!taskComments.value[t.id]) taskComments.value[t.id] = ''; 
    });
  }
};

const handleTask = async (taskId, action) => {
  const success = await submitWorkflowTask(currentBizNo.value, taskId, action, taskComments.value[taskId], currentUserRole.value);
  if (success) {
    await fetchDetail(currentBizNo.value);
  }
};

const mockDataChange = async () => {
  try {
    await workflowApi.mockDataChange(currentBizNo.value);
    fetchDetail(currentBizNo.value);
  } catch (e) { 
    console.error(e); 
  }
};

const getTargetRole = (task) => {
  const node = currentDetail.value?.nodes?.find(n => n.id == task.nodeId);
  if (!node) return 'unknown';
  if (node.type === 'user_task') return node.role;
  const branches = node.branches || [];
  return branches.find(x => x.branch_id === task.branch_id)?.role_target || 'unknown';
};

const hasPermission = (task) => currentUserRole.value === 'admin' || getTargetRole(task) === currentUserRole.value;
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

/* 优化 handle 层级 */
.vue-flow__handle {
  z-index: 20;
}

/* 边的样式 - 基础与 Hover */
.vue-flow__edge-path {
  transition: stroke 0.3s, stroke-width 0.3s, filter 0.3s;
}

.vue-flow__edge:hover .vue-flow__edge-path {
  stroke-width: 4px !important;
  filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.4)) !important;
}

/* 箭头颜色与过渡 */
.vue-flow__arrowhead path {
  transition: fill 0.3s;
}

/* Dynamic flowing edge animation */
.vue-flow__edge.animated .vue-flow__edge-path {
  stroke-dasharray: 8;
  animation: dashdraw 0.8s linear infinite;
}

@keyframes dashdraw {
  from {
    stroke-dashoffset: 16;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
