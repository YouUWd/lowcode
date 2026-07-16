<template>
  <div class="p-8 space-y-6 w-full font-inter animate-in fade-in duration-300">
    <!-- Dynamic Content Area -->
    <div>
      <!-- List Mode -->
      <DynamicTable 
        v-if="viewMode === 'list'"
        :moduleId="selectedModuleId" 
        :modulesList="modulesList"
        :activeRole="appState.currentUserRole"
        @update:moduleId="selectedModuleId = $event"
        @create="handleCreate"
        @edit="handleEdit"
        @delete-success="handleDeleteSuccess"
      />

      <!-- Form Mode (inline, no modal) -->
      <div v-else class="space-y-4">
        <button 
          @click="backToList"
          class="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer group"
        >
          <ArrowLeft class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          返回列表
        </button>
        <DynamicForm 
          :moduleId="selectedModuleId"
          :recordId="editingRecordId"
          :activeRole="appState.currentUserRole"
          @save-success="handleSaveSuccess"
          @cancel="backToList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Database, ArrowLeft } from 'lucide-vue-next';
import DynamicTable from '../../components/lowcode/DynamicTable.vue';
import DynamicForm from '../../components/lowcode/DynamicForm.vue';
import { modulesState, fetchModules } from '../../store/modules';
import { appState } from '../../store/app';

const selectedModuleId = ref('Order');
const viewMode = ref('list'); // 'list' | 'form'
const editingRecordId = ref(null);

const modulesList = ref([]);

const loadModules = async () => {
  await fetchModules();
  modulesList.value = modulesState.list || [];
};

const handleCreate = () => {
  editingRecordId.value = null;
  viewMode.value = 'form';
};

const handleEdit = (id) => {
  editingRecordId.value = id;
  viewMode.value = 'form';
};

const handleSaveSuccess = () => {
  backToList();
};

const handleDeleteSuccess = () => {
  editingRecordId.value = null;
};

const backToList = () => {
  viewMode.value = 'list';
  editingRecordId.value = null;
};

onMounted(() => {
  loadModules();
});
</script>

<style scoped>
</style>
