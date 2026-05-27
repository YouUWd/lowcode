<template>
  <div class="p-8 space-y-12 w-full animate-in fade-in duration-500">
    <!-- Header Action Section (标题与按钮对齐) -->
    <div class="flex justify-between items-center mb-6 mt-[-1rem]">
      <div class="flex items-center gap-3">
        <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
          <ClipboardCheck class="mr-2 text-primary w-5 h-5" />
          审批处理台
          <span class="ml-3 text-xs font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant tracking-tighter">{{ currentBizNo }}</span>
        </h2>
        <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 animate-pulse">
          <component :is="simulatorRoles.find(r => r.val === currentUserRole)?.icon" class="w-3.5 h-3.5" />
          <span>模拟席: {{ simulatorRoles.find(r => r.val === currentUserRole)?.label }}</span>
        </span>
      </div>
      <div class="flex space-x-3">
        <button @click="goBack" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center cursor-pointer">
          <X class="w-4 h-4 mr-2" />
          返回列表
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-7xl mx-auto w-full relative space-y-8">
        
        <!-- Vue Flow Monitor Area -->
        <div class="h-[250px] rounded-3xl border border-outline-variant/15 bg-white relative overflow-hidden shadow-sm">
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

        <!-- Multi-Column Layout -->
        <div class="grid grid-cols-12 gap-8 text-on-surface">
          <!-- Left: Logs -->
          <div class="col-span-7 space-y-6 border-r border-outline-variant/15 pr-8">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black text-on-surface uppercase tracking-widest font-headline flex items-center gap-2">
                <History class="w-4 h-4" /> 日志轨迹
              </h4>
              <button v-if="currentDetail?.macroStatus === 1" @click="mockDataChange" 
                      class="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-200 hover:bg-amber-100 transition shadow-sm flex items-center gap-1.5">
                <AlertTriangle class="w-3.5 h-3.5" /> 模拟数据回退
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
                  <component :is="getLogIcon(log)" class="w-3 h-3" :class="getLogTextClass(log)" />
                </div>

                <!-- Beautiful Frosted Card -->
                <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative group/log">
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

                  <div class="text-xs italic text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 mt-1 flex items-start gap-1.5">
                    <Quote class="w-3.5 h-3.5 text-slate-400 opacity-60 mt-0.5 flex-shrink-0" />
                    <span class="opacity-90">{{ log.comment }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Task Dispatcher -->
          <div class="col-span-5 space-y-6">
            <h4 class="text-xs font-black text-on-surface uppercase tracking-widest font-headline flex items-center gap-2 text-on-surface">
              <ClipboardList class="w-4 h-4" /> 任务调度台
            </h4>
            
            <div v-if="!currentDetail || currentDetail.macroStatus !== 1 || activeTasks.length === 0" 
                 class="text-center py-16 bg-slate-50/50 rounded-3xl border border-slate-200/60 opacity-60 flex flex-col items-center justify-center p-8 text-on-surface animate-in fade-in duration-300">
              <Lock class="w-10 h-10 mb-3 text-slate-300 animate-pulse" />
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
                      <CheckCircle2 class="w-4 h-4" /> 同意批准
                    </button>
                    <button @click="handleTask(task.id, 'REJECT')" class="flex-[0.4] bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-black py-3.5 rounded-2xl shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5">
                      <XCircle class="w-4 h-4" /> 驳回
                    </button>
                  </div>
                </div>
                <div v-else class="text-xs font-bold text-on-surface-variant bg-slate-50 p-5 rounded-2xl border border-dashed border-outline-variant/30 flex items-center gap-3 text-on-surface text-left">
                  <Lock class="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <span class="opacity-60">需人员/角色 [{{ getTargetRoleLabel(task) }}] 处理。</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, shallowRef, markRaw, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, MarkerType } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import FlowNodes from './parts/FlowNodes.vue';
import { 
  fetchWorkflowDetail, 
  submitWorkflowTask,
  workflowState as state
} from '../../store/workflow';
import { workflowApi } from '../../api/workflow';
import { appState } from '../../store/app';
import { 
  ClipboardCheck, 
  X, 
  History, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  Send, 
  Info, 
  Quote, 
  ClipboardList, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  UserCog, 
  GraduationCap, 
  Landmark, 
  Wallet, 
  Shield 
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const currentBizNo = computed(() => route.params.id);

const nodeTypes = {
  custom: markRaw(FlowNodes),
};

const userToRoleMap = {
  admin_sys: 'admin',
  alex_zhang: 'head_teacher',
  bella_wang: 'academic_admin',
  charlie_li: 'finance',
  david_zhao: 'principal',
  emma_sun: 'hr_director'
};

const roleToUserMap = {
  admin: 'admin_sys',
  head_teacher: 'alex_zhang',
  academic_admin: 'bella_wang',
  finance: 'charlie_li',
  principal: 'david_zhao',
  hr_director: 'emma_sun'
};

const currentUserRole = computed(() => {
  if (appState.simulationMode === 'role') {
    return appState.currentUserRole;
  } else {
    return userToRoleMap[appState.currentUser] || 'admin';
  }
});

const currentUser = computed(() => {
  if (appState.simulationMode === 'user') {
    return appState.currentUser;
  } else {
    return roleToUserMap[appState.currentUserRole] || 'admin_sys';
  }
});

watch(() => appState.refreshTrigger, () => {
  if (currentBizNo.value) fetchDetail(currentBizNo.value);
});

const taskComments = ref({});
const elements = shallowRef([]);

const simulatorRoles = [
  { val: 'admin', label: '系统管理员', code: 'ADM', icon: UserCog, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { val: 'head_teacher', label: '任课老师', code: 'TEA', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { val: 'academic_admin', label: '教务处', code: 'EDU', icon: Landmark, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { val: 'finance', label: '财务处', code: 'FIN', icon: Wallet, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { val: 'principal', label: '校长', code: 'PRN', icon: Shield, color: 'text-purple-600 bg-purple-50 border-purple-200' }
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

  const X_GAP = 230; 
  const Y_CENTER = 100;
  const Y_GAP = 110; 

  const laidOutNodes = [];
  sortedLevels.forEach(level => {
    const nodesInLevel = levels[level];
    const nodeCount = nodesInLevel.length;
    
    nodesInLevel.forEach((node, index) => {
      let x = level * X_GAP + 20; 
      let y = Y_CENTER;

      if (nodeCount > 1) {
        const totalHeight = (nodeCount - 1) * Y_GAP;
        y = (Y_CENTER - totalHeight / 2) + (index * Y_GAP);
      }

      laidOutNodes.push({
        id: node.id,
        type: node.type,
        data: node.data,
        position: { x, y: y - 30 },
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
        data: { 
          kind: 'task', 
          label: node.name, 
          code: node.role, 
          status: node.status,
          roles: node.roles || (node.role ? [node.role] : []),
          users: node.users || [],
          approverType: node.approverType || 'role',
          approveMode: node.approveMode || 'OR'
        } 
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
          data: { 
            kind: 'task', 
            label: b.name, 
            code: b.role_target, 
            status: branchStatus,
            roles: b.roles || (b.role_target ? [b.role_target] : []),
            users: b.users || [],
            approverType: b.approverType || 'role',
            approveMode: b.approveMode || 'OR'
          } 
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
  
  const positionedNodes = autoLayout(nodes, edges);
  elements.value = [...positionedNodes, ...edges];
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
  const operator = appState.simulationMode === 'user' ? currentUser.value : currentUserRole.value;
  const success = await submitWorkflowTask(currentBizNo.value, taskId, action, taskComments.value[taskId], operator);
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

const getTargetRoleLabel = (task) => {
  const node = currentDetail.value?.nodes?.find(n => n.id == task.nodeId);
  if (!node) return '未知';
  if (node.type === 'user_task') {
    const type = node.approverType || 'role';
    const mode = node.approveMode === 'AND' ? '会签' : '或签';
    if (type === 'user' && node.users && node.users.length) {
      const userLabels = {
        alex_zhang: '张老师',
        bella_wang: '王教务',
        charlie_li: '李财务',
        david_zhao: '赵校长',
        emma_sun: '孙人事'
      };
      return `${node.users.map(u => userLabels[u] || u).join(', ')} (${mode})`;
    }
    if (node.roles && node.roles.length) {
      const roleLabels = {
        head_teacher: '任课老师',
        academic_admin: '教务处',
        finance: '财务处',
        principal: '学校校长',
        hr_director: '人事总监'
      };
      return `${node.roles.map(r => roleLabels[r] || r).join(', ')} (${mode})`;
    }
    const roleLabels = {
      head_teacher: '任课老师',
      academic_admin: '教务处',
      finance: '财务处',
      principal: '学校校长',
      hr_director: '人事总监'
    };
    return roleLabels[node.role] || node.role || '未知';
  }
  const branches = node.branches || [];
  const branchRole = branches.find(x => x.branch_id == task.branchId || x.branch_id == task.branch_id)?.role_target || 'unknown';
  const roleLabels = {
    head_teacher: '任课老师',
    academic_admin: '教务处',
    finance: '财务处',
    principal: '学校校长',
    hr_director: '人事总监'
  };
  return roleLabels[branchRole] || branchRole;
};

const hasPermission = (task) => {
  if (appState.simulationMode === 'role' && appState.currentUserRole === 'admin') return true;
  if (appState.simulationMode === 'user' && appState.currentUser === 'admin_sys') return true;
  
  const node = currentDetail.value?.nodes?.find(n => n.id == task.nodeId);
  if (!node) return false;
  
  if (node.type === 'user_task') {
    const approverType = node.approverType || 'role';
    if (approverType === 'user') {
      const activeUser = appState.simulationMode === 'user' ? appState.currentUser : roleToUserMap[appState.currentUserRole];
      return node.users && node.users.includes(activeUser);
    } else {
      const activeRole = appState.simulationMode === 'role' ? appState.currentUserRole : userToRoleMap[appState.currentUser];
      return (node.roles && node.roles.includes(activeRole)) || node.role === activeRole;
    }
  }
  
  const branches = node.branches || [];
  const branchRole = branches.find(x => x.branch_id == task.branchId || x.branch_id == task.branch_id)?.role_target || 'unknown';
  const activeRole = appState.simulationMode === 'role' ? appState.currentUserRole : userToRoleMap[appState.currentUser];
  return branchRole === activeRole;
};

const getLogIcon = (l) => l.isSystem ? AlertTriangle : ({ pass: Check, reject: RotateCcw, submit: Send }[l.action] || Info);
const getLogActionText = (a) => ({ pass: '审核通过', reject: '审核驳回', submit: '发起申请' }[a] || a);

const goBack = () => {
  router.push('/workflow/list');
};

onMounted(async () => {
  if (currentBizNo.value) {
    await fetchDetail(currentBizNo.value);
  }
});
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.workflow-monitor-v2 {
  height: 100%;
  width: 100%;
}

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
