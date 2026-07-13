<template>
  <section>
    <div class="relative bg-surface-container-low p-10 rounded-2xl flex flex-col items-center overflow-hidden border border-outline-variant/15">
      <!-- Background Grid Pattern for architectural feel -->
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 2px 2px, #005daa 1px, transparent 0); background-size: 24px 24px;"></div>
      
      <!-- Top: Main Entity -->
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_8px_24px_rgba(25,28,29,0.06)] z-10 w-72 border-t-4 border-primary relative mb-8 flex flex-col transition-all hover:shadow-[0px_12px_32px_rgba(25,28,29,0.08)]">
        <div class="flex justify-between items-start mb-3">
          <span class="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">主表 (驱动表)</span>
          <Database class="w-4 h-4 text-outline mt-0.5" />
        </div>
        <h3 class="font-headline text-xl font-bold text-on-surface">{{ primaryEntity.name }}</h3>
        <div class="mt-auto pt-4 border-t border-surface-container mt-4 text-xs text-on-surface-variant">
          {{ primaryEntity.desc }}
        </div>
        
      </div>
      
      <!-- Bottom: Associated Entities Grid -->
      <div class="z-10 w-full flex flex-wrap justify-center gap-x-6 gap-y-12">
        
        <!-- Generated Cards -->
        <div v-for="entity in entities" :key="entity.id" class="relative flex flex-col items-center group w-72 mt-4">
          <!-- Connection Logic Pill -->
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 border border-outline-variant/40 bg-surface px-3 py-1.5 rounded-full text-[11px] font-mono flex items-center shadow-sm whitespace-nowrap z-20 text-on-surface transition-all group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-tertiary/50" title="关联关系由系统自动推断">
            <Sparkles class="w-3 h-3 text-tertiary mr-1.5" />
            <span class="text-tertiary font-medium mr-1">{{ entity.joinCondition?.left || 'id' }}</span>
            <div class="flex flex-col items-center mx-1 px-2 border-x border-outline-variant/20">
              <component :is="entity.relationType === '1:1' ? ArrowLeftRight : (entity.relationType === '1:N' ? GitMerge : GitPullRequest)" class="w-3.5 h-3.5 text-outline" />
              <span class="text-[8px] font-bold opacity-50">{{ entity.relationType || '1:1' }}</span>
            </div>
            <span class="font-medium ml-1 text-on-surface">{{ entity.joinCondition?.right || 'id' }}</span>
          </div>
          
          <!-- Associated Card -->
          <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_16px_rgba(25,28,29,0.04)] w-full h-full border border-outline-variant/15 border-t-4 border-t-tertiary/50 transition-all group-hover:-translate-y-1 group-hover:shadow-[0px_12px_32px_rgba(25,28,29,0.08)] group-hover:border-tertiary/70 flex flex-col">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[11px] font-bold text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-md border border-tertiary/20">关联表</span>
              <div class="flex items-center space-x-2">
                <Link class="w-4 h-4 text-outline" />
                <button v-if="isEditMode" @click="removeEntity(entity.id)" class="text-error/70 hover:text-error hover:bg-error/10 p-1 rounded-full transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 class="font-headline text-xl font-bold text-on-surface">{{ entity.name }}</h3>
            <div class="mt-auto pt-4 border-t border-surface-container mt-4 text-xs text-on-surface-variant">
              {{ entity.desc }}
            </div>
          </div>
        </div>
        
        <!-- Add New Entity Card (Only in edit mode) -->
        <div v-if="isEditMode" class="relative flex flex-col items-center group w-72 mt-4">
          <button @click="showAddModal = true" class="bg-surface-container-lowest/50 p-6 rounded-xl w-full h-full border-2 border-dashed border-outline-variant/40 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center min-h-[160px] text-on-surface-variant hover:text-primary">
            <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-primary/10">
              <Plus class="w-6 h-6" />
            </div>
            <span class="font-bold">添加关联表</span>
            <span class="text-xs opacity-70 mt-2">将新的关联表拼接到当前模块</span>
          </button>
        </div>
        
      </div>

      <!-- Add Entity Modal (Teleport to body for better visibility) -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center">
            <div class="absolute inset-0 bg-[#191c1d]/40 backdrop-blur-sm" @click="showAddModal = false"></div>
            <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-[0px_24px_48px_rgba(0,0,0,0.18)] border border-outline-variant/20 overflow-hidden flex flex-col relative z-10 mx-4">
              <div class="px-6 py-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface">
                <h3 class="font-headline font-bold text-lg text-on-surface flex items-center">
                  <PlusCircle class="mr-2 text-primary w-5 h-5" />
                  添加关联表
                </h3>
                <button @click="showAddModal = false" class="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-full hover:bg-surface-variant/50 flex items-center justify-center">
                  <X class="w-5 h-5" />
                </button>
              </div>
              
              <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-on-surface-variant">物理表名 (实体)</label>
                  <select v-model="newEntity.name" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary transition-colors py-2.5">
                    <option disabled value="">请选择关联的物理表</option>
                    <option v-for="table in availableTables" :key="table.name" :value="table.name">{{ table.name }} ({{ table.desc }})</option>
                  </select>
                </div>



                <div class="space-y-1">
                  <label class="text-xs font-bold text-on-surface-variant">业务描述</label>
                  <input v-model="newEntity.desc" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface py-2.5 px-3" placeholder="如: 记录员工相关信息" />
                </div>
              </div>

              <div class="p-6 bg-surface-container-low/30 border-t border-outline-variant/10 flex justify-end gap-3">
                <button @click="showAddModal = false" class="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-variant/50 rounded-lg">取消</button>
                <button @click="addEntity" class="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { 
  Database, 
  Plus, 
  ArrowLeftRight, 
  GitMerge, 
  GitPullRequest, 
  Link, 
  Trash2, 
  PlusCircle, 
  X,
  Sparkles
} from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { currentConfig, addEntityToCurrentConfig, removeEntityFromCurrentConfig } from '../../../store/modules';
import { tableMap } from '../../../store/metadata';

const primaryEntity = computed(() => currentConfig.value.primaryEntity);
const entities = computed(() => currentConfig.value.entities);

const route = useRoute();
const isEditMode = computed(() => route.query.mode === 'edit');

// Computed properties for dropdowns
const availableTables = computed(() => {
  return Object.keys(tableMap.value).map(key => ({
    name: key,
    desc: tableMap.value[key].desc
  }));
});

const showAddModal = ref(false);
const newEntity = reactive({
  name: '',
  desc: ''
});

// Auto-fill desc when physical table changes
watch(() => newEntity.name, (newVal) => {
  if (newVal && tableMap.value[newVal]) {
    newEntity.desc = tableMap.value[newVal].desc;
  }
});

const addEntity = async () => {
  if (!newEntity.name) return;
  await addEntityToCurrentConfig({
    name: newEntity.name,
    desc: newEntity.desc || '新增拓展关联实体'
  });
  newEntity.name = '';
  newEntity.desc = '';
  showAddModal.value = false;
};

const removeEntity = async (entityId) => {
  await removeEntityFromCurrentConfig(entityId);
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
