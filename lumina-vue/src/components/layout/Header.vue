<template>
  <header class="bg-[#ffffff] dark:bg-[#191c1d] font-manrope text-sm font-medium tracking-tight flex justify-between items-center px-8 h-16 w-full shrink-0 z-30 shadow-[0px_4px_16px_rgba(25,28,29,0.02)] relative">
    <div class="flex items-center text-on-surface-variant">
      <!-- Top Breadcrumb Section (顶部面包屑) -->
      <div v-if="appState.currentView === 'list'" class="flex items-center">
        <span class="font-semibold text-on-surface">模块管理</span>
        <span class="ml-3 px-3 border-l border-outline-variant/40 text-xs font-semibold text-on-surface-variant/80">配置、监控及优化您的企业级架构模块</span>
      </div>
      
      <div v-else-if="appState.currentView === 'config' || appState.currentView === 'permissions'" class="flex items-center">
        <span @click="goToModules" class="font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-1 -ml-2 rounded-lg hover:bg-primary/5">模块管理</span>
        <ChevronRight class="w-4 h-4 text-outline-variant mx-1" />
        
        <!-- 模块名称 + 快速视图切换器 -->
        <div class="flex items-center bg-surface-container-high p-1 rounded-xl border border-outline-variant/20">
          <span class="font-semibold text-on-surface px-3 py-1">{{ modulesState.activeModule?.name || '员工管理' }}</span>
          <div class="w-px h-4 bg-outline-variant/40 mx-1"></div>
          <button @click="goToConfig" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all"
                  :class="appState.currentView === 'config' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            配置
          </button>
          <button @click="goToPermissions" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all ml-1"
                  :class="appState.currentView === 'permissions' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            权限
          </button>
        </div>

        <span class="ml-4 px-3 border-l border-outline-variant/40 text-xs font-semibold text-on-surface-variant/80">
          {{ appState.currentView === 'config' ? '定义主副实体关系及 UI 表现层字段映射规则' : '配置物理字段的细粒度安全访问控制节点 (CLS)' }}
        </span>
      </div>

      <!-- 2. 工作流管理 Breadcrumbs -->
      <div v-else-if="appState.currentView === 'workflow-list'" class="flex items-center">
        <span class="font-semibold text-on-surface">工作流管理</span>
        <span class="ml-3 px-3 border-l border-outline-variant/40 text-xs font-semibold text-on-surface-variant/80">演示彻底解耦的 Fork-Join 架构与靶向回退</span>
      </div>

      <div v-else-if="appState.currentView === 'workflow-designer' || appState.currentView === 'workflow-detail'" class="flex items-center">
        <span @click="goToWorkflowList" class="font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-1 -ml-2 rounded-lg hover:bg-primary/5">工作流管理</span>
        <ChevronRight class="w-4 h-4 text-outline-variant mx-1" />
        
        <!-- Case A: Dynamic Instance Switcher (If a specific bizNo is active) -->
        <div v-if="currentBizNo" class="flex items-center bg-surface-container-high p-1 rounded-xl border border-outline-variant/20">
          <span class="font-semibold text-on-surface px-3 py-1 font-mono">{{ currentBizNo }}</span>
          <div class="w-px h-4 bg-outline-variant/40 mx-1"></div>
          <button @click="goToWorkflowDetail" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all"
                  :class="appState.currentView === 'workflow-detail' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            处理控制台
          </button>
          <button @click="goToWorkflowDesigner" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all ml-1"
                  :class="appState.currentView === 'workflow-designer' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            流程设计器
          </button>
        </div>

        <!-- Case B: Generic Switcher (If no specific bizNo is active) -->
        <div v-else class="flex items-center bg-surface-container-high p-1 rounded-xl border border-outline-variant/20">
          <button @click="goToWorkflowList" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all"
                  :class="appState.currentView === 'workflow-list' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            流程实例
          </button>
          <button @click="goToWorkflowDesigner" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all ml-1"
                  :class="appState.currentView === 'workflow-designer' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            流程设计器
          </button>
        </div>

        <span class="ml-4 px-3 border-l border-outline-variant/40 text-xs font-semibold text-on-surface-variant/80">
          {{ appState.currentView === 'workflow-designer' ? '定义并联协作配置，支持指派多角色/人员及或签会签流转' : '详细展示并处理当前审批流的流转拓扑与任务分配' }}
        </span>
      </div>
    </div>
    
    <div class="flex items-center space-x-4 text-[#005daa] dark:text-[#0075d5]">
      <button class="hover:bg-primary/10 rounded-full transition-colors duration-200 active:scale-95 p-1.5 flex items-center justify-center">
        <Bell class="w-5 h-5" />
      </button>
      <button class="hover:bg-primary/10 rounded-full transition-colors duration-200 active:scale-95 p-1.5 flex items-center justify-center">
        <HelpCircle class="w-5 h-5" />
      </button>
      <button class="hover:bg-primary/10 rounded-full transition-colors duration-200 active:scale-95 p-1.5 flex items-center justify-center">
        <LayoutGrid class="w-5 h-5" />
      </button>
      <div class="h-6 w-px bg-outline-variant/30 mx-1"></div>
      
      <!-- Premium Identity Switcher Pill -->
      <div ref="dropdownRef" class="relative">
        <button @click="showSwitcher = !showSwitcher" class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-outline-variant/40 bg-surface-container-low hover:bg-surface-variant/40 active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none">
          <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck class="w-[14px] h-[14px]" />
          </div>
          <div class="flex flex-col text-left">
            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">模拟操作身份</span>
            <span class="text-xs font-bold text-on-surface mt-0.5 leading-none">
              {{ appState.simulationMode === 'role' 
                ? (simulatorRoles.find(r => r.val === appState.currentUserRole)?.label || '管理员') 
                : (simulatorUsers.find(u => u.val === appState.currentUser)?.label || '管理员') }}
            </span>
          </div>
          <ChevronDown class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': showSwitcher }" />
        </button>

        <!-- Premium Switcher Dropdown Panel -->
        <div v-show="showSwitcher" class="absolute right-0 mt-2 w-80 bg-white border border-outline-variant/30 rounded-2xl shadow-[0px_16px_36px_rgba(25,28,29,0.12)] p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div class="flex items-center justify-between mb-3.5 border-b border-outline-variant/15 pb-2.5">
            <span class="text-xs font-black text-on-surface flex items-center gap-1.5">
              <IdCard class="w-4 h-4 text-primary" />
              Clearance Simulator
            </span>
            <div class="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
              <button @click="appState.simulationMode = 'role'" 
                      class="px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer"
                      :class="appState.simulationMode === 'role' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'">
                角色
              </button>
              <button @click="appState.simulationMode = 'user'" 
                      class="px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ml-0.5"
                      :class="appState.simulationMode === 'user' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'">
                人员
              </button>
            </div>
          </div>

          <!-- Roles Mode Grid -->
          <div v-if="appState.simulationMode === 'role'" class="flex flex-col gap-1.5">
            <button 
              v-for="role in simulatorRoles" 
              :key="role.val" 
              @click="appState.currentUserRole = role.val; appState.refreshTrigger++; showSwitcher = false"
              class="flex items-center justify-between w-full p-2 rounded-xl text-left border text-xs font-bold transition-all hover:bg-slate-50 cursor-pointer"
              :class="appState.currentUserRole === role.val 
                ? 'bg-primary/5 text-primary border-primary/30 ring-1 ring-primary/10' 
                : 'bg-white border-transparent text-slate-700'"
            >
              <div class="flex items-center gap-2.5">
                <component :is="role.icon" class="w-[18px] h-[18px]" :class="role.color.split(' ')[0]" />
                <span>{{ role.label }}</span>
              </div>
              <span class="text-[9px] px-1.5 py-0.5 rounded font-mono tracking-tighter" 
                    :class="appState.currentUserRole === role.val ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-400'">
                {{ role.code }}
              </span>
            </button>
          </div>

          <!-- Users Mode Grid -->
          <div v-else class="flex flex-col gap-1.5">
            <button 
              v-for="user in simulatorUsers" 
              :key="user.val" 
              @click="appState.currentUser = user.val; appState.refreshTrigger++; showSwitcher = false"
              class="flex items-center justify-between w-full p-2 rounded-xl text-left border text-xs font-bold transition-all hover:bg-slate-50 cursor-pointer"
              :class="appState.currentUser === user.val 
                ? 'bg-primary/5 text-primary border-primary/30 ring-1 ring-primary/10' 
                : 'bg-white border-transparent text-slate-700'"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white" 
                     :class="user.val === 'admin_sys' ? 'bg-rose-500' : 'bg-primary/80'">
                  {{ user.label.substring(0, 1) }}
                </div>
                <div>
                  <div class="font-bold leading-tight">{{ user.label }}</div>
                  <div class="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">{{ user.desc }}</div>
                </div>
              </div>
              <CheckCircle2 class="w-4 h-4 text-primary" v-if="appState.currentUser === user.val" />
            </button>
          </div>
        </div>
      </div>

      <img alt="管理员头像" class="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3GOcIlVbZkTgDXRE5mGiTgMJw2XEyaAdsA5Ik94PkBP0G-19CgFwHQfRDU63v7hc3EOz-J4GkIaPpdsljpchp9VD1y4tQ_625ei0QLbKnpP1rerpudnJgLGqUTBuJiuS0gWmU0BzTFfoeCag7kUFlRcs5teVDl5EC9xIrzrTRCYALio45-G5UOfK8i4M3YZqtY4H-C__bu1WSkSwlf1fKlBRYIxoybgzGak5APYooqfkvLu8bindxQic0QTXvk9U7lRQkSyGNdg" />
    </div>
    <div class="absolute bottom-0 left-0 bg-[#f3f4f5] dark:bg-[#2a2d2e] h-[1px] w-full"></div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { appState } from '../../store/app';
import { modulesState } from '../../store/modules';
import { useRouter, useRoute } from 'vue-router';
import { 
  ChevronRight, 
  Bell, 
  HelpCircle, 
  LayoutGrid, 
  ShieldCheck, 
  ChevronDown, 
  IdCard, 
  CheckCircle2,
  UserCog,
  GraduationCap,
  Landmark,
  Wallet,
  Shield,
  Users,
  User,
  ShieldAlert
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();

const currentBizNo = computed(() => {
  return route.params.id || route.query.bizNo || '';
});

const showSwitcher = ref(false);
const dropdownRef = ref(null);

const simulatorRoles = [
  { val: 'admin', label: '系统管理员', code: 'ADM', icon: UserCog, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { val: 'head_teacher', label: '任课老师', code: 'TEA', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { val: 'academic_admin', label: '教务处', code: 'EDU', icon: Landmark, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { val: 'finance', label: '财务处', code: 'FIN', icon: Wallet, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { val: 'principal', label: '校长', code: 'PRN', icon: Shield, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { val: 'hr_director', label: '人事总监', code: 'DIR', icon: Users, color: 'text-sky-600 bg-sky-50 border-sky-200' }
];

const simulatorUsers = [
  { val: 'admin_sys', label: '系统管理员', desc: '系统预置', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { val: 'alex_zhang', label: '张老师', desc: '数学组骨干教师', icon: User, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { val: 'bella_wang', label: '王教务', desc: '教务处科长', icon: User, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { val: 'charlie_li', label: '李财务', desc: '财务专员', icon: User, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { val: 'david_zhao', label: '赵校长', desc: '学校常务校长', icon: User, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { val: 'emma_sun', label: '孙人事', desc: '人事招聘专家', icon: User, color: 'text-sky-600 bg-sky-50 border-sky-200' }
];

const handleOutsideClick = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showSwitcher.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

const goToModules = () => {
  router.push('/modules');
};

const goToConfig = () => {
  if (modulesState.activeModule) {
    router.push(`/modules/${modulesState.activeModule.id}/config`);
  }
};

const goToPermissions = () => {
  if (modulesState.activeModule) {
    router.push(`/modules/${modulesState.activeModule.id}/permissions`);
  }
};

const goToWorkflowList = () => {
  router.push('/workflow/list');
};

const goToWorkflowDetail = () => {
  if (currentBizNo.value) {
    router.push(`/workflow/${currentBizNo.value}/detail`);
  }
};

const goToWorkflowDesigner = () => {
  if (currentBizNo.value) {
    router.push(`/workflow/designer?bizNo=${currentBizNo.value}`);
  } else {
    router.push('/workflow/designer');
  }
};
</script>
