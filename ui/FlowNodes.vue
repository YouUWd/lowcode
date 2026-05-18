<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps({
  data: { type: Object, required: true },
  type: { type: String, default: '' },
})
</script>

<template>
  <!-- 起点 -->
  <template v-if="data.kind === 'start'">
    <div class="flow-node start">▶</div>
    <Handle type="source" :position="Position.Right" />
  </template>

  <!-- 终点 -->
  <template v-else-if="data.kind === 'end'">
    <Handle type="target" :position="Position.Left" />
    <div class="flow-node end"><div class="end-dot" /></div>
  </template>

  <!-- 网关（菱形）：上下分支从顶/底竖向出线 -->
  <template v-else-if="data.kind === 'gateway'">
    <Handle id="in-main" type="target" :position="Position.Left" />
    <Handle id="out-main" type="source" :position="Position.Right" />
    <Handle id="out-top" type="source" :position="Position.Top" />
    <Handle id="out-bottom" type="source" :position="Position.Bottom" />
    <Handle id="in-top" type="target" :position="Position.Top" />
    <Handle id="in-bottom" type="target" :position="Position.Bottom" />

    <div class="flow-node gateway">
      <span class="gateway-icon">+</span>
    </div>
  </template>

  <!-- 任务节点 -->
  <template v-else>
    <Handle type="target" :position="Position.Left" />
    <div class="flow-node">
      <div class="node-title">{{ data.label }}</div>
      <div v-if="data.code" class="node-code">{{ data.code }}</div>
    </div>
    <Handle type="source" :position="Position.Right" />
  </template>
</template>
