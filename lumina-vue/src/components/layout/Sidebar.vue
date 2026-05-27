<template>
  <nav class="bg-[#f3f4f5] dark:bg-[#191c1d] font-inter text-sm h-screen w-64 fixed left-0 top-0 z-40 flex flex-col py-6 px-4 space-y-2 border-r border-transparent">
    <div class="mb-8 px-4 flex flex-col space-y-1">
      <span class="font-manrope font-extrabold tracking-tighter text-[#005daa] text-xl">Lumina Architect</span>
      <span class="text-on-surface-variant text-xs">系统级管理后台</span>
    </div>
    <!-- Left Navigation Section (左侧导航) -->
    <div class="flex-1 space-y-2">
      <!-- 首页 -->
      <router-link to="/" class="flex items-center px-4 py-3 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <Home class="mr-3 w-5 h-5" />
        首页
      </router-link>

      <!-- 模块列表 (Main Navigation, remains active when in child 'config' view) -->
      <router-link to="/modules" :class="[(appState.currentView === 'list' || appState.currentView === 'config' || appState.currentView === 'permissions') ? 'text-[#005daa] bg-surface-container font-bold before:content-[\'\'] before:absolute before:left-0 before:w-1 before:h-6 before:bg-[#005daa] before:rounded-r-full' : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa]']" class="flex items-center px-4 py-3 rounded-xl relative hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <LayoutGrid
          class="mr-3 w-5 h-5 transition-transform"
          :class="{'scale-110': appState.currentView === 'list' || appState.currentView === 'config' || appState.currentView === 'permissions'}"
        />
        模块管理
      </router-link>

      <!-- 审批流引擎 -->
      <router-link to="/workflow" :class="[(appState.currentView === 'workflow-list' || appState.currentView === 'workflow-designer' || appState.currentView === 'workflow-detail') ? 'text-[#005daa] bg-surface-container font-bold before:content-[\'\'] before:absolute before:left-0 before:w-1 before:h-6 before:bg-[#005daa] before:rounded-r-full' : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa]']" class="flex items-center px-4 py-3 rounded-xl relative hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <Workflow
          class="mr-3 w-5 h-5 transition-transform"
          :class="{'scale-110': appState.currentView === 'workflow-list' || appState.currentView === 'workflow-designer' || appState.currentView === 'workflow-detail'}"
        />
        审批流引擎
      </router-link>


      <!-- 设置 -->
      <a class="flex items-center px-4 py-3 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <Settings class="mr-3 w-5 h-5" />
        设置
      </a>
    </div>

    <div class="mt-auto space-y-4">
      <div class="space-y-1">
        <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
          <CircleUser class="mr-3 w-4 h-4" />
          个人中心
        </a>
        <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
          <LogOut class="mr-3 w-4 h-4" />
          安全退出
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { Home, LayoutGrid, Workflow, Settings, CircleUser, LogOut } from 'lucide-vue-next';
import { appState } from '../../store/app';
</script>
