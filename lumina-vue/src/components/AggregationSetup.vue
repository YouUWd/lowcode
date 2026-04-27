<template>
  <section>
    <div class="relative bg-surface-container-low p-10 rounded-2xl flex flex-col items-center overflow-hidden border border-outline-variant/15">
      <!-- Background Grid Pattern for architectural feel -->
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 2px 2px, #005daa 1px, transparent 0); background-size: 24px 24px;"></div>
      
      <!-- Top: Main Entity -->
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_8px_24px_rgba(25,28,29,0.06)] z-10 w-80 border-t-4 border-primary relative mb-8 flex flex-col">
        <div class="flex justify-between items-start mb-4">
          <span class="text-xs font-bold text-primary uppercase tracking-wider bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded">主实体 (Root)</span>
          <span class="material-symbols-outlined text-outline">database</span>
        </div>
        <div class="flex items-end justify-between">
          <div>
            <h3 class="font-headline text-xl font-bold text-on-surface">{{ primaryEntity.name }}</h3>
          </div>
        </div>
        <p class="text-xs text-on-surface-variant mt-3">{{ primaryEntity.desc }}</p>
        
        <!-- Integrated Add Button -->
        <button @click="showAddModal = true" class="mt-6 w-full flex items-center justify-center space-x-2 py-2 border border-dashed border-primary/40 text-primary rounded-lg hover:bg-primary/5 hover:border-primary transition-all text-sm font-bold active:scale-95">
          <span class="material-symbols-outlined text-[18px]">add</span>
          <span>添加关联实体</span>
        </button>
      </div>
      
      <!-- Bottom: Associated Entities Grid -->
      <div class="z-10 w-full flex flex-wrap justify-center gap-x-6 gap-y-12">
        
        <!-- Generated Cards -->
        <div v-for="entity in entities" :key="entity.id" class="relative flex flex-col items-center group w-64 mt-4">
          <!-- Connection Logic Pill -->
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 border border-outline-variant/40 bg-surface px-3 py-1.5 rounded-full text-[11px] font-mono flex items-center shadow-sm whitespace-nowrap z-20 text-on-surface transition-all group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-primary/50">
            <span class="text-primary font-medium mr-1">{{ entity.joinCondition.left }}</span>
            <span class="material-symbols-outlined text-[14px] mx-1 text-outline">arrow_forward</span>
            <span class="font-medium ml-1 text-on-surface">{{ entity.joinCondition.right }}</span>
          </div>
          
          <!-- Associated Card -->
          <div class="bg-surface-container-lowest p-5 rounded-xl shadow-[0px_4px_16px_rgba(25,28,29,0.04)] w-full h-full border border-outline-variant/15 transition-all group-hover:-translate-y-1 group-hover:shadow-[0px_12px_32px_rgba(25,28,29,0.08)] group-hover:border-primary/30 pt-8 flex flex-col">
            <div class="flex justify-between items-start mb-3">
              <span class="text-[10px] font-bold text-secondary uppercase tracking-wider bg-surface-container-high px-2 py-0.5 rounded">关联实体</span>
              <div class="flex items-center space-x-2">
                <span class="material-symbols-outlined text-outline text-sm">link</span>
                <button @click="removeEntity(entity.id)" class="text-error/70 hover:text-error hover:bg-error/10 p-1 rounded-full transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
            <h3 class="font-headline text-lg font-bold text-on-surface">{{ entity.name }}</h3>
            <div class="mt-auto pt-4 border-t border-surface-container text-xs text-on-surface-variant">
              {{ entity.desc }}
            </div>
          </div>
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
                  <span class="material-symbols-outlined mr-2 text-primary">add_circle</span>
                  添加关联实体
                </h3>
                <button @click="showAddModal = false" class="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-full hover:bg-surface-variant/50">
                  <span class="material-symbols-outlined text-xl">close</span>
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

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant">关联字段 (Left)</label>
                    <select v-model="newEntity.left" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface py-2.5">
                      <option v-for="f in primaryFields" :key="f" :value="f">{{ f }}</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant">被关联字段 (Right)</label>
                    <select v-model="newEntity.right" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface py-2.5">
                      <option v-for="f in associatedFields" :key="f" :value="f">{{ f }}</option>
                    </select>
                  </div>
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
import { currentConfig, addEntityToCurrentConfig, removeEntityFromCurrentConfig, mockDbSchema } from '../store/mockStore';

const primaryEntity = computed(() => currentConfig.value.primaryEntity);
const entities = computed(() => currentConfig.value.entities);

// Computed properties for dropdowns
const availableTables = computed(() => Object.keys(mockDbSchema).map(key => ({
  name: key,
  desc: mockDbSchema[key].desc
})));

const primaryFields = computed(() => {
  return mockDbSchema[primaryEntity.value.name]?.fields || ['id'];
});

const associatedFields = computed(() => {
  return mockDbSchema[newEntity.name]?.fields || ['id'];
});

const showAddModal = ref(false);
const newEntity = reactive({
  name: '',
  desc: '',
  left: '',
  right: ''
});

// Auto-fill desc and select default associated field when physical table changes
watch(() => newEntity.name, (newVal) => {
  if (newVal && mockDbSchema[newVal]) {
    newEntity.desc = mockDbSchema[newVal].desc;
    newEntity.right = mockDbSchema[newVal].fields[0] || 'id';
  }
});

const addEntity = () => {
  if (!newEntity.name || !newEntity.left || !newEntity.right) return;
  addEntityToCurrentConfig({
    id: Date.now().toString(),
    name: newEntity.name,
    desc: newEntity.desc || '新增拓展关联实体',
    status: '正常',
    joinCondition: {
      left: newEntity.left,
      right: newEntity.right
    }
  });
  newEntity.name = '';
  newEntity.desc = '';
  newEntity.left = '';
  newEntity.right = '';
  showAddModal.value = false;
};

const removeEntity = (entityId) => {
  if (confirm('确定要移除此关联实体吗？')) {
    removeEntityFromCurrentConfig(entityId);
  }
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
