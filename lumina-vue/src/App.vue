<template>
  <Sidebar />
  <main class="ml-64 flex-1 flex flex-col h-screen overflow-y-auto bg-surface relative">
    <Header />
    <router-view v-slot="{ Component }">
      <Transition name="fade-page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </main>
</template>

<script setup>
import { onMounted } from 'vue';
import Sidebar from './components/layout/Sidebar.vue';
import Header from './components/layout/Header.vue';
import { fetchModules } from './store/modules';
import { loadDatabaseSchema } from './store/metadata';

onMounted(() => {
  console.log('[App] Initializing modular stores...');
  fetchModules();
  loadDatabaseSchema();
});
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
