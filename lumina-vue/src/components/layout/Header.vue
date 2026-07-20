<template>
  <header class="bg-[#ffffff] dark:bg-[#191c1d] font-manrope text-sm font-medium tracking-tight flex justify-between items-center px-8 h-14 w-full shrink-0 z-30 shadow-[0px_4px_16px_rgba(25,28,29,0.02)] relative">
    <div class="flex items-center">
      <!-- 极简单行面包屑 -->
      <div v-if="route.meta" class="flex items-center gap-1.5 select-none">
        <!-- 一级菜单：粗体深色 -->
        <span class="text-[14px] text-slate-800 dark:text-slate-200 font-bold">
          {{ route.meta.group === 'business' ? '业务' : '配置' }}
        </span>
        <ChevronRight class="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
        <!-- 二级菜单：常规/中等字体 -->
        <span class="text-[14px] text-slate-600 dark:text-slate-300 font-medium">
          {{ route.meta.title }}
        </span>
        <!-- 页面介绍说明 (12px 细体清晰呈现) -->
        <span 
          v-if="route.meta.breadcrumb?.description" 
          class="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none pl-2 border-l border-slate-200 dark:border-slate-800 ml-1.5 mt-0.5"
        >
          {{ route.meta.breadcrumb.description }}
        </span>
      </div>
    </div>
    
    <!-- 右侧动作功能区 (文字与图标主次对齐) -->
    <div class="flex items-center space-x-3.5">
      <!-- 辅助功能图标 (收缩尺寸为标准 w-4/16px 且淡化颜色，主次分明) -->
      <button class="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 active:scale-95 p-1.5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer">
        <Bell class="w-4 h-4" />
      </button>
      <button class="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 active:scale-95 p-1.5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer">
        <HelpCircle class="w-4 h-4" />
      </button>
      <button class="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 active:scale-95 p-1.5 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer">
        <LayoutGrid class="w-4 h-4" />
      </button>
      <div class="h-5 w-px bg-slate-200/80 dark:bg-slate-800/80 mx-1"></div>
      
      <!-- Premium Identity Switcher (Rounded-lg, single-line cloud style switcher) -->
      <div ref="dropdownRef" class="relative">
        <button 
          @click="showSwitcher = !showSwitcher" 
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100/80 active:scale-[0.98] transition-all cursor-pointer shadow-sm select-none"
        >
          <!-- Active Pulse Simulator Indicator Dot -->
          <span class="relative flex h-2 w-2 flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            {{ appState.simulationMode === 'role' 
              ? (simulatorRoles.find(r => r.val === appState.currentUserRole)?.label || '管理员') 
              : (simulatorUsers.find(u => u.val === appState.currentUser)?.label || '管理员') }}
          </span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ml-0.5" :class="{ 'rotate-180': showSwitcher }" />
        </button>

        <!-- Switcher Dropdown Panel -->
        <div v-show="showSwitcher" class="absolute right-0 mt-2 w-80 bg-white border border-outline-variant/30 rounded-2xl shadow-[0px_16px_36px_rgba(25,28,29,0.12)] p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div class="flex items-center justify-between mb-3.5 border-b border-outline-variant/15 pb-2.5">
            <span class="text-xs font-black text-on-surface flex items-center gap-1.5">
              <IdCard class="w-4 h-4 text-primary" />
              模拟操作身份
            </span>
            <div class="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
              <button @click="appState.simulationMode = 'role'; appState.refreshTrigger++" 
                      class="px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer"
                      :class="appState.simulationMode === 'role' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'">
                角色
              </button>
              <button @click="appState.simulationMode = 'user'; appState.refreshTrigger++" 
                      class="px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ml-0.5"
                      :class="appState.simulationMode === 'user' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'">
                人员
              </button>
            </div>
          </div>

          <!-- Roles Grid -->
          <div v-if="appState.simulationMode === 'role'" class="flex flex-col gap-1.5">
            <button 
              v-for="role in simulatorRoles" 
              :key="role.val" 
              @click="onSelectRole(role.val)"
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

          <!-- Users Grid -->
          <div v-else class="flex flex-col gap-1.5">
            <button 
              v-for="user in simulatorUsers" 
              :key="user.val" 
              @click="onSelectUser(user.val)"
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

      <!-- 用户微缩头像 (28px) -->
      <img alt="管理员头像" class="w-7 h-7 rounded-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all object-cover bg-slate-100" src="https://api.dicebear.com/9.x/bottts/svg?seed=TechAdmin&backgroundColor=f1f5f9" />
    </div>
    <div class="absolute bottom-0 left-0 bg-[#f3f4f5] dark:bg-[#2a2d2e] h-[1px] w-full"></div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { appState, selectRole, selectUser } from '../../store/app';
import { modulesState } from '../../store/modules';
import { useRouter, useRoute } from 'vue-router';
import { 
  ChevronRight, 
  Bell, 
  HelpCircle, 
  LayoutGrid, 
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

// 判断是否为工作流相关路由
const isWorkflow = computed(() => {
  return route.path.startsWith('/workflow');
});

// 父层级面包屑跳转
const navigateTo = (routeName) => {
  router.push({ name: routeName });
};

const onSelectRole = (val) => {
  selectRole(val);
  showSwitcher.value = false;
};

const onSelectUser = (val) => {
  selectUser(val);
  showSwitcher.value = false;
};

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
</script>
