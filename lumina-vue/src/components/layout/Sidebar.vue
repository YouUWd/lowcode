<template>
  <nav class="bg-[#f3f4f5] dark:bg-[#191c1d] font-inter text-sm h-screen w-64 fixed left-0 top-0 z-40 flex flex-col py-6 px-4 space-y-2 border-r border-transparent">
    <div class="mb-8 px-4 flex flex-col space-y-1">
      <span class="font-manrope font-extrabold tracking-tighter text-[#005daa] text-xl">Lumina Architect</span>
      <span class="text-on-surface-variant text-xs">系统级管理后台</span>
    </div>
    
    <div class="flex-1 space-y-2">
      <!-- 首页 -->
      <router-link to="/" class="flex items-center px-4 py-3 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <span class="material-symbols-outlined mr-3">home</span>
        首页
      </router-link>

      <!-- 模块列表 (Main Navigation, remains active when in child 'config' view) -->
      <router-link to="/modules" :class="[(appState.currentView === 'list' || appState.currentView === 'config' || appState.currentView === 'permissions') ? 'text-[#005daa] bg-surface-container font-bold before:content-[\'\'] before:absolute before:left-0 before:w-1 before:h-6 before:bg-[#005daa] before:rounded-r-full' : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa]']" class="flex items-center px-4 py-3 rounded-xl relative hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <span class="material-symbols-outlined mr-3 transition-transform" :class="{'scale-110': appState.currentView === 'list' || appState.currentView === 'config' || appState.currentView === 'permissions'}" :style="(appState.currentView === 'list' || appState.currentView === 'config' || appState.currentView === 'permissions') ? 'font-variation-settings: \'FILL\' 1;' : ''">view_module</span>
        模块管理
      </router-link>

      <!-- 审批流引擎 -->
      <router-link to="/workflow" :class="[appState.currentView === 'workflow' ? 'text-[#005daa] bg-surface-container font-bold before:content-[\'\'] before:absolute before:left-0 before:w-1 before:h-6 before:bg-[#005daa] before:rounded-r-full' : 'text-[#191c1d] opacity-60 hover:bg-[#f8f9fa]']" class="flex items-center px-4 py-3 rounded-xl relative hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <span class="material-symbols-outlined mr-3 transition-transform" :class="{'scale-110': appState.currentView === 'workflow'}" :style="appState.currentView === 'workflow' ? 'font-variation-settings: \'FILL\' 1;' : ''">account_tree</span>
        审批流引擎
      </router-link>


      <!-- 设置 -->
      <a class="flex items-center px-4 py-3 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors duration-300 ease-in-out cursor-pointer select-none">
        <span class="material-symbols-outlined mr-3">settings</span>
        设置
      </a>
    </div>

    <div class="mt-auto space-y-4">
      <div class="space-y-1">
        <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
          <span class="material-symbols-outlined mr-3 text-sm">account_circle</span>
          个人中心
        </a>
        <a class="flex items-center px-4 py-2 rounded-xl text-[#191c1d] opacity-60 hover:bg-[#f8f9fa] hover:opacity-100 transition-colors cursor-pointer select-none">
          <span class="material-symbols-outlined mr-3 text-sm">logout</span>
          安全退出
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { appState } from '../../store/app';
</script>
