<template>
  <el-container class="app-shell">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="22" color="#60a5fa"><Grid /></el-icon>
        <span class="logo-text">低代码平台原型</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="side-menu"
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item index="/designer">
          <el-icon><SetUp /></el-icon>
          <span>模块设计器</span>
        </el-menu-item>
        <el-menu-item index="/engine">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据引擎</span>
        </el-menu-item>
        <el-menu-item index="/permission">
          <el-icon><Lock /></el-icon>
          <span>字段权限配置</span>
        </el-menu-item>
        <el-menu-item index="/schema">
          <el-icon><Connection /></el-icon>
          <span>ER 图管理</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer mono">Mock API · v1.0</div>
    </el-aside>

    <el-container>
      <el-header class="topbar" height="52px">
        <span class="topbar-title">{{ pageTitle }}</span>
        <el-tag size="small" type="info" effect="plain">模块: order（订单模块）</el-tag>
      </el-header>
      <el-main class="main-area">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) ?? '低代码平台')
</script>

<style scoped>
.app-shell {
  height: 100%;
}
.sidebar {
  background: var(--lc-sidebar-bg);
  display: flex;
  flex-direction: column;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}
.side-menu {
  border-right: none;
  flex: 1;
}
.side-menu .el-menu-item.is-active {
  background: rgba(37, 99, 235, 0.35);
  border-right: 3px solid #60a5fa;
}
.sidebar-footer {
  padding: 14px 20px;
  color: #64748b;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--lc-border);
}
.topbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
.main-area {
  padding: 16px;
  overflow: auto;
}
</style>
