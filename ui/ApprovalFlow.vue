<script setup>
import { markRaw, ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import FlowNodes from './FlowNodes.vue'

const nodeTypes = {
  custom: markRaw(FlowNodes),
}

/**
 * 分支线从菱形顶/底竖向出发，smoothstep 形成「先竖再横」的 L 形（仅一个圆角拐弯）。
 * 主干道节点 Y 中心严格对齐到 100，保持水平直线。
 */
const nodes = ref([
  { id: 'start', type: 'custom', position: { x: 20, y: 84 }, data: { kind: 'start' }, draggable: false, selectable: false },
  { id: 'head_teacher', type: 'custom', position: { x: 100, y: 72 }, data: { kind: 'task', label: '教研组长初审', code: 'head_teacher' } },
  { id: 'gw1', type: 'custom', position: { x: 320, y: 80 }, data: { kind: 'gateway' } },
  { id: 'edu', type: 'custom', position: { x: 410, y: 0 }, data: { kind: 'task', label: '教务处核准' } },
  { id: 'finance', type: 'custom', position: { x: 410, y: 140 }, data: { kind: 'task', label: '财务处退要复核' } },
  { id: 'gw2', type: 'custom', position: { x: 620, y: 80 }, data: { kind: 'gateway' } },
  { id: 'principal', type: 'custom', position: { x: 710, y: 72 }, data: { kind: 'task', label: '校长终审', code: 'principal' } },
  { id: 'end', type: 'custom', position: { x: 900, y: 84 }, data: { kind: 'end' }, draggable: false, selectable: false },
])

const edges = ref([
  { id: 'e1', source: 'start', target: 'head_teacher', type: 'smoothstep', animated: true },
  { id: 'e2', source: 'head_teacher', target: 'gw1', targetHandle: 'in-main', type: 'smoothstep', animated: true },
  // 分支：从菱形顶/底竖向出发
  { id: 'e3', source: 'gw1', sourceHandle: 'out-top', target: 'edu', type: 'smoothstep', animated: true },
  { id: 'e4', source: 'gw1', sourceHandle: 'out-bottom', target: 'finance', type: 'smoothstep', animated: true },
  { id: 'e5', source: 'edu', target: 'gw2', targetHandle: 'in-top', type: 'smoothstep', animated: true },
  { id: 'e6', source: 'finance', target: 'gw2', targetHandle: 'in-bottom', type: 'smoothstep', animated: true },
  { id: 'e7', source: 'gw2', sourceHandle: 'out-main', target: 'principal', type: 'smoothstep', animated: true },
  { id: 'e8', source: 'principal', target: 'end', type: 'smoothstep', animated: true },
])
</script>

<template>
  <div class="flow-wrap">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
      :zoom-on-scroll="false"
      :pan-on-drag="false"
      :prevent-scrolling="false"
      fit-view-on-init
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.5"
      :max-zoom="1.5"
    />
  </div>
</template>
