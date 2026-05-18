<template>
  <Sidebar />
  <main class="ml-64 flex-1 flex flex-col h-screen overflow-y-auto bg-surface relative">
    <Header />
    <Transition name="fade-page" mode="out-in">
      <ModuleList v-if="state.currentView === 'list'" />
      <ModuleConfig v-else-if="state.currentView === 'config'" />
      <ModulePermissions v-else-if="state.currentView === 'permissions'" />
      <WorkflowPanel v-else-if="state.currentView === 'workflow'" />
    </Transition>
  </main>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import ModuleList from './components/ModuleList.vue';
import ModuleConfig from './components/ModuleConfig.vue';
import ModulePermissions from './components/ModulePermissions.vue';
import WorkflowPanel from './components/WorkflowPanel.vue';
import { state } from './store/mockStore';
</script>

<style>
/* Page transition effects */
.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
