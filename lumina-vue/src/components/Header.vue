<template>
  <header class="bg-[#ffffff] dark:bg-[#191c1d] font-manrope text-sm font-medium tracking-tight flex justify-between items-center px-8 h-16 w-full shrink-0 z-30 shadow-[0px_4px_16px_rgba(25,28,29,0.02)] relative">
    <div class="flex items-center text-on-surface-variant">
      <!-- 动态面包屑导航 -->
      <div v-if="state.currentView === 'list'" class="flex items-center">
        <span class="font-semibold text-on-surface">模块管理</span>
        <span class="ml-3 px-3 border-l border-outline-variant/40 text-xs font-semibold text-on-surface-variant/80">配置、监控及优化您的企业级架构模块</span>
      </div>
      
      <div v-else-if="state.currentView === 'config' || state.currentView === 'permissions'" class="flex items-center">
        <span @click="updateView('list')" class="font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-1 -ml-2 rounded-lg hover:bg-primary/5">模块管理</span>
        <span class="material-symbols-outlined text-[18px] text-outline-variant mx-1">chevron_right</span>
        
        <!-- 模块名称 + 快速视图切换器 -->
        <div class="flex items-center bg-surface-container-high p-1 rounded-xl border border-outline-variant/20">
          <span class="font-semibold text-on-surface px-3 py-1">{{ state.activeModule?.name || '员工管理' }}</span>
          <div class="w-px h-4 bg-outline-variant/40 mx-1"></div>
          <button @click="updateView('config', state.activeModule)" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all"
                  :class="state.currentView === 'config' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            配置
          </button>
          <button @click="updateView('permissions', state.activeModule)" 
                  class="px-3 py-1 text-xs font-bold rounded-lg transition-all ml-1"
                  :class="state.currentView === 'permissions' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'">
            权限
          </button>
        </div>

        <span class="ml-4 px-3 border-l border-outline-variant/40 text-xs font-semibold text-on-surface-variant/80">
          {{ state.currentView === 'config' ? '定义主副实体关系及 UI 表现层字段映射规则' : '配置物理字段的细粒度安全访问控制节点 (CLS)' }}
        </span>
      </div>
    </div>
    
    <div class="flex items-center space-x-4 text-[#005daa] dark:text-[#0075d5]">
      <button class="hover:bg-primary/10 rounded-full transition-colors duration-200 active:scale-95 p-1.5 flex items-center justify-center">
        <span class="material-symbols-outlined text-xl">notifications</span>
      </button>
      <button class="hover:bg-primary/10 rounded-full transition-colors duration-200 active:scale-95 p-1.5 flex items-center justify-center">
        <span class="material-symbols-outlined text-xl">help_outline</span>
      </button>
      <button class="hover:bg-primary/10 rounded-full transition-colors duration-200 active:scale-95 p-1.5 flex items-center justify-center">
        <span class="material-symbols-outlined text-xl">apps</span>
      </button>
      <div class="h-6 w-px bg-outline-variant/30 mx-1"></div>
      <img alt="管理员头像" class="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3GOcIlVbZkTgDXRE5mGiTgMJw2XEyaAdsA5Ik94PkBP0G-19CgFwHQfRDU63v7hc3EOz-J4GkIaPpdsljpchp9VD1y4tQ_625ei0QLbKnpP1rerpudnJgLGqUTBuJiuS0gWmU0BzTFfoeCag7kUFlRcs5teVDl5EC9xIrzrTRCYALio45-G5UOfK8i4M3YZqtY4H-C__bu1WSkSwlf1fKlBRYIxoybgzGak5APYooqfkvLu8bindxQic0QTXvk9U7lRQkSyGNdg" />
    </div>
    <div class="absolute bottom-0 left-0 bg-[#f3f4f5] dark:bg-[#2a2d2e] h-[1px] w-full"></div>
  </header>
</template>

<script setup>
import { state, updateView } from '../store/mockStore';
</script>
