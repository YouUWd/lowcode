<template>
  <div class="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] overflow-hidden border border-outline-variant/10">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold">
          <th class="p-5">物理字段与来源</th>
          <th class="p-5 text-center w-40">READ (读取)</th>
          <th class="p-5 text-center w-40">CREATE (创建)</th>
          <th class="p-5 text-center w-40">UPDATE (更新)</th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr v-for="field in fields" :key="field.id" class="border-b border-outline-variant/15 hover:bg-surface-container-low/30 transition-colors group">
          <td class="p-5">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                <Database class="w-5 h-5" />
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-bold text-on-surface">{{ field.field }}</span>
                  <span v-if="field.logicalField" class="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-medium">
                    {{ field.logicalField }}
                  </span>
                </div>
                <span class="text-[11px] font-semibold text-on-surface-variant opacity-60 uppercase tracking-tighter">{{ field.entity }}</span>
              </div>
            </div>
          </td>
          
          <!-- Toggles synced with ModuleList style -->
          <td v-for="type in ['READ', 'CREATE', 'UPDATE']" :key="type" class="p-5 text-center">
            <div class="flex justify-center">
              <button 
                @click="emitToggle(`${field.entity}.${field.field}.${type}`)"
                class="relative inline-flex items-center cursor-pointer group"
              >
                <div class="w-11 h-6 rounded-full transition-all duration-200" 
                     :class="activePermissions.has(`${field.entity}.${field.field}.${type}`) 
                       ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.2)]' 
                       : 'bg-surface-container-highest border border-outline-variant/20'">
                </div>
                <div class="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-200 shadow-sm"
                     :class="activePermissions.has(`${field.entity}.${field.field}.${type}`) ? 'translate-x-5' : 'translate-x-0'">
                </div>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="fields.length === 0">
          <td colspan="4" class="p-20 text-center text-on-surface-variant opacity-40">
            <ShieldAlert class="w-16 h-16 mx-auto mb-4" />
            <p class="font-medium">当前模块尚未定义物理字段映射，请先前往“配置”页面。</p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { Database, ShieldAlert } from 'lucide-vue-next';

const props = defineProps({
  fields: { type: Array, required: true },
  activePermissions: { type: Set, required: true }
});

const emit = defineEmits(['toggle']);

const emitToggle = (node) => {
  emit('toggle', node);
};
</script>
