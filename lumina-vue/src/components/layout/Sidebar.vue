<template>
  <nav class="bg-[#f3f4f5] dark:bg-[#191c1d] font-inter text-sm h-screen fixed left-0 top-0 z-40 flex flex-col py-6 border-r border-transparent transition-all duration-300 ease-in-out" :class="appState.sidebarCollapsed ? 'w-16 px-2' : 'w-64 px-4'">
    <!-- Sidebar Header with Brand and Toggle button -->
    <div class="mb-6 flex items-center justify-between" :class="appState.sidebarCollapsed ? 'px-1' : 'px-4'">
      <div v-show="!appState.sidebarCollapsed" class="flex flex-col space-y-1 overflow-hidden transition-all duration-300">
        <span class="font-manrope font-extrabold tracking-tighter text-[#005daa] text-xl whitespace-nowrap">Lumina</span>
        <span class="text-on-surface-variant text-[10px] whitespace-nowrap">系统级管理后台</span>
      </div>
      <button 
        @click="appState.sidebarCollapsed = !appState.sidebarCollapsed"
        class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer flex items-center justify-center"
        :class="appState.sidebarCollapsed ? 'mx-auto w-full' : ''"
        :title="appState.sidebarCollapsed ? '展开菜单' : '折叠菜单'"
      >
        <ChevronRight v-if="appState.sidebarCollapsed" class="w-4 h-4" />
        <ChevronLeft v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Collapsed Mode Flat Icon Menu (Separated into Business and Config) -->
    <div v-if="appState.sidebarCollapsed" class="flex-1 space-y-4 mt-4 overflow-y-auto">
      <!-- 业务类图标 -->
      <div class="space-y-2">
        <router-link 
          v-for="item in businessItems" 
          :key="item.name" 
          :to="item.path" 
          :class="[isMenuItemActive(item) 
            ? 'text-[#005daa] bg-[#005daa]/5 font-bold shadow-sm' 
            : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100']"
          class="flex items-center justify-center w-11 h-11 rounded-xl mx-auto transition-all duration-200 cursor-pointer select-none relative group"
        >
          <component 
            :is="menuIcons[item.meta.icon]" 
            class="w-5 h-5 transition-transform"
            :class="{'scale-110 text-[#005daa]': isMenuItemActive(item)}"
          />
          <!-- CSS Pop Tooltip -->
          <span class="absolute left-14 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md pointer-events-none z-50">
            {{ item.meta.title }}
          </span>
        </router-link>
      </div>

      <!-- 细分割线 -->
      <div class="mx-2 border-t border-slate-200/60"></div>

      <!-- 配置类图标 -->
      <div class="space-y-2">
        <router-link 
          v-for="item in configItems" 
          :key="item.name" 
          :to="item.path" 
          :class="[isMenuItemActive(item) 
            ? 'text-[#005daa] bg-[#005daa]/5 font-bold shadow-sm' 
            : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100']"
          class="flex items-center justify-center w-11 h-11 rounded-xl mx-auto transition-all duration-200 cursor-pointer select-none relative group"
        >
          <component 
            :is="menuIcons[item.meta.icon]" 
            class="w-5 h-5 transition-transform"
            :class="{'scale-110 text-[#005daa]': isMenuItemActive(item)}"
          />
          <!-- CSS Pop Tooltip -->
          <span class="absolute left-14 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md pointer-events-none z-50">
            {{ item.meta.title }}
          </span>
        </router-link>
      </div>
    </div>

    <!-- Expanded Mode Nested Accordion Menu -->
    <div v-else class="flex-1 space-y-2 overflow-y-auto pr-1">
      <!-- 业务类二级菜单 -->
      <div>
        <button 
          @click="businessOpen = !businessOpen"
          class="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[#191c1d] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer select-none"
          :class="businessOpen ? 'font-bold opacity-100' : 'opacity-60'"
        >
          <div class="flex items-center gap-2.5">
            <Briefcase class="w-[18px] h-[18px] text-slate-500" />
            <span class="text-[13px]">业务</span>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': businessOpen }" />
        </button>
        <Transition name="submenu">
          <div v-show="businessOpen" class="ml-3.5 pl-4 border-l border-slate-200/80 space-y-0.5 mt-0.5">
            <router-link 
              v-for="item in businessItems" 
              :key="item.name" 
              :to="item.path" 
              :class="[isMenuItemActive(item) 
                ? 'text-[#005daa] bg-[#005daa]/5 font-bold' 
                : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100']"
              class="flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer select-none text-[13px]"
            >
              <component 
                :is="menuIcons[item.meta.icon]" 
                class="mr-2.5 w-4 h-4 transition-transform"
                :class="{'scale-110 text-[#005daa]': isMenuItemActive(item)}"
              />
              {{ item.meta.title }}
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- 配置类二级菜单 -->
      <div>
        <button 
          @click="configOpen = !configOpen"
          class="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-[#191c1d] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer select-none"
          :class="configOpen ? 'font-bold opacity-100' : 'opacity-60'"
        >
          <div class="flex items-center gap-2.5">
            <Settings2 class="w-[18px] h-[18px] text-slate-500" />
            <span class="text-[13px]">配置</span>
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': configOpen }" />
        </button>
        <Transition name="submenu">
          <div v-show="configOpen" class="ml-3.5 pl-4 border-l border-slate-200/80 space-y-0.5 mt-0.5">
            <router-link 
              v-for="item in configItems" 
              :key="item.name" 
              :to="item.path" 
              :class="[isMenuItemActive(item) 
                ? 'text-[#005daa] bg-[#005daa]/5 font-bold' 
                : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100']"
              class="flex items-center px-3 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer select-none text-[13px]"
            >
              <component 
                :is="menuIcons[item.meta.icon]" 
                class="mr-2.5 w-4 h-4 transition-transform"
                :class="{'scale-110 text-[#005daa]': isMenuItemActive(item)}"
              />
              {{ item.meta.title }}
            </router-link>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Bottom Actions Area -->
    <div class="mt-auto space-y-2" :class="appState.sidebarCollapsed ? 'pt-4 border-t border-slate-200/50' : ''">
      <template v-if="appState.sidebarCollapsed">
        <a class="flex items-center justify-center w-11 h-11 rounded-xl mx-auto text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none relative group">
          <Settings class="w-5 h-5 text-slate-500" />
          <span class="absolute left-14 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md pointer-events-none z-50">设置</span>
        </a>
        <a class="flex items-center justify-center w-11 h-11 rounded-xl mx-auto text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none relative group">
          <CircleUser class="w-5 h-5 text-slate-500" />
          <span class="absolute left-14 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md pointer-events-none z-50">个人中心</span>
        </a>
        <a class="flex items-center justify-center w-11 h-11 rounded-xl mx-auto text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none relative group">
          <LogOut class="w-5 h-5 text-slate-500" />
          <span class="absolute left-14 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-md pointer-events-none z-50">安全退出</span>
        </a>
      </template>
      <template v-else>
        <div class="space-y-1">
          <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
            <Settings class="mr-3 w-4 h-4 text-slate-500" />
            设置
          </a>
          <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
            <CircleUser class="mr-3 w-4 h-4 text-slate-500" />
            个人中心
          </a>
          <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
            <LogOut class="mr-3 w-4 h-4 text-slate-500" />
            安全退出
          </a>
        </div>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { 
  LayoutGrid, Workflow, Settings, Settings2, CircleUser, LogOut, Database, 
  PenTool, ShieldAlert, GitFork, ChevronDown, Briefcase, ChevronLeft, ChevronRight 
} from 'lucide-vue-next';
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { appState } from '../../store/app';

const router = useRouter();
const route = useRoute();

const businessOpen = ref(true);
const configOpen = ref(true);

const menuIcons = {
  LayoutGrid,
  Workflow,
  Database,
  PenTool,
  ShieldAlert,
  GitFork
};

const sidebarMenuItems = computed(() => {
  return router.options.routes.filter(r => r.meta && r.meta.sidebar);
});

const businessItems = computed(() => {
  return sidebarMenuItems.value.filter(r => r.meta.group === 'business');
});

const configItems = computed(() => {
  return sidebarMenuItems.value.filter(r => r.meta.group === 'config');
});

const isMenuItemActive = (item) => {
  if (item.name === 'modules') {
    return ['list', 'config', 'permissions'].includes(appState.currentView);
  }
  if (item.name === 'data-center') {
    return appState.currentView === 'data-center';
  }
  if (item.name === 'workflow-list') {
    return ['workflow-list', 'workflow-detail'].includes(appState.currentView);
  }
  if (item.name === 'workflow-designer') {
    return appState.currentView === 'workflow-designer';
  }
  if (item.name === 'diagram') {
    return appState.currentView === 'diagram';
  }
  if (item.name === 'permissions') {
    return appState.currentView === 'permissions';
  }
  return route.path.startsWith(item.path);
};

// Auto-expand the group containing the active route
watch(() => route.path, () => {
  if (businessItems.value.some(item => isMenuItemActive(item))) {
    businessOpen.value = true;
  }
  if (configItems.value.some(item => isMenuItemActive(item))) {
    configOpen.value = true;
  }
}, { immediate: true });

// Force expand all submenus when expanding the sidebar
watch(() => appState.sidebarCollapsed, (isCollapsed) => {
  if (!isCollapsed) {
    businessOpen.value = true;
    configOpen.value = true;
  }
});
</script>

<style scoped>
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}
.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>
