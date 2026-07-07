<template>
  <!--
    TableNode — Vue Flow 自定义表节点
    - 每个字段行两侧有独立 Handle（供拖拽建立关系）
    - editMode 通过 provide/inject 从 ErDiagram 注入，保持响应性
    - PK 字段显示钥匙图标，FK 字段显示链接图标
  -->
  <div
    class="table-node"
    :class="{
      'is-edit':     isEditMode,
      'is-selected': props.selected,
    }"
  >
    <!-- ── 彩色表头 ── -->
    <div
      class="node-header"
      :style="{ background: TABLE_COLORS[props.data.tableIndex % TABLE_COLORS.length] }"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="header-icon" aria-hidden="true">
        <rect x="2"  y="2"  width="9" height="9" rx="1.5" fill="rgba(255,255,255,0.9)"/>
        <rect x="13" y="2"  width="9" height="9" rx="1.5" fill="rgba(255,255,255,0.9)"/>
        <rect x="2"  y="13" width="9" height="9" rx="1.5" fill="rgba(255,255,255,0.5)"/>
        <rect x="13" y="13" width="9" height="9" rx="1.5" fill="rgba(255,255,255,0.5)"/>
      </svg>
      <span class="table-name">{{ props.data.table.tableName }}</span>
      <span v-if="props.data.table.displayName" class="display-name">
        {{ props.data.table.displayName }}
      </span>
    </div>

    <!-- ── 字段行列表 ── -->
    <div class="node-body">
      <div
        v-for="field in props.data.table.fields"
        :key="field.id"
        class="field-row"
        :class="{
          'field-pk': isPk(field),
          'field-fk': isFk(field),
        }"
      >
        <!-- Target Handle（字段左侧，连线终点） -->
        <Handle
          :id="`${field.columnName}__tgt`"
          type="target"
          :position="Position.Left"
          class="field-handle handle-left"
          :connectable="isEditMode"
        />

        <!-- 字段图标 -->
        <span class="field-icon-wrap">
          <!-- PK 图标 -->
          <svg v-if="isPk(field)" width="11" height="11" viewBox="0 0 24 24" fill="none" class="icon-pk" aria-label="主键">
            <circle cx="8" cy="12" r="5" stroke="currentColor" stroke-width="2.2"/>
            <path d="M13 12h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M17 9l4 3-4 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- FK 图标 -->
          <svg v-else-if="isFk(field)" width="11" height="11" viewBox="0 0 24 24" fill="none" class="icon-fk" aria-label="外键">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!-- 普通字段圆点 -->
          <span v-else class="field-dot"></span>
        </span>

        <!-- 字段名 -->
        <span class="field-name" :class="{ 'pk-bold': isPk(field) }">
          {{ field.columnName }}
        </span>

        <!-- 数据类型 -->
        <span class="field-type">{{ field.dataType }}</span>

        <!-- Source Handle（字段右侧，连线起点） -->
        <Handle
          :id="`${field.columnName}__src`"
          type="source"
          :position="Position.Right"
          class="field-handle handle-right"
          :connectable="isEditMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import type { Ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import { TABLE_COLORS } from '../../composables/useErData'
import type { ErField, ErTable } from '../../composables/useErData'

// ── 自定义节点 data 类型 ──────────────────────────────────────────────────
interface TableNodeData {
  table:       ErTable
  tableIndex:  number
  fkFieldIds:  Set<number>
}

// ── Props（Vue Flow 传入） ─────────────────────────────────────────────────
// 注意：不要解构 props，否则 selected 等属性会失去响应性
const props = defineProps<NodeProps<TableNodeData>>()

// ── 从 ErDiagram 注入编辑模式（响应式 ref）────────────────────────────────
// ErDiagram.vue 中 provide('erEditMode', isEditMode)
const isEditMode = inject<Ref<boolean>>('erEditMode', ref(false))

// ── 辅助函数 ──────────────────────────────────────────────────────────────
const isPk = (field: ErField): boolean =>
  props.data.table.primaryColumn === field.columnName

const isFk = (field: ErField): boolean =>
  props.data.fkFieldIds?.has(field.id) ?? false
</script>

<style scoped>
/* ── 节点容器 ─────────────────────────────────────────────────────── */
.table-node {
  min-width: 270px;
  background: #fff;
  border: 1.5px solid #CBD5E1;
  border-radius: 10px;
  overflow: visible;   /* Handle 需要超出边界 */
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  font-family: 'Inter', -apple-system, sans-serif;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.table-node:hover {
  border-color: #94A3B8;
  box-shadow: 0 6px 24px rgba(0,0,0,0.11);
}

.is-selected {
  border-color: #6366F1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18), 0 6px 24px rgba(0,0,0,0.11) !important;
}

/* ── 表头 ─────────────────────────────────────────────────────────── */
.node-header {
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top-left-radius: 9px;
  border-top-right-radius: 9px;
  cursor: grab;
  user-select: none;
}
.node-header:active { cursor: grabbing; }

.header-icon { flex-shrink: 0; }

.table-name {
  font-weight: 700;
  font-size: 12.5px;
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'JetBrains Mono', monospace;
}

.display-name {
  font-size: 10px;
  color: rgba(255,255,255,0.65);
  white-space: nowrap;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 字段列表 ─────────────────────────────────────────────────────── */
.node-body {
  background: #fff;
  border-bottom-left-radius: 9px;
  border-bottom-right-radius: 9px;
}

.field-row {
  height: 30px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #F1F5F9;
  position: relative;  /* Handle 相对于字段行定位 */
  transition: background 0.1s;
}

.field-row:last-child {
  border-bottom: none;
  border-bottom-left-radius: 9px;
  border-bottom-right-radius: 9px;
}

.field-row:hover { background: #F8FAFC; }

/* PK 字段：琥珀色左侧线 */
.field-pk {
  border-left: 3px solid #F59E0B;
  padding-left: 7px;
}

/* FK 字段：紫色左侧线 */
.field-fk {
  border-left: 3px solid #6366F1;
  padding-left: 7px;
}

/* ── 字段内容 ─────────────────────────────────────────────────────── */
.field-icon-wrap {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 14px;
}

.icon-pk { color: #F59E0B; }
.icon-fk { color: #6366F1; }

.field-dot {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #CBD5E1;
}

.field-name {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11.5px;
  color: #1E293B;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pk-bold { font-weight: 700; }

.field-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #94A3B8;
  flex-shrink: 0;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

/* ── Handle（字段连接点） ────────────────────────────────────────── */
/*
  Handle 放在字段行内（position:relative），
  absolute 定位到字段行左/右边缘，精确对齐字段中线。
*/
.field-handle {
  width: 10px !important;
  height: 10px !important;
  border-radius: 50% !important;
  background: #fff !important;
  border: 2px solid #CBD5E1 !important;
  transition: border-color 0.15s, transform 0.1s, opacity 0.2s !important;
  opacity: 0 !important;           /* 默认隐藏 */
  pointer-events: none !important; /* 默认不响应 */
}

/* 编辑模式下才显示 Handle */
.is-edit .field-handle {
  opacity: 1 !important;
  pointer-events: all !important;
}

.handle-left {
  left: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.handle-right {
  right: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

/* 编辑模式下 hover 效果 */
.is-edit .field-row:hover .field-handle {
  border-color: #6366F1 !important;
}

.is-edit .field-handle:hover {
  border-color: #6366F1 !important;
  background: #EEF2FF !important;
  transform: translateY(-50%) scale(1.4) !important;
  z-index: 10;
}
</style>
