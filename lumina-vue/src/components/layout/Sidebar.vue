<template>
  <nav
    class="bg-[#f3f4f5] dark:bg-[#191c1d] font-inter text-sm h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-slate-200/60 dark:border-slate-700/50 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] select-none"
    :class="appState.sidebarCollapsed ? 'w-16' : 'w-52'"
  >
    <!-- Inner container: adapting to outer nav width -->
    <div class="flex flex-col h-full w-full py-5">

      <!-- ── Brand & Toggle Button ── -->
      <div
        class="mb-5 flex transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        :class="appState.sidebarCollapsed ? 'flex-col items-center gap-3 px-0' : 'flex-row items-center justify-between px-5'"
      >
        <!-- Collapsed Mode Header -->
        <template v-if="appState.sidebarCollapsed">
          <!-- Toggle Button for Collapsed Mode -->
          <div class="relative group flex justify-center w-full">
            <button
              @click="appState.sidebarCollapsed = !appState.sidebarCollapsed"
              class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all duration-150 cursor-pointer flex-shrink-0"
            >
              <PanelLeft class="w-[18px] h-[18px]" />
            </button>
            <!-- Tooltip -->
            <span class="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:left-13 transition-all duration-150">
              展开菜单
            </span>
          </div>
          
          <!-- Logo 'L' -->
          <div class="w-8 h-8 rounded-lg bg-[#005daa]/10 flex items-center justify-center flex-shrink-0">
            <span class="font-manrope font-extrabold text-[#005daa] text-sm">L</span>
          </div>
        </template>

        <!-- Expanded Mode Header -->
        <template v-else>
          <div class="flex flex-col space-y-0.5 overflow-hidden">
            <span class="font-manrope font-extrabold tracking-tighter text-[#005daa] text-xl whitespace-nowrap">Lumina</span>
            <span class="text-on-surface-variant text-[10px] whitespace-nowrap">系统级管理后台</span>
          </div>
          <!-- Toggle Button for Expanded Mode -->
          <div class="relative group">
            <button
              @click="appState.sidebarCollapsed = !appState.sidebarCollapsed"
              class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all duration-150 cursor-pointer flex-shrink-0"
            >
              <PanelLeftClose class="w-[18px] h-[18px]" />
            </button>
            <!-- Tooltip -->
            <span class="pointer-events-none absolute right-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:right-13 transition-all duration-150">
              折叠菜单
            </span>
          </div>
        </template>
      </div>

      <!-- ── Menu area (Unified layout using contents property to ensure pixel-perfect alignment) ── -->
      <div 
        class="flex-1 px-3 space-y-1.5 select-none transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col"
        :class="appState.sidebarCollapsed ? 'overflow-visible !px-0 items-center gap-1.5' : 'overflow-y-auto items-stretch'"
      >
        <!-- 业务 group -->
        <div :class="appState.sidebarCollapsed ? 'contents' : 'flex flex-col'">
          <!-- Accordion Header for Group: Business -->
          <button
            v-show="!appState.sidebarCollapsed"
            @click="businessOpen = !businessOpen"
            class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[#191c1d] hover:bg-slate-200/50 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer select-none h-10 mb-0.5"
            :class="businessOpen ? 'font-semibold opacity-100' : 'opacity-50'"
          >
            <div class="flex items-center gap-2">
              <Briefcase class="w-4 h-4 text-slate-400" />
              <span class="text-[12px] tracking-wide uppercase font-bold text-slate-400">业务</span>
            </div>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': businessOpen }" />
          </button>

          <!-- Items list -->
          <div 
            v-show="appState.sidebarCollapsed || businessOpen"
            :class="appState.sidebarCollapsed ? 'contents' : 'space-y-0.5 flex flex-col'"
          >
            <router-link
              v-for="item in businessItems"
              :key="item.name"
              :to="item.path"
              :class="[
                isMenuItemActive(item)
                  ? 'text-[#005daa] bg-[#005daa]/8 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
                appState.sidebarCollapsed
                  ? 'w-10 h-10 justify-center rounded-xl p-0'
                  : 'w-full pl-8 pr-3 py-2 rounded-lg justify-start text-[13px]'
              ]"
              class="relative group flex items-center transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer select-none"
            >
              <component
                :is="menuIcons[item.meta.icon]"
                class="flex-shrink-0 transition-all duration-200"
                :class="[
                  isMenuItemActive(item) ? 'text-[#005daa]' : 'text-slate-400',
                  appState.sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'
                ]"
              />
              
              <!-- Label Text -->
              <span 
                v-if="!appState.sidebarCollapsed"
                class="transition-all duration-200 whitespace-nowrap overflow-hidden text-left ml-2.5"
              >
                {{ item.meta.title }}
              </span>

              <!-- Claude-like Tooltip -->
              <span 
                v-if="appState.sidebarCollapsed"
                class="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:left-13 transition-all duration-150"
              >
                {{ item.meta.title }}
              </span>
            </router-link>
          </div>
        </div>

        <!-- Collapsed state simple line separator between groups -->
        <div 
          class="w-8 border-t border-slate-200/70 dark:border-slate-700/50 my-1 transition-all duration-200"
          :class="appState.sidebarCollapsed ? 'opacity-100 h-px my-1.5' : 'opacity-0 h-0 overflow-hidden pointer-events-none'"
        ></div>

        <!-- 配置 group -->
        <div :class="appState.sidebarCollapsed ? 'contents' : 'flex flex-col pt-1'">
          <!-- Accordion Header for Group: Config -->
          <button
            v-show="!appState.sidebarCollapsed"
            @click="configOpen = !configOpen"
            class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[#191c1d] hover:bg-slate-200/50 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer select-none h-10 mb-0.5"
            :class="configOpen ? 'font-semibold opacity-100' : 'opacity-50'"
          >
            <div class="flex items-center gap-2">
              <Settings2 class="w-4 h-4 text-slate-400" />
              <span class="text-[12px] tracking-wide uppercase font-bold text-slate-400">配置</span>
            </div>
            <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': configOpen }" />
          </button>
          
          <!-- Items list -->
          <div 
            v-show="appState.sidebarCollapsed || configOpen"
            :class="appState.sidebarCollapsed ? 'contents' : 'space-y-0.5 flex flex-col'"
          >
            <router-link
              v-for="item in configItems"
              :key="item.name"
              :to="item.path"
              :class="[
                isMenuItemActive(item)
                  ? 'text-[#005daa] bg-[#005daa]/8 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
                appState.sidebarCollapsed
                  ? 'w-10 h-10 justify-center rounded-xl p-0'
                  : 'w-full pl-8 pr-3 py-2 rounded-lg justify-start text-[13px]'
              ]"
              class="relative group flex items-center transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer select-none"
            >
              <component
                :is="menuIcons[item.meta.icon]"
                class="flex-shrink-0 transition-all duration-200"
                :class="[
                  isMenuItemActive(item) ? 'text-[#005daa]' : 'text-slate-400',
                  appState.sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'
                ]"
              />
              
              <!-- Label Text -->
              <span 
                v-if="!appState.sidebarCollapsed"
                class="transition-all duration-200 whitespace-nowrap overflow-hidden text-left ml-2.5"
              >
                {{ item.meta.title }}
              </span>

              <!-- Claude-like Tooltip -->
              <span 
                v-if="appState.sidebarCollapsed"
                class="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:left-13 transition-all duration-150"
              >
                {{ item.meta.title }}
              </span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- ── Bottom actions ── -->
      <div
        class="mt-auto border-t border-slate-200/60 pt-3 transition-all duration-200"
        :class="appState.sidebarCollapsed ? 'px-2 flex flex-col items-center gap-1' : 'px-3 space-y-0.5'"
      >
        <!-- Collapsed bottom icons -->
        <template v-if="appState.sidebarCollapsed">
          <button
            v-for="btn in bottomActions"
            :key="btn.label"
            class="relative group w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all duration-150 cursor-pointer"
          >
            <component :is="btn.icon" class="w-[18px] h-[18px]" />
            <!-- Claude-like Tooltip -->
            <span class="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:left-13 transition-all duration-150">
              {{ btn.label }}
            </span>
          </button>
        </template>

        <!-- Expanded bottom items -->
        <template v-else>
          <button
            v-for="btn in bottomActions"
            :key="btn.label"
            class="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-all duration-150 cursor-pointer text-[13px]"
          >
            <component :is="btn.icon" class="w-4 h-4 text-slate-400" />
            {{ btn.label }}
          </button>
        </template>
      </div>

    </div><!-- /inner wrapper -->
  </nav>
</template>

<script setup>
import {
  LayoutGrid, Workflow, Settings, Settings2, CircleUser, LogOut, Database,
  PenTool, ShieldAlert, TableProperties, ChevronDown, Briefcase, PanelLeft, PanelLeftClose
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
  TableProperties
};

const bottomActions = [
  { label: '设置', icon: Settings },
  { label: '个人中心', icon: CircleUser },
  { label: '安全退出', icon: LogOut },
];

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
  if (item.name === 'data') {
    return appState.currentView === 'data';
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
/* Expandable sub-list transitions */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
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
