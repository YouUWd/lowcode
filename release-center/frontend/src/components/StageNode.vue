<template>
  <div class="w-[280px] h-full flex flex-col bg-surface-bright border-l border-outline-variant">
    <div class="px-md py-sm border-b border-outline-variant flex items-center justify-between">
      <h2 class="font-title-sm text-title-sm text-on-surface">{{ data.title }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: {
    title: string;
    count?: number;
  }
}>();
</script>