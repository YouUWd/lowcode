<template>
  <div class="h-full flex flex-col bg-background font-body-md text-on-surface">
    <!-- Wizard Header -->
    <div class="bg-surface-container-lowest border-b border-outline-variant px-lg py-md flex items-center justify-between z-10 shrink-0">
      <div class="flex items-center gap-lg">
        <h1 class="font-headline-md text-headline-md text-on-surface">Create Change Request</h1>
        <!-- Steps -->
        <div class="flex items-center gap-sm bg-surface-container-low rounded-lg p-xs border border-outline-variant/50">
          <div class="flex items-center gap-xs px-md py-sm rounded-md text-on-surface-variant">
            <span class="material-symbols-outlined text-[18px]">check_circle</span>
            <span class="font-label-caps text-label-caps">1. Basic Info</span>
          </div>
          <div class="w-4 h-px bg-outline-variant"></div>
          <div class="flex items-center gap-xs px-md py-sm rounded-md bg-primary-container text-on-primary-container font-bold shadow-sm">
            <span class="w-5 h-5 rounded-full bg-on-primary-container text-primary-container flex items-center justify-center text-[12px]">2</span>
            <span class="font-label-caps text-label-caps">2. Workflow</span>
          </div>
          <div class="w-4 h-px bg-outline-variant"></div>
          <div class="flex items-center gap-xs px-md py-sm rounded-md text-on-surface-variant opacity-60">
            <span class="w-5 h-5 rounded-full border border-outline-variant flex items-center justify-center text-[12px]">3</span>
            <span class="font-label-caps text-label-caps">3. Review</span>
          </div>
        </div>
      </div>
      <div class="flex gap-sm">
        <button class="px-md py-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors font-title-sm text-title-sm">Previous</button>
        <button class="px-md py-sm rounded-lg bg-surface-tint text-on-primary hover:bg-[#4096ff] transition-colors shadow-sm font-title-sm text-title-sm" @click="saveWorkflow">Save Workflow</button>
      </div>
    </div>

    <!-- Workflow Builder Workspace -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Node Palette -->
      <aside class="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0 overflow-y-auto">
        <div class="p-md border-b border-outline-variant/50">
          <h2 class="font-title-sm text-title-sm text-on-surface">Nodes</h2>
          <p class="text-on-surface-variant text-[12px] mt-1">Click to add to workflow</p>
        </div>
        <div class="p-md flex flex-col gap-sm">
          <div @click="addStage" class="p-sm rounded-md border border-outline-variant bg-surface flex items-center gap-sm cursor-pointer hover:border-outline transition-colors shadow-sm">
            <span class="material-symbols-outlined text-on-surface-variant">view_column</span>
            <span class="font-body-md text-body-md text-on-surface">Add Stage</span>
          </div>
          <div @click="addJob('approval')" class="p-sm rounded-md border border-outline-variant bg-surface flex items-center gap-sm cursor-pointer hover:border-outline transition-colors shadow-sm mt-4">
            <span class="material-symbols-outlined text-surface-tint">person</span>
            <span class="font-body-md text-body-md text-on-surface">Approval</span>
          </div>
          <div @click="addJob('auto')" class="p-sm rounded-md border border-outline-variant bg-surface flex items-center gap-sm cursor-pointer hover:border-outline transition-colors shadow-sm">
            <span class="material-symbols-outlined text-secondary-fixed-dim">database</span>
            <span class="font-body-md text-body-md text-on-surface">SQL Execution</span>
          </div>
        </div>
      </aside>

      <!-- Center: Canvas -->
      <div class="flex-1 workflow-canvas relative overflow-hidden bg-surface-bright flex items-center justify-center">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import JobNode from '../components/JobNode.vue';
import StageNode from '../components/StageNode.vue';
import { ElMessage } from 'element-plus';
import api from '../api';

let stageCount = 5;
let jobCount = 5;

// Canvas layout setup based on Unified Hub design
const nodes = ref<any[]>([
  // Stages (Columns background)
  { id: 'stage-1', type: 'stage', position: { x: 0, y: 0 }, data: { title: 'Source', count: 0 }, style: { width: '300px', height: '1000px' } },
  { id: 'stage-2', type: 'stage', position: { x: 300, y: 0 }, data: { title: 'Code Scan' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },
  { id: 'stage-3', type: 'stage', position: { x: 600, y: 0 }, data: { title: 'Test' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },
  { id: 'stage-4', type: 'stage', position: { x: 900, y: 0 }, data: { title: 'Build' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },
  { id: 'stage-5', type: 'stage', position: { x: 1200, y: 0 }, data: { title: 'Deploy' }, style: { width: '300px', height: '1000px', borderLeft: '1px solid #E4E7ED' } },

  // Jobs inside columns
  {
    id: 'job-1', type: 'job', position: { x: 20, y: 60 },
    data: { title: 'Github Webhook', status: 'success' },
    parentNode: 'stage-1', expandParent: true
  },
  {
    id: 'job-2', type: 'job', position: { x: 320, y: 60 },
    data: { title: 'Lead Approval', status: 'approval', tag: 'Passed', duration: '37s', footerText: 'Approved by DevOps Team' }
  },
  {
    id: 'job-3', type: 'job', position: { x: 620, y: 60 },
    data: { title: 'SonarQube Scan', status: 'success', duration: '50s', hasLog: true, hasReport: true }
  },
  {
    id: 'job-4', type: 'job', position: { x: 620, y: 200 },
    data: { title: 'Unit Tests', status: 'failed', duration: '18s', hasLog: true, errorMessage: 'Test execution failed. See logs.' }
  },
  {
    id: 'job-5', type: 'job', position: { x: 920, y: 60 },
    data: { title: 'Docker Build', status: 'pending', duration: '0s' }
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