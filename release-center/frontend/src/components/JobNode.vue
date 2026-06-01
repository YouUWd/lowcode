<template>
  <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm shadow-sm w-48 z-10 relative overflow-visible"
       :class="{'border-l-4 border-l-secondary': data.status === 'success', 'border-l-4 border-l-error': data.status === 'failed', 'border-l-4 border-l-primary': data.status === 'approval', 'border-l-4 border-l-outline': data.status === 'pending', 'ring-4 ring-primary/20 border-2 border-primary': data.status === 'running' }">

    <div class="flex items-center gap-sm mb-xs">
      <span class="material-symbols-outlined text-[20px]"
            :class="{'text-secondary': data.status === 'success', 'text-error': data.status === 'failed', 'text-surface-tint': data.status === 'approval', 'text-on-surface-variant': data.status === 'pending', 'text-secondary-fixed-dim': data.status === 'running' }">
        {{ getIcon(data.status) }}
      </span>
      <span class="text-[14px] font-semibold text-on-surface truncate">{{ data.title }}</span>
    </div>

    <div class="text-[13px] text-on-surface-variant flex justify-between">
      <span>{{ data.duration || '0秒' }}</span>
      <div class="flex gap-2">
         <span v-if="data.hasReport" class="flex items-center gap-1 cursor-pointer hover:text-surface-tint"><span class="material-symbols-outlined text-[14px]">description</span></span>
         <span v-if="data.hasLog" class="flex items-center gap-1 cursor-pointer hover:text-surface-tint"><span class="material-symbols-outlined text-[14px]">terminal</span></span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="data.status === 'failed' && data.errorMessage" class="mt-xs pt-xs border-t border-outline-variant/30 text-[12px] text-error">
      {{ data.errorMessage }}
    </div>

    <!-- Approver text -->
    <div v-else-if="data.footerText" class="mt-xs pt-xs border-t border-outline-variant/30 text-[12px] text-on-surface-variant">
      {{ data.footerText }}
    </div>

    <!-- Active Indicator -->
    <div v-if="data.status === 'running'" class="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full border-2 border-surface-container-lowest"></div>

  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  data: {
    title: string;
    status: 'success' | 'failed' | 'pending' | 'approval' | 'running';
    duration?: string;
    tag?: string;
    action?: string;
    hasLog?: boolean;
    hasReport?: boolean;
    footerText?: string;
    errorMessage?: string;
    stats?: {
      total: number;
      block: number;
      critical: number;
      normal: number;
    }
  }
}>();

const getIcon = (status: string) => {
  switch (status) {
    case 'success': return 'check_circle';
    case 'failed': return 'cancel';
    case 'approval': return 'person';
    case 'pending': return 'play_circle';
    case 'running': return 'database';
    default: return 'play_circle';
  }
}
</script>