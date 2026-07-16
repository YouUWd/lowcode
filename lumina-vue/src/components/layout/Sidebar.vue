<template>
  <nav
    class="bg-[#f3f4f5] dark:bg-[#191c1d] font-inter text-sm h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-slate-200/60 dark:border-slate-700/50 transition-all duration-300 ease-in-out"
    :class="appState.sidebarCollapsed ? 'w-16' : 'w-64'"
  >
    <!-- Inner container: adapting to outer nav width -->
    <div class="flex flex-col h-full w-full py-5">

      <!-- ── Brand & Toggle Button ── -->
      <div
        class="mb-5 flex transition-all duration-300"
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
            <!-- Claude-like Tooltip -->
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
            <!-- Claude-like Tooltip -->
            <span class="pointer-events-none absolute right-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:right-13 transition-all duration-150">
              折叠菜单
            </span>
          </div>
        </template>
      </div>

      <!-- ── Menu area ── -->
      <div 
        class="flex-1"
        :class="appState.sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto'"
      >

        <!-- ══ COLLAPSED: icon rail ══ -->
        <div v-if="appState.sidebarCollapsed" class="flex flex-col items-center gap-1 px-2 pt-1">
          <!-- divider label: business -->
          <div class="w-full my-1 border-t border-slate-200/70"></div>

          <router-link
            v-for="item in businessItems"
            :key="item.name"
            :to="item.path"
            :class="[isMenuItemActive(item)
              ? 'text-[#005daa] bg-[#005daa]/8'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60']"
            class="relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
          >
            <component
              :is="menuIcons[item.meta.icon]"
              class="w-[18px] h-[18px] flex-shrink-0"
            />
            <!-- Claude-like Tooltip -->
            <span class="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:left-13 transition-all duration-150">
              {{ item.meta.title }}
            </span>
          </router-link>

          <!-- divider: config -->
          <div class="w-full my-1 border-t border-slate-200/70"></div>

          <router-link
            v-for="item in configItems"
            :key="item.name"
            :to="item.path"
            :class="[isMenuItemActive(item)
              ? 'text-[#005daa] bg-[#005daa]/8'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700/60']"
            class="relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
          >
            <component
              :is="menuIcons[item.meta.icon]"
              class="w-[18px] h-[18px] flex-shrink-0"
            />
            <!-- Claude-like Tooltip -->
            <span class="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-hover:left-13 transition-all duration-150">
              {{ item.meta.title }}
            </span>
          </router-link>
        </div>

        <!-- ══ EXPANDED: accordion menu ══ -->
        <div v-else class="space-y-1 px-3">
          <!-- 业务 group -->
          <div>
            <button
              @click="businessOpen = !businessOpen"
              class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[#191c1d] hover:bg-slate-200/50 transition-colors duration-150 cursor-pointer select-none"
              :class="businessOpen ? 'font-semibold opacity-100' : 'opacity-50'"
            >
              <div class="flex items-center gap-2">
                <Briefcase class="w-4 h-4 text-slate-400" />
                <span class="text-[12px] tracking-wide uppercase font-bold text-slate-400">业务</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': businessOpen }" />
            </button>
            <Transition name="submenu">
              <div v-show="businessOpen" class="mt-0.5 space-y-0.5">
                <router-link
                  v-for="item in businessItems"
                  :key="item.name"
                  :to="item.path"
                  :class="[isMenuItemActive(item)
                    ? 'text-[#005daa] bg-[#005daa]/8 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50']"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer select-none text-[13px]"
                >
                  <component
                    :is="menuIcons[item.meta.icon]"
                    class="w-4 h-4 flex-shrink-0"
                    :class="isMenuItemActive(item) ? 'text-[#005daa]' : 'text-slate-400'"
                  />
                  {{ item.meta.title }}
                </router-link>
              </div>
            </Transition>
          </div>

          <!-- 配置 group -->
          <div class="pt-1">
            <button
              @click="configOpen = !configOpen"
              class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[#191c1d] hover:bg-slate-200/50 transition-colors duration-150 cursor-pointer select-none"
              :class="configOpen ? 'font-semibold opacity-100' : 'opacity-50'"
            >
              <div class="flex items-center gap-2">
                <Settings2 class="w-4 h-4 text-slate-400" />
                <span class="text-[12px] tracking-wide uppercase font-bold text-slate-400">配置</span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': configOpen }" />
            </button>
            <Transition name="submenu">
              <div v-show="configOpen" class="mt-0.5 space-y-0.5">
                <router-link
                  v-for="item in configItems"
                  :key="item.name"
                  :to="item.path"
                  :class="[isMenuItemActive(item)
                    ? 'text-[#005daa] bg-[#005daa]/8 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50']"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer select-none text-[13px]"
                >
                  <component
                    :is="menuIcons[item.meta.icon]"
                    class="w-4 h-4 flex-shrink-0"
                    :class="isMenuItemActive(item) ? 'text-[#005daa]' : 'text-slate-400'"
                  />
                  {{ item.meta.title }}
                </router-link>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- ── Bottom actions ── -->
      <div
        class="mt-auto border-t border-slate-200/60 pt-3 transition-all duration-300"
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
  PenTool, ShieldAlert, GitFork, ChevronDown, Briefcase, PanelLeft, PanelLeftClose
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
