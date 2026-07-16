<template>
  <div class="flex flex-col h-full w-full overflow-hidden bg-white">
    <div class="p-8 flex flex-col flex-1 overflow-hidden w-full animate-in fade-in duration-500 text-on-surface">
      
      <!-- ══ Unified Canvas Card (Header + Canvas) ════════════════════════════════════════════════════════ -->
      <div class="bg-surface-container-low rounded-2xl shadow-sm overflow-hidden border border-outline-variant/15 flex-1 relative flex flex-col mt-[-1rem]">
        
        <!-- Compact Toolbar Row -->
        <div class="flex flex-wrap justify-between items-center gap-3 px-4 py-2.5 border-b border-outline-variant/30 bg-surface z-10 shrink-0">
          <div class="flex-1"></div>

          <div class="flex items-center gap-3 flex-wrap justify-end">
            <div class="flex gap-3 items-center min-w-0" v-if="allTables.length">
              <!-- 表列表选择框 -->
              <div class="relative w-48 flex items-center rounded bg-surface-container-lowest border border-outline-variant/30 py-1 pl-2.5 pr-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-shadow cursor-pointer" v-click-outside="() => tableDropdownOpen = false" @click="tableDropdownOpen = !tableDropdownOpen">
                <div class="flex items-center min-w-0 mr-2 flex-shrink-0">
                  <span class="text-[11px] text-on-surface-variant font-medium whitespace-nowrap">{{ allTables.length }} 表</span>
                  <div class="w-px h-3 bg-outline-variant/30 mx-1.5"></div>
                </div>
                <div class="relative flex-1 flex items-center min-w-0">
                  <span class="block truncate text-xs text-on-surface font-medium flex-1 text-left">
                    {{ selectedTableName || '定位表...' }}
                  </span>
                  <ChevronDown class="h-3.5 w-3.5 text-on-surface-variant transition-transform ml-1 flex-shrink-0" :class="{'rotate-180': tableDropdownOpen}" aria-hidden="true" />

                  <transition enter-active-class="transition duration-100 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-75 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                    <div v-if="tableDropdownOpen" class="absolute top-full left-0 mt-2 max-h-60 min-w-[14rem] overflow-auto rounded-xl bg-surface-container-lowest p-1.5 shadow-[0px_8px_24px_rgba(25,28,29,0.12)] border border-outline-variant/20 focus:outline-none sm:text-sm custom-scrollbar z-50" @click.stop>
                      <div
                        v-for="(table, idx) in allTables"
                        :key="table.tableName"
                        @click="selectedTableName = table.tableName; onSidebarTableClick(table.tableName); tableDropdownOpen = false"
                        class="relative cursor-pointer select-none py-1.5 px-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors hover:bg-primary/5 hover:text-primary text-on-surface"
                        :class="{'bg-primary/5 text-primary font-bold': selectedTableName === table.tableName}"
                      >
                        <div class="flex items-center min-w-0">
                          <span class="w-2 h-2 rounded-sm shrink-0 mr-2" :style="{ background: TABLE_COLORS[idx % TABLE_COLORS.length] }"></span>
                          <span class="block truncate text-xs">{{ table.tableName }}</span>
                        </div>
                        <span class="text-[10px] shrink-0 opacity-70">{{ table.fields.length }} 字段</span>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>

              <!-- 关系列表选择框 -->
              <div class="relative w-56 flex items-center rounded bg-surface-container-lowest border border-outline-variant/30 py-1 pl-2.5 pr-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-shadow cursor-pointer" v-click-outside="() => relDropdownOpen = false" @click="relDropdownOpen = !relDropdownOpen">
                <div class="flex items-center min-w-0 mr-2 flex-shrink-0">
                  <span class="text-[11px] text-on-surface-variant font-medium whitespace-nowrap">{{ schema.relations?.length ?? 0 }} 关系</span>
                  <div class="w-px h-3 bg-outline-variant/30 mx-1.5"></div>
                </div>
                <div class="relative flex-1 flex items-center min-w-0">
                  <span class="block truncate text-xs text-on-surface font-medium flex-1 text-left">
                    {{ activeRelationId ? schema.relations.find(r => r.id === activeRelationId)?.name : '定位关系...' }}
                  </span>
                  <ChevronDown class="h-3.5 w-3.5 text-on-surface-variant transition-transform ml-1 flex-shrink-0" :class="{'rotate-180': relDropdownOpen}" aria-hidden="true" />

                  <transition enter-active-class="transition duration-100 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-75 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                    <div v-if="relDropdownOpen" class="absolute top-full left-0 mt-2 max-h-60 min-w-[18rem] overflow-auto rounded-xl bg-surface-container-lowest p-1.5 shadow-[0px_8px_24px_rgba(25,28,29,0.12)] border border-outline-variant/20 focus:outline-none sm:text-sm custom-scrollbar z-50" @click.stop>
                      <div
                        v-for="rel in schema.relations"
                        :key="rel.id"
                        @click="activeRelationId = rel.id; onFocusRelation(rel.id); relDropdownOpen = false"
                        class="relative cursor-pointer select-none py-1.5 px-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors hover:bg-primary/5 hover:text-primary text-on-surface"
                        :class="{'bg-primary/5 text-primary font-bold': activeRelationId === rel.id}"
                      >
                        <span class="block truncate text-xs flex-1">{{ rel.name }}</span>
                        <span class="text-[10px] font-mono shrink-0 opacity-70">{{ rel.nodes?.[0]?.tableName }} → {{ rel.nodes?.[1]?.tableName }}</span>
                      </div>
                    </div>
                  </transition>
                </div>
              </div>
            </div>

            <div class="w-px bg-outline-variant/30 h-4 hidden sm:block mx-1"></div>

            <div class="flex items-center gap-1.5">
            <!-- 模式切换 -->
            <button
              @click="isEditMode = !isEditMode"
              class="px-2.5 py-1 text-xs font-semibold rounded border transition-all flex items-center gap-1 cursor-pointer"
              :class="isEditMode ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container'"
              :title="isEditMode ? '切换到只读模式' : '切换到编辑模式'"
            >
              <component :is="isEditMode ? Pencil : Eye" class="w-3.5 h-3.5" />
              {{ isEditMode ? '编辑模式' : '只读模式' }}
            </button>

            <div class="w-px bg-outline-variant/30 h-4 mx-1"></div>

            <button @click="runAutoLayout" class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <LayoutTemplate class="w-3.5 h-3.5" />
              自动排版
            </button>

            <button @click="onRefresh" :disabled="loading" class="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer border border-transparent disabled:opacity-50 disabled:cursor-not-allowed" title="刷新数据">
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            </button>

            <div class="w-px bg-outline-variant/30 h-4 mx-1"></div>

            <button @click="onExportPng" class="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              <ImageIcon class="w-3.5 h-3.5" />
              导出 PNG
            </button>
          </div>
          </div>
        </div>

        <!-- 主体（画布 + Inspector） -->
        <div class="flex-1 relative flex overflow-hidden">
        
        <!-- 中央：Vue Flow 画布 -->
      <div class="er-canvas-wrap" ref="canvasWrapRef">
        <div v-if="loading" class="loading-overlay">
          <Loader2 class="w-8 h-8 text-primary animate-spin" />
          <span>加载中...</span>
        </div>

        <!-- 编辑模式提示条 -->
        <div v-if="isEditMode" class="edit-hint">
          <Info class="w-4 h-4" />
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
          <Background :variant="BackgroundVariant.Dots" :gap="24" :size="1.2" color="#005daa" class="opacity-30" />
          <MiniMap :node-color="miniMapNodeColor" position="bottom-right" class="er-minimap" pannable zoomable />
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
        @update-relation-type="onUpdateRelationType"
        @update-relation="onUpdateRelation"
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
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, provide, nextTick } from 'vue'
import { hoveredTableId, hoveredFieldId } from '../../composables/useHoverState'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import type { Connection, NodeMouseEvent } from '@vue-flow/core'
import { Background, BackgroundVariant } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import { ElMessage } from 'element-plus'
import { ChevronDown, Database, Pencil, Eye, LayoutTemplate, RefreshCw, Image as ImageIcon, Loader2, Info } from 'lucide-vue-next'

import TableNode from './components/TableNode.vue'
import RelationEdge from './components/RelationEdge.vue'
import RelationPopover from './components/RelationPopover.vue'
import type { PendingConnection } from './components/RelationPopover.vue'
import InspectorPanel from './components/InspectorPanel.vue'

import { useErData, TABLE_COLORS } from '../../composables/useErData'

const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
}
import { applyDagreLayout } from '../../composables/useErLayout'
import type { ErTable } from '../../composables/useErData'

// ── Vue Flow 节点/边类型（markRaw 防止被 Vue 响应式包裹）────────────────────
const nodeTypes = { tableNode: markRaw(TableNode) }
const edgeTypes = { relationEdge: markRaw(RelationEdge) }

// ── Vue Flow ID（用于在父组件通过 useVueFlow(id) 调用 fitView 等 API）──────
const FLOW_ID = 'er-main-canvas'
const { fitView, setCenter } = useVueFlow(FLOW_ID)

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
const isEditMode        = ref(false)
const selectedTableName = ref<string | null>(null)
const tableDropdownOpen = ref(false)
const relDropdownOpen   = ref(false)
const activeRelationId  = ref<number | null>(null)
const canvasWrapRef     = ref<HTMLElement | null>(null)

// 激活的 Edge ID（provide 给 RelationEdge 使用）
const activeEdgeId = ref<string | null>(null)
provide('activeEdgeId', activeEdgeId)
provide('activeTableId', selectedTableName)

// 关键：把 isEditMode 注入给所有 TableNode（控制 Handle 显隐）
provide('erEditMode', isEditMode)

// 关系建立弹窗状态
const showRelPopover    = ref(false)
const pendingConnection = ref<PendingConnection | null>(null)
const relError          = ref<string | null>(null)

// ── 计算属性 ──────────────────────────────────────────────────────────────
const filteredTables = computed(() => allTables.value)

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
    activeRelationId.value = null
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

async function onUpdateRelation(payload: { relId: number; sourceTable: string; sourceColumn: string; targetTable: string; targetColumn: string; relationType: string; name: string }) {
  const ok = await updateRelation(payload.relId, payload)
  if (ok) {
    edges.value = toVfEdges()
    ElMessage.success('关系已更新')
  }
}

async function onUpdateRelationType(payload: { relId: number, relationType: string }) {
  const ok = await updateRelationType(payload.relId, payload.relationType)
  if (ok) {
    edges.value = toVfEdges()
    ElMessage.success('关系类型已更新')
  }
}

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
    link.download = `diagram-${Date.now()}.png`
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
.diagram {
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

.meta-pill {
  font-size: 11px; color: #475569;
  background: #F1F5F9; border: 1px solid #E2E8F0;
  padding: 2px 8px; border-radius: 20px;
}

/* ── 主体 ─────────────────────────────────────────────────────────── */
.er-main { display: flex; flex: 1; overflow: hidden; }

/* ── 工具栏折叠按钮 ─────────────────────────────────────────────────────── */
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
