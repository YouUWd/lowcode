<template>
  <div class="w-[300px] h-full flex flex-col bg-[#F5F7FA]">
    <div class="px-4 py-3 font-semibold text-gray-700 text-sm border-b border-gray-200">
      {{ data.title }}
      <span v-if="data.count !== undefined" class="text-gray-400 font-normal ml-1">· {{ data.count }}</span>
    </div>
    <!-- The actual VueFlow node acts as a container, children will be positioned relative to the canvas but this visually provides the column background -->
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