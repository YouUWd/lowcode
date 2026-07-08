<template>
  <div class="er-diagram">

    <!-- ══ 工具栏 ════════════════════════════════════════════════════════ -->
    <div class="er-toolbar">
      <div class="toolbar-left">
        <!-- 侧栏折叠切换 -->
        <el-tooltip :content="showSidebar ? '收起侧栏' : '展开侧栏'" placement="bottom">
          <button class="sidebar-toggle-btn" @click="showSidebar = !showSidebar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" stroke-width="1.8"/>
              <path v-if="showSidebar" d="M6 10l-2 2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-else d="M6 10l2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </el-tooltip>
        <el-divider direction="vertical" style="height:16px;margin:0 4px" />
        <el-icon color="#6366F1" :size="18"><Connection /></el-icon>
        <span class="toolbar-title">ER 图管理</span>
        <div class="meta-pills" v-if="allTables.length">
          <span class="meta-pill">{{ allTables.length }} 张表</span>
          <span class="meta-pill">{{ schema.relations?.length ?? 0 }} 条关系</span>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- 模式切换 -->
        <el-tooltip :content="isEditMode ? '切换到只读模式' : '切换到编辑模式'">
          <el-button
            size="small"
            :type="isEditMode ? 'primary' : 'default'"
            @click="isEditMode = !isEditMode"
          >
            <el-icon style="margin-right:4px">
              <Edit v-if="isEditMode" />
              <View v-else />
            </el-icon>
            {{ isEditMode ? '编辑模式' : '只读模式' }}
          </el-button>
        </el-tooltip>

        <el-divider direction="vertical" />

        <el-button size="small" @click="runAutoLayout">
          <el-icon style="margin-right:4px"><Coordinate /></el-icon>
          自动排版
        </el-button>

        <el-button size="small" :loading="loading" @click="onRefresh">
          <el-icon style="margin-right:4px"><Refresh /></el-icon>
          刷新
        </el-button>

        <el-divider direction="vertical" />

        <el-button size="small" @click="onExportPng">
          <el-icon style="margin-right:4px"><Picture /></el-icon>
          导出 PNG
        </el-button>
      </div>
    </div>

    <!-- ══ 主体（左侧边栏 + 画布 + Inspector）═════════════════════════════ -->
    <div class="er-main">

      <!-- 左侧：表列表导航 -->
      <div class="er-sidebar" :class="{ collapsed: !showSidebar }">
        <template v-if="showSidebar">
          <div class="sidebar-search">
            <el-input v-model="tableSearch" size="small" placeholder="搜索表名..." clearable>
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <div class="sidebar-list">
            <div
              v-for="(table, idx) in filteredTables"
              :key="table.tableName"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': selectedTableName === table.tableName }"
              @click="onSidebarTableClick(table.tableName)"
            >
              <span class="sidebar-dot" :style="{ background: TABLE_COLORS[idx % TABLE_COLORS.length] }"></span>
              <div class="sidebar-item-info">
                <span class="sidebar-table-name">{{ table.tableName }}</span>
                <span class="sidebar-field-count">{{ table.fields.length }} 字段</span>
              </div>
            </div>
            <div v-if="!filteredTables.length" class="sidebar-empty">无匹配表</div>
          </div>
        </template>
      </div>

      <!-- 中央：Vue Flow 画布 -->
      <div class="er-canvas-wrap" ref="canvasWrapRef">
        <div v-if="loading" class="loading-overlay">
          <el-icon class="loading-spin" :size="32"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 编辑模式提示条 -->
        <div v-if="isEditMode" class="edit-hint">
          <el-icon><InfoFilled /></el-icon>
          编辑模式：从字段右侧的 ● 拖向目标字段左侧的 ● 可建立关系连线
        </div>

        <VueFlow
          :id="FLOW_ID"
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          :nodes-draggable="true"
          :nodes-connectable="isEditMode"
          :edges-updatable="false"
          :connect-on-click="false"
          :default-edge-options="{ type: 'relationEdge' }"
          fit-view-on-init
          class="er-canvas"
          @connect="onConnect"
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
        >
          <Background :variant="BackgroundVariant.Dots" :gap="24" :size="1.2" color="#D1D5DB" />
          <MiniMap :node-color="miniMapNodeColor" position="bottom-right" class="er-minimap" />
          <Controls position="top-right" class="er-controls" />
        </VueFlow>
      </div>

      <!-- 右侧：Inspector 面板 -->
      <InspectorPanel
        :table="selectedTable"
        :relations="schema.relations"
        :all-tables="allTables"
        :fk-field-ids="fkFieldIds"
        :table-index="selectedTableIndex"
        :saving="saving"
        @close="selectedTableName = null"
        @save="onInspectorSave"
        @add-relation="onInspectorAddRelation"
        @focus-relation="onFocusRelation"
        @delete-relation="onDeleteRelation"
      />
    </div>

    <!-- 关系建立弹窗 -->
    <RelationPopover
      v-model="showRelPopover"
      :connection="pendingConnection"
      :submitting="saving"
      :error-msg="relError"
      @confirm="onRelationConfirm"
      @cancel="pendingConnection = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, provide, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Connection, NodeMouseEvent } from '@vue-flow/core'
import { Background, BackgroundVariant } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import { ElMessage } from 'element-plus'

import TableNode from '../components/er/TableNode.vue'
import RelationEdge from '../components/er/RelationEdge.vue'
import RelationPopover from '../components/er/RelationPopover.vue'
import type { PendingConnection } from '../components/er/RelationPopover.vue'
import InspectorPanel from '../components/er/InspectorPanel.vue'

import { useErData, TABLE_COLORS } from '../composables/useErData'
import { applyDagreLayout } from '../composables/useErLayout'
import type { ErTable } from '../composables/useErData'

// ── Vue Flow 节点/边类型（markRaw 防止被 Vue 响应式包裹）────────────────────
const nodeTypes = { tableNode: markRaw(TableNode) }
const edgeTypes = { relationEdge: markRaw(RelationEdge) }

// ── Vue Flow ID（用于在父组件通过 useVueFlow(id) 调用 fitView 等 API）──────
const FLOW_ID = 'er-main-canvas'
const { fitView, setCenter } = useVueFlow({ id: FLOW_ID })

// ── 画布 nodes/edges 状态 ──────────────────────────────────────────────────
const nodes = ref<any[]>([])
const edges = ref<any[]>([])

// ── 数据层 ────────────────────────────────────────────────────────────────
const {
  schema, loading, saving, error,
  allTables, fkFieldIds, tablesMap,
  loadSchema, toVfNodes, toVfEdges,
  addRelation, removeRelation,
  updateTableDisplayName, updateField, updatePrimaryColumn, addField,
} = useErData()

// ── UI 状态 ───────────────────────────────────────────────────────────────
// 默认开启编辑模式，让用户一进来就能拖拽和建立关系
const isEditMode        = ref(true)
const showSidebar       = ref(true)
const tableSearch       = ref('')
const selectedTableName = ref<string | null>(null)
const canvasWrapRef     = ref<HTMLElement | null>(null)

// 激活的 Edge ID（provide 给 RelationEdge 使用）
const activeEdgeId = ref<string | null>(null)
provide('activeEdgeId', activeEdgeId)

// 关键：把 isEditMode 注入给所有 TableNode（控制 Handle 显隐）
provide('erEditMode', isEditMode)

// 关系建立弹窗状态
const showRelPopover    = ref(false)
const pendingConnection = ref<PendingConnection | null>(null)
const relError          = ref<string | null>(null)

// ── 计算属性 ──────────────────────────────────────────────────────────────
const filteredTables = computed(() => {
  const q = tableSearch.value.toLowerCase()
  return q
    ? allTables.value.filter(t => t.tableName.toLowerCase().includes(q))
    : allTables.value
})

const selectedTable = computed<ErTable | null>(() =>
  selectedTableName.value ? (tablesMap.value[selectedTableName.value] ?? null) : null
)

const selectedTableIndex = computed(() =>
  allTables.value.findIndex(t => t.tableName === selectedTableName.value)
)

const miniMapNodeColor = (node: any) => {
  const idx = allTables.value.findIndex(t => t.tableName === node.id)
  return TABLE_COLORS[Math.max(0, idx) % TABLE_COLORS.length]
}

// ── 初始化 ────────────────────────────────────────────────────────────────
async function init() {
  const result = await loadSchema()
  nodes.value = result.nodes
  edges.value = result.edges
  // 等 Vue Flow 渲染完毕再执行 Dagre 排版
  await nextTick()
  runAutoLayout(false)
}

// ── 自动排版 ──────────────────────────────────────────────────────────────
function runAutoLayout(showToast = true) {
  if (!nodes.value.length) return
  const laid = applyDagreLayout(nodes.value, edges.value)
  nodes.value = laid
  nextTick(() => {
    fitView({ padding: 0.12, duration: 400 })
    if (showToast) ElMessage.success({ message: '自动排版完成 ✓', duration: 900 })
  })
}

// ── 刷新 ──────────────────────────────────────────────────────────────────
async function onRefresh() {
  await init()
  ElMessage.success({ message: 'Schema 已刷新', duration: 1000 })
}

// ── 点击节点 → 打开 Inspector ─────────────────────────────────────────────
function onNodeClick({ node }: NodeMouseEvent) {
  selectedTableName.value = node.id
  activeEdgeId.value = null
}

// ── 点击画布空白 → 关闭选中 ───────────────────────────────────────────────
function onPaneClick() {
  if (!showRelPopover.value) {
    selectedTableName.value = null
    activeEdgeId.value = null
  }
}

// ── 左侧导航点击 → 定位到节点 ─────────────────────────────────────────────
function onSidebarTableClick(tableName: string) {
  selectedTableName.value = tableName
  const n = nodes.value.find(nd => nd.id === tableName)
  if (n) {
    setCenter(n.position.x + 135, n.position.y + 80, { zoom: 1.2, duration: 400 })
  }
}

// ── 拖拽 Handle 松开 → 弹出关系类型选择 ──────────────────────────────────
function onConnect(connection: Connection) {
  const { source, target, sourceHandle, targetHandle } = connection
  if (!source || !target || !sourceHandle || !targetHandle) return

  const sourceColumn = sourceHandle.replace('__src', '')
  const targetColumn = targetHandle.replace('__tgt', '')

  pendingConnection.value = { sourceTable: source, sourceColumn, targetTable: target, targetColumn }
  relError.value   = null
  showRelPopover.value = true
}

// ── 关系确认 ──────────────────────────────────────────────────────────────
async function onRelationConfirm(payload: {
  relationType: string; relationName: string; connection: PendingConnection
}) {
  relError.value = null
  const ok = await addRelation({
    name:          payload.relationName,
    sourceTable:   payload.connection.sourceTable,
    sourceColumn:  payload.connection.sourceColumn,
    targetTable:   payload.connection.targetTable,
    targetColumn:  payload.connection.targetColumn,
    sourceFieldId: 0,
    targetFieldId: 0,
    relationType:  payload.relationType,
  })

  if (ok) {
    showRelPopover.value    = false
    pendingConnection.value = null
    edges.value = toVfEdges()
    ElMessage.success('关系建立成功 ✓')
  } else {
    relError.value = error.value ?? '建立关系失败，请检查是否已存在相同字段关系'
  }
}

// ── Inspector 保存 ───────────────────────────────────────────────────────────────────────────
type InspectorSavePayload = {
  displayName:   string
  primaryColumn: string
  fields:        Array<{ columnName: string; label: string; dataType: string }>
  newFields:     Array<{ columnName: string; label: string; dataType: string }>
}

async function onInspectorSave(payload: InspectorSavePayload) {
  if (!selectedTableName.value) return
  await updateTableDisplayName(selectedTableName.value, payload.displayName)
  await updatePrimaryColumn(selectedTableName.value, payload.primaryColumn)
  for (const f of payload.fields) {
    await updateField(selectedTableName.value, f.columnName, { label: f.label, dataType: f.dataType })
  }
  // 新增字段
  for (const nf of payload.newFields) {
    if (nf.columnName.trim()) {
      await addField(selectedTableName.value, nf)
    }
  }
  // 保留已有拖拽坐标，只更新 data 内容
  const fresh = toVfNodes()
  nodes.value = nodes.value.map(existing => {
    const updated = fresh.find(n => n.id === existing.id)
    return updated ? { ...updated, position: existing.position } : existing
  })
  ElMessage.success('保存成功 ✓')
}

// ── Inspector 新增关系 ───────────────────────────────────────────────────────────────
async function onInspectorAddRelation(payload: {
  sourceTable: string; sourceColumn: string
  targetTable: string; targetColumn: string
  relationType: string; name: string
}) {
  const ok = await addRelation({
    name:          payload.name,
    sourceTable:   payload.sourceTable,
    sourceColumn:  payload.sourceColumn,
    targetTable:   payload.targetTable,
    targetColumn:  payload.targetColumn,
    sourceFieldId: 0,
    targetFieldId: 0,
    relationType:  payload.relationType,
  })
  if (ok) {
    edges.value = toVfEdges()
    ElMessage.success('关系建立成功 ✓')
  } else {
    ElMessage.error(error.value ?? '建立关系失败，请检查是否已存在相同关系')
  }
}

// ── 定位到连线 ────────────────────────────────────────────────────────────
function onFocusRelation(relId: number) {
  const edge = edges.value.find(e => e.id === `rel-${relId}`)
  if (edge) activeEdgeId.value = edge.id
}

// ── 删除关系 ──────────────────────────────────────────────────────────────
async function onDeleteRelation(relId: number) {
  const ok = await removeRelation(relId)
  if (ok) {
    edges.value = toVfEdges()
    ElMessage.success('关系已删除')
  }
}

// ── 导出 PNG ──────────────────────────────────────────────────────────────
async function onExportPng() {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const el = canvasWrapRef.value
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.download = `er-diagram-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('PNG 导出成功')
  } catch {
    ElMessage.error('导出失败，请重试')
  }
}

// 初始化
init()
</script>

<style scoped>
.er-diagram {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  font-family: 'Inter', -apple-system, sans-serif;
}

/* ── 工具栏 ───────────────────────────────────────────────────────── */
.er-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
  flex-shrink: 0;
  gap: 12px;
}
.toolbar-left  { display: flex; align-items: center; gap: 10px; }
.toolbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.toolbar-title { font-weight: 700; font-size: 14px; color: #1E293B; }

.meta-pills { display: flex; gap: 6px; }
.meta-pill {
  font-size: 11px; color: #475569;
  background: #F1F5F9; border: 1px solid #E2E8F0;
  padding: 2px 8px; border-radius: 20px;
}

/* ── 主体 ─────────────────────────────────────────────────────────── */
.er-main { display: flex; flex: 1; overflow: hidden; }

/* ── 左侧导航栏 ─────────────────────────────────────────────────────── */
.er-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #E2E8F0;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.er-sidebar.collapsed { width: 0; border-right: none; }

/* 工具栏折叠按钮 */
.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: #64748B;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  flex-shrink: 0;
  padding: 0;
}
.sidebar-toggle-btn:hover {
  background: #EEF2FF;
  color: #6366F1;
  border-color: #C7D2FE;
}
.sidebar-search { padding: 10px 10px 6px; flex-shrink: 0; }
.sidebar-list { flex: 1; overflow-y: auto; padding: 0 6px 10px; }
.sidebar-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 6px;
  cursor: pointer; transition: background 0.1s;
}
.sidebar-item:hover { background: #F1F5F9; }
.sidebar-item-active { background: #EEF2FF; }
.sidebar-dot  { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }
.sidebar-item-info { display: flex; flex-direction: column; min-width: 0; }
.sidebar-table-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px; color: #1E293B;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600;
}
.sidebar-field-count { font-size: 10px; color: #94A3B8; }
.sidebar-empty { font-size: 12px; color: #CBD5E1; text-align: center; padding: 20px 0; }

/* ── 画布区 ───────────────────────────────────────────────────────── */
.er-canvas-wrap { flex: 1; position: relative; overflow: hidden; }
.er-canvas { width: 100%; height: 100%; }

.loading-overlay {
  position: absolute; inset: 0; z-index: 100;
  background: rgba(255,255,255,0.85);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; font-size: 13px; color: #64748B;
  backdrop-filter: blur(2px);
}
.loading-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.edit-hint {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  z-index: 50;
  background: rgba(99,102,241,0.08); color: #6366F1;
  border: 1px solid #C7D2FE; border-radius: 20px;
  padding: 4px 14px; font-size: 11px;
  display: flex; align-items: center; gap: 5px;
  pointer-events: none; white-space: nowrap;
}

/* Vue Flow 组件样式覆盖 */
.er-minimap {
  border: 1px solid #E2E8F0; border-radius: 8px;
  overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
</style>
