<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: { type: Object, required: true },
  type: { type: String, default: '' },
})

const statusClass = computed(() => {
  const status = props.data.status || 'PENDING'
  return {
    'border-[#10b981] bg-[#10b981]/5 text-[#065f46]': status === 'PASSED',
    'border-[#2563eb] bg-[#2563eb]/5 text-[#1e40af] ring-4 ring-[#2563eb]/20 animate-pulse-slow': status === 'ACTIVE',
    'border-slate-200 bg-slate-50 text-slate-400': status === 'PENDING',
    'border-amber-400 bg-amber-50 text-amber-700 opacity-60': status === 'INVALIDATED'
  }
})

const iconColor = computed(() => {
  const status = props.data.status || 'PENDING'
  return {
    '#10b981': status === 'PASSED',
    '#2563eb': status === 'ACTIVE',
    '#94a3b8': status === 'PENDING',
    '#d97706': status === 'INVALIDATED'
  }[status] || '#94a3b8'
})
</script>

<template>
  <div class="relative flex items-center justify-center">
    <!-- 起点 (32x32) -->
    <template v-if="data.kind === 'start'">
      <div class="flex items-center justify-center border-2 rounded-full w-8 h-8 font-black shadow-sm z-10 transition-all duration-500"
           :style="{ borderColor: iconColor, color: iconColor, backgroundColor: 'white' }">
        ▶
      </div>
      <Handle id="out-main" type="source" :position="Position.Right" class="!opacity-0 !border-0" />
    </template>

    <!-- 终点 (32x32) -->
    <template v-else-if="data.kind === 'end'">
      <Handle id="in-main" type="target" :position="Position.Left" class="!opacity-0 !border-0" />
      <div class="flex items-center justify-center border-2 bg-white rounded-full w-8 h-8 shadow-sm z-10 transition-all duration-500"
           :style="{ borderColor: data.status === 'PASSED' ? '#10b981' : '#e2e8f0' }">
        <div class="w-3 h-3 rounded-sm transition-all duration-500" 
             :style="{ backgroundColor: data.status === 'PASSED' ? '#10b981' : '#e2e8f0' }" />
      </div>
    </template>

    <!-- 网关（菱形）：上下分支从顶/底竖向出线 (40x40) -->
    <template v-else-if="data.kind === 'gateway'">
      <Handle id="in-main" type="target" :position="Position.Left" class="!opacity-0 !border-0" />
      <Handle id="out-main" type="source" :position="Position.Right" class="!opacity-0 !border-0" />
      <Handle id="out-top" type="source" :position="Position.Top" class="!opacity-0 !border-0" />
      <Handle id="out-bottom" type="source" :position="Position.Bottom" class="!opacity-0 !border-0" />
      <Handle id="in-top" type="target" :position="Position.Top" class="!opacity-0 !border-0" />
      <Handle id="in-bottom" type="target" :position="Position.Bottom" class="!opacity-0 !border-0" />

      <div class="w-10 h-10 bg-white border-2 rotate-45 flex items-center justify-center relative shadow-sm z-10 transition-all duration-500"
           :class="data.status === 'ACTIVE' ? 'ring-4 ring-[#2563eb]/20' : ''"
           :style="{ borderColor: iconColor, color: iconColor }">
        <span class="-rotate-45 font-black text-lg">+</span>
      </div>
    </template>

    <!-- 任务节点 (56px h-14) -->
    <template v-else>
      <Handle id="in-main" type="target" :position="Position.Left" class="!opacity-0 !border-0" />
      <div class="border-2 px-6 min-w-[140px] h-[56px] flex flex-col items-center justify-center rounded-lg shadow-sm z-10 transition-all duration-500"
           :class="statusClass">
        <div class="font-bold text-sm tracking-wide flex items-center gap-1">
          <span v-if="data.status === 'PASSED'" class="material-symbols-outlined text-[14px]">check_circle</span>
          <span v-if="data.status === 'ACTIVE'" class="material-symbols-outlined text-[14px] animate-spin-slow">sync</span>
          {{ data.label }}
        </div>
        <div v-if="data.code" class="text-[10px] opacity-50 mt-0.5 uppercase tracking-widest font-mono">{{ data.code }}</div>
      </div>
      <Handle id="out-main" type="source" :position="Position.Right" class="!opacity-0 !border-0" />
    </template>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>
