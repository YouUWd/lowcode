<template>
  <div class="h-[800px] w-full border border-gray-300 rounded">
    <div class="p-2 bg-gray-100 flex gap-2">
      <el-button @click="addNode('approval')">Add Approval Node</el-button>
      <el-button @click="addNode('auto')">Add Auto Release Node</el-button>
      <el-button type="success" @click="saveWorkflow">Save Workflow</el-button>
    </div>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-zoom="1"
      class="h-[750px]"
    >
      <Background pattern-color="#aaa" :gap="16" />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { ElMessage } from 'element-plus';
import api from '../api';

const nodes = ref<any[]>([
  { id: 'start', type: 'input', label: 'Start', position: { x: 250, y: 50 } },
]);
const edges = ref<any[]>([]);

let id = 1;

const addNode = (type: string) => {
  const newNode = {
    id: `node-${id++}`,
    type: 'default',
    label: type === 'approval' ? 'Approval Node' : 'Auto Release',
    position: { x: 250, y: 50 + id * 100 },
  };
  nodes.value.push(newNode);

  if (nodes.value.length > 1) {
     edges.value.push({
       id: `e-${nodes.value[nodes.value.length-2].id}-${newNode.id}`,
       source: nodes.value[nodes.value.length-2].id,
       target: newNode.id
     });
  }
};

const saveWorkflow = async () => {
  const flowData = JSON.stringify({ nodes: nodes.value, edges: edges.value });
  const res: any = await api.post('/workflows', {
    name: 'Main Workflow',
    description: 'Generated from UI',
    flowData
  });
  if (res.code === 0) {
    ElMessage.success('Workflow saved successfully');
  }
};
</script>