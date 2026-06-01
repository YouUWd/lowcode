<template>
  <div class="h-full w-full flex flex-col bg-white overflow-hidden">
    <!-- Top Header -->
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2">
      <div class="flex items-center gap-4">
        <el-icon class="text-gray-400 cursor-pointer hover:text-gray-600"><Back /></el-icon>
        <h1 class="text-lg font-medium text-gray-800 border-r border-gray-300 pr-4">流水线 2026-05-30</h1>
        <div class="flex gap-2">
          <span class="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded cursor-pointer">最近运行</span>
          <span class="text-sm px-3 py-1 text-gray-500 hover:text-gray-800 cursor-pointer">运行历史</span>
          <span class="text-sm px-3 py-1 text-gray-500 hover:text-gray-800 cursor-pointer">统计报表</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-xs">TH</div>
        <el-button>编辑</el-button>
        <el-button type="primary">运行</el-button>
        <el-button icon="MoreFilled" circle></el-button>
      </div>
    </div>

    <!-- Sub Header (Status) -->
    <div class="flex justify-between items-end px-6 py-4 border-b border-gray-100 bg-[#FBFBFB]">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-gray-500 font-bold">#1</span>
          <el-icon class="text-red-500"><CircleCloseFilled /></el-icon>
          <span class="text-red-500 font-medium">运行失败 <span class="text-gray-400 font-normal text-sm">(测试)</span></span>
        </div>
        <div class="text-xs text-gray-500 flex gap-4">
          <span>触发信息 <span class="text-gray-800">邓由由 · 页面手动触发</span></span>
          <span>开始时间 <span class="text-gray-800">2026-05-30 14:35:02</span></span>
          <span>持续时间 <span class="text-gray-800">1分28秒</span> <el-icon class="cursor-pointer"><QuestionFilled /></el-icon></span>
        </div>
      </div>

      <div class="flex gap-8 text-center">
        <div>
          <div class="text-xl font-bold text-gray-800">0</div>
          <div class="text-xs text-gray-500 mt-1">代码变更</div>
        </div>
        <div>
          <div class="text-xl font-bold text-gray-800">0</div>
          <div class="text-xs text-gray-500 mt-1">运行产物</div>
        </div>
        <div>
          <div class="text-xl font-bold text-gray-800">8</div>
          <div class="text-xs text-gray-500 mt-1">环境变量</div>
        </div>
      </div>
    </div>

    <!-- Canvas Area -->
    <!-- Toolbar for Designer -->
    <div class="p-2 bg-gray-100 flex gap-2 border-b border-gray-200 shadow-sm z-10 relative">
      <el-button @click="addStage">添加阶段 (Add Stage)</el-button>
      <el-button @click="addJob('approval')">添加审批节点 (Add Approval)</el-button>
      <el-button @click="addJob('auto')">添加自动任务 (Add Auto Job)</el-button>
      <el-button type="success" @click="saveWorkflow">保存工作流 (Save)</el-button>
    </div>

    <!-- Canvas Area -->
    <div class="flex-1 relative bg-[#F5F7FA]">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-zoom="1"
        :min-zoom="0.2"
        :max-zoom="4"
        fit-view-on-init
      >
        <template #node-job="props">
          <JobNode :data="props.data" />
        </template>
        <template #node-stage="props">
          <StageNode :data="props.data" />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import JobNode from '../components/JobNode.vue';
import StageNode from '../components/StageNode.vue';
import { Back, CircleCloseFilled, QuestionFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '../api';

let stageCount = 5;
let jobCount = 5;

// Canvas layout setup mimicking the screenshot
const nodes = ref<any[]>([
  // Stages (Columns background)
  { id: 'stage-1', type: 'stage', position: { x: 0, y: 0 }, data: { title: '流水线源', count: 0 }, style: { width: '300px', height: '1000px' } },
  { id: 'stage-2', type: 'stage', position: { x: 300, y: 0 }, data: { title: '新阶段' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },
  { id: 'stage-3', type: 'stage', position: { x: 600, y: 0 }, data: { title: '测试' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },
  { id: 'stage-4', type: 'stage', position: { x: 900, y: 0 }, data: { title: '构建' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },
  { id: 'stage-5', type: 'stage', position: { x: 1200, y: 0 }, data: { title: '部署' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },

  // Jobs inside columns
  {
    id: 'job-1', type: 'job', position: { x: 20, y: 60 },
    data: { title: '暂未设置', status: 'pending' },
    parentNode: 'stage-1', expandParent: true
  },
  {
    id: 'job-2', type: 'job', position: { x: 320, y: 60 },
    data: { title: '发布...', status: 'success', tag: '通过', duration: '37秒', action: '或签', footerText: '已通过 by: 邓由由' }
  },
  {
    id: 'job-3', type: 'job', position: { x: 620, y: 60 },
    data: { title: 'Java 代码扫描', status: 'success', duration: '50秒', hasLog: true, hasReport: true, stats: { total: 0, block: 0, critical: 0, normal: 0 } }
  },
  {
    id: 'job-4', type: 'job', position: { x: 620, y: 200 },
    data: { title: 'Maven 单元测试', status: 'failed', duration: '18秒', hasLog: true, errorMessage: '运行失败，请查看日志，或尝试在线调试' }
  },
  {
    id: 'job-5', type: 'job', position: { x: 920, y: 60 },
    data: { title: 'Java 构建上传', status: 'pending', duration: '0秒' }
  }
]);

// Connecting edges matching the screenshot flow (job-2 connects to both job-3 and job-4)
const edges = ref<any[]>([
  { id: 'e2-3', source: 'job-2', target: 'job-3', type: 'step', style: { stroke: '#b1b1b7', strokeWidth: 2 } },
  { id: 'e2-4', source: 'job-2', target: 'job-4', type: 'step', style: { stroke: '#b1b1b7', strokeWidth: 2 } },
]);

const addStage = () => {
  stageCount++;
  nodes.value.push({
    id: `stage-${stageCount}`,
    type: 'stage',
    position: { x: (stageCount - 1) * 300, y: 0 },
    data: { title: `新阶段 ${stageCount}` },
    style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' }
  });
};

const addJob = (type: string) => {
  jobCount++;
  const newJobId = `job-${jobCount}`;
  const parentStageId = `stage-${stageCount}`;

  nodes.value.push({
    id: newJobId,
    type: 'job',
    position: { x: 20, y: 60 },
    data: { title: type === 'approval' ? '审批节点' : '自动任务', status: 'pending' },
    parentNode: parentStageId,
    expandParent: true
  });

  if (jobCount > 1) {
     edges.value.push({
       id: `e-${jobCount-1}-${jobCount}`,
       source: `job-${jobCount-1}`,
       target: newJobId,
       type: 'step',
       style: { stroke: '#b1b1b7', strokeWidth: 2 }
     });
  }
};

const saveWorkflow = async () => {
  const flowData = JSON.stringify({ nodes: nodes.value, edges: edges.value });
  const res: any = await api.post('/workflows', {
    name: `流水线 ${new Date().toISOString().split('T')[0]}`,
    description: 'Generated from Custom UI',
    flowData
  });
  if (res.code === 0) {
    ElMessage.success('工作流保存成功 (Workflow Saved)');
  }
};
</script>