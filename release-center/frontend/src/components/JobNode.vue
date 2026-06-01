<template>
  <div class="w-64 h-[120px] bg-white border border-gray-200 rounded-md shadow-sm relative overflow-hidden flex flex-col justify-between"
       :class="{'border-l-4 border-l-green-500': data.status === 'success', 'border-l-4 border-l-red-500': data.status === 'failed', 'border-l-4 border-l-gray-300': data.status === 'pending'}">

    <div class="p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <el-icon v-if="data.status === 'success'" class="text-green-500"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="data.status === 'failed'" class="text-red-500"><CircleCloseFilled /></el-icon>
          <el-icon v-else class="text-gray-400"><Clock /></el-icon>
          <span class="font-bold text-sm text-gray-800">{{ data.title }}</span>
          <el-tag v-if="data.tag" size="small" type="info" class="ml-1" effect="light">{{ data.tag }}</el-tag>
        </div>
        <el-button v-if="data.action" size="small" class="text-xs">{{ data.action }}</el-button>
      </div>

      <div class="text-xs text-gray-500 mt-2 flex justify-between">
        <span>{{ data.duration || '0秒' }}</span>
        <div class="flex gap-2">
          <span v-if="data.hasReport" class="flex items-center gap-1 cursor-pointer hover:text-blue-500"><el-icon><Document /></el-icon> 扫描报告</span>
          <span v-if="data.hasLog" class="flex items-center gap-1 cursor-pointer hover:text-blue-500"><el-icon><Tickets /></el-icon> 日志</span>
        </div>
      </div>
    </div>

    <!-- Error state specific content -->
    <div v-if="data.status === 'failed' && data.errorMessage" class="px-3 pb-2 text-xs text-red-500 border-t border-red-100 pt-1">
      <p>{{ data.errorMessage }}</p>
      <div class="flex justify-end gap-2 mt-1">
         <span class="flex items-center gap-1 text-blue-500 cursor-pointer hover:underline"><el-icon><Aim /></el-icon> 智能排查</span>
         <span class="flex items-center gap-1 text-blue-500 cursor-pointer hover:underline"> 重试</span>
      </div>
    </div>

    <!-- Code scan specific stats -->
    <div v-else-if="data.stats" class="px-3 pb-2 pt-1 border-t border-gray-100 flex justify-between text-center">
      <div><div class="text-red-500 font-bold">{{ data.stats.total }}</div><div class="text-xs text-gray-500">总数</div></div>
      <div><div class="text-red-500 font-bold">{{ data.stats.block }}</div><div class="text-xs text-gray-500">阻塞</div></div>
      <div><div class="text-orange-500 font-bold">{{ data.stats.critical }}</div><div class="text-xs text-gray-500">严重</div></div>
      <div><div class="text-gray-500 font-bold">{{ data.stats.normal }}</div><div class="text-xs text-gray-500">一般</div></div>
    </div>

    <!-- Approver text -->
    <div v-else-if="data.footerText" class="px-3 py-2 bg-blue-50 text-xs text-gray-600">
      {{ data.footerText }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled, CircleCloseFilled, Clock, Document, Tickets, Aim } from '@element-plus/icons-vue';

const props = defineProps<{
  data: {
    title: string;
    status: 'success' | 'failed' | 'pending';
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
</script>