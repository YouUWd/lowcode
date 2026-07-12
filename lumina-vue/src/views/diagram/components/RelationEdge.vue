<template>
  <!--
    RelationEdge — Vue Flow 自定义边
    绘制正交折线 + 两端基数圆（1/N），颜色按 edgeIndex 分配。
  -->
  <g>
    <!-- 透明宽触发区（提高点击/hover 命中率） -->
    <path
      :d="path"
      fill="none"
      stroke="transparent"
      stroke-width="14"
      style="pointer-events: auto;"
      @click="onEdgeClick"
      @mouseenter="setHoveredEdge(props.id)"
      @mouseleave="setHoveredEdge(null)"
    />

    <!-- 可视元素组（统一应用透明度，避免圆圈内部透出线条） -->
    <g :opacity="edgeOpacity" style="transition: opacity 0.3s ease;">
      <!-- 主连线 -->
      <path
        :d="path"
        fill="none"
        :stroke="lineColor"
        :stroke-width="isActive ? 2.4 : 1.7"
        :stroke-dasharray="isActive ? '6 3' : 'none'"
        style="pointer-events: none; transition: stroke-width 0.3s ease;"
      >
        <animate
          v-if="isActive"
          attributeName="stroke-dashoffset"
          from="0" to="-40"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>

      <!-- 基数圆：1 侧（源字段出口） -->
      <g :transform="`translate(${ep.x1}, ${ep.y1})`">
        <circle r="9" fill="white" :stroke="lineColor" stroke-width="1.5"/>
        <text
          text-anchor="middle"
          dominant-baseline="central"
          font-size="9"
          font-weight="700"
          :fill="lineColor"
        >{{ data?.sourceNode?.cardinality || '1' }}</text>
      </g>

      <!-- 基数圆：N 侧（目标字段入口） -->
      <g :transform="`translate(${ep.x2}, ${ep.y2})`">
        <circle r="9" fill="white" :stroke="lineColor" stroke-width="1.5"/>
        <text
          text-anchor="middle"
          dominant-baseline="central"
          font-size="9"
          font-weight="700"
          :fill="lineColor"
        >{{ data?.targetNode?.cardinality || 'N' }}</text>
      </g>

      <!-- hover/active 时显示关系名 -->
      <foreignObject
        v-if="isActive"
        :x="midpoint.x - 70"
        :y="midpoint.y - 22"
        width="140"
        height="22"
        style="pointer-events: none;"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          class="rel-label-box"
          :style="{ borderColor: lineColor, color: lineColor }"
        >
          {{ data?.rel?.name || `${data?.sourceNode?.tableName} → ${data?.targetNode?.tableName}` }}
        </div>
      </foreignObject>
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import type { EdgeProps } from '@vue-flow/core'
import { getSmoothStepPath, useVueFlow } from '@vue-flow/core'
import { hoveredTableId, hoveredFieldId, hoveredEdgeId } from '../../../composables/useHoverState'

const props = defineProps<EdgeProps>()

const setHoveredEdge = (id: string | null) => { hoveredEdgeId.value = id }
const { removeEdges } = useVueFlow()

// 是否处于激活（hover 或全局 activeEdgeId 匹配）
const activeEdgeId = inject<{ value: string | null }>('activeEdgeId', { value: null })
const isActive = computed(() => {
  if (hoveredEdgeId.value === props.id) return true
  if (activeEdgeId.value === props.id) return true

  // If a specific field is selected, only highlight relations attached to this field
  if (hoveredFieldId.value) {
    const srcField = `${props.data?.sourceNode?.tableName}.${props.data?.sourceNode?.columnName}`
    const tgtField = `${props.data?.targetNode?.tableName}.${props.data?.targetNode?.columnName}`
    return hoveredFieldId.value === srcField || hoveredFieldId.value === tgtField
  }

  // If a table is selected, but NO specific field is selected, highlight all table relations
  if (hoveredTableId.value) {
    return hoveredTableId.value === props.source || hoveredTableId.value === props.target
  }

  return false
})

const hasAnyActive = computed(() => {
  return !!(hoveredTableId.value || hoveredFieldId.value || activeEdgeId.value || hoveredEdgeId.value)
})

const edgeOpacity = computed(() => isActive.value ? 1 : (hasAnyActive.value ? 0.15 : 0.8))

// 线条颜色
const lineColor = computed(() =>
  isActive.value ? '#2563EB' : (props.data?.color ?? '#94A3B8')
)



// 端点坐标（用于基数圆，留出圆的半径空间避免重叠）
const MARKER_PAD = 14

const ep = computed(() => ({
  x1: props.sourceX + MARKER_PAD,
  y1: props.sourceY,
  x2: props.targetX - MARKER_PAD,
  y2: props.targetY,
}))

// 连线路径（正交折线，borderRadius=0）
const path = computed(() => {
  const [p] = getSmoothStepPath({
    sourceX: props.sourceX + MARKER_PAD,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX - MARKER_PAD,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 0,
  })
  return p
})

// 折线中点（用于关系名标签）
const midpoint = computed(() => ({
  x: (ep.value.x1 + ep.value.x2) / 2,
  y: (ep.value.y1 + ep.value.y2) / 2,
}))

// 点击连线 → 发布激活事件（父组件处理）
const emit = defineEmits<{
  (e: 'edge-click', id: string): void
}>()

function onEdgeClick() {
  emit('edge-click', props.id)
}
</script>

<style scoped>
.rel-label-box {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  background: #fff;
  border: 1.5px solid;
  border-radius: 4px;
  padding: 2px 6px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
</style>
