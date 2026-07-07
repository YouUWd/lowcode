<template>
  <div class="schema-designer">

    <!-- ── 顶部工具栏 ── -->
    <div class="action-panel">
      <div class="panel-left">
        <span class="title">数据库拓扑图谱</span>
        <span class="sub-title">Schema ER Diagram</span>
        <div class="meta-stats" v-if="allTables.length">
          <span class="stat-pill"><strong>{{ allTables.length }}</strong> 张表</span>
          <span class="stat-pill"><strong>{{ (schema.relations || []).length }}</strong> 条关系</span>
        </div>
      </div>
      <div class="panel-right">
        <el-button size="small" type="primary" plain :loading="loading" @click="fetchSchema">
          <el-icon style="margin-right:4px"><Refresh /></el-icon>刷新
        </el-button>
        <el-button size="small" type="success" plain @click="autoArrange">
          <el-icon style="margin-right:4px"><Coordinate /></el-icon>自动排版
        </el-button>
        <span class="tip-text">拖拽表头可微调布局</span>
      </div>
    </div>

    <!-- ── 关系图例 ── -->
    <div class="legend-bar" v-if="(schema.relations || []).length">
      <span
        v-for="(rel, i) in schema.relations"
        :key="'leg-' + rel.id"
        class="legend-item"
        :class="{ 'leg-active': activeRelId === rel.id }"
        @click="activeRelId = activeRelId === rel.id ? null : rel.id"
      >
        <span class="leg-line" :style="{ background: REL_COLORS[i % REL_COLORS.length] }"></span>
        <span class="leg-label">{{ rel.name || (rel.sourceTable + ' → ' + rel.targetTable) }}</span>
      </span>
    </div>

    <!-- ── 画布区 ── -->
    <div class="canvas-viewport">
      <div class="canvas-bg"></div>

      <!-- SVG 连线层 -->
      <svg class="svg-layer">
        <defs>
          <marker
            v-for="(color, i) in REL_COLORS"
            :key="'marker-' + i"
            :id="'arr-' + i"
            markerWidth="7" markerHeight="7"
            refX="5" refY="3.5" orient="auto"
          >
            <path d="M0,1 L5,3.5 L0,6 Z" :fill="color" />
          </marker>
          <marker id="arr-active" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,1 L5,3.5 L0,6 Z" fill="#2563EB" />
          </marker>
        </defs>

        <!-- 每条关系 -->
        <g v-for="(rel, i) in (schema.relations || [])" :key="'rel-' + rel.id">
          <!-- 透明宽触发区 -->
          <path
            :d="relPath(rel, i)"
            stroke="transparent" fill="none" stroke-width="14"
            style="cursor:pointer;pointer-events:auto;"
            @mouseenter="hoveredRelId = rel.id"
            @mouseleave="hoveredRelId = null"
            @click="activeRelId = activeRelId === rel.id ? null : rel.id"
          />

          <!-- 连线本体 -->
          <path
            :d="relPath(rel, i)"
            fill="none"
            :stroke="isRelActive(rel.id) ? '#2563EB' : REL_COLORS[i % REL_COLORS.length]"
            :stroke-width="isRelActive(rel.id) ? 2.2 : 1.6"
            :stroke-dasharray="isRelActive(rel.id) ? 'none' : '6 3'"
            :marker-end="isRelActive(rel.id) ? 'url(#arr-active)' : `url(#arr-${i % REL_COLORS.length})`"
            :opacity="0.85"
            style="animation: dashFlow 25s linear infinite; transition: stroke 0.15s, stroke-width 0.15s;"
          />

          <!-- ── 基数标记：1 侧（源表右边缘出口） ── -->
          <g :transform="`translate(${relEndpoints(rel, i).x1 + 14}, ${relEndpoints(rel, i).y1})`">
            <circle r="9" fill="white"
              :stroke="isRelActive(rel.id) ? '#2563EB' : REL_COLORS[i % REL_COLORS.length]"
              stroke-width="1.5"
            />
            <text text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700"
              :fill="isRelActive(rel.id) ? '#2563EB' : REL_COLORS[i % REL_COLORS.length]">1</text>
          </g>

          <!-- ── 基数标记：N 侧（目标表左边缘入口） ── -->
          <g :transform="`translate(${relEndpoints(rel, i).x2 - 14}, ${relEndpoints(rel, i).y2})`">
            <circle r="9" fill="white"
              :stroke="isRelActive(rel.id) ? '#2563EB' : REL_COLORS[i % REL_COLORS.length]"
              stroke-width="1.5"
            />
            <text text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700"
              :fill="isRelActive(rel.id) ? '#2563EB' : REL_COLORS[i % REL_COLORS.length]">N</text>
          </g>

          <!-- 悬浮时展示关系名 -->
          <text
            v-if="isRelActive(rel.id)"
            :x="relMidpoint(rel, i).x"
            :y="relMidpoint(rel, i).y - 8"
            text-anchor="middle"
            font-size="10" font-weight="600"
            :fill="REL_COLORS[i % REL_COLORS.length]"
            style="paint-order:stroke;stroke:#fff;stroke-width:3px;pointer-events:none;"
          >{{ rel.name || (rel.sourceTable + ' → ' + rel.targetTable) }}</text>
        </g>
      </svg>

      <!-- 拖拽容器 -->
      <div class="drag-container">
        <div
          v-for="(table, tIdx) in allTables"
          :key="table.tableName"
          class="table-card"
          :class="{
            'card-active': activeTable === table.tableName,
            'card-new': newTableNames.has(table.tableName)
          }"
          :style="{ left: getCoords(table.tableName).x + 'px', top: getCoords(table.tableName).y + 'px' }"
          @mousedown="activeTable = table.tableName"
        >
          <!-- 彩色表头 -->
          <div
            class="card-header"
            :style="{ background: TABLE_COLORS[tIdx % TABLE_COLORS.length] }"
            @mousedown.stop="onDragStart(table.tableName, $event)"
          >
            <div class="header-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
                <rect x="2" y="2" width="8" height="8" rx="1" fill="rgba(255,255,255,0.8)"/>
                <rect x="14" y="2" width="8" height="8" rx="1" fill="rgba(255,255,255,0.8)"/>
                <rect x="2" y="14" width="8" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
                <rect x="14" y="14" width="8" height="8" rx="1" fill="rgba(255,255,255,0.5)"/>
              </svg>
              <span class="table-name">{{ table.tableName }}</span>
            </div>
            <span class="table-display-name">{{ table.displayName }}</span>
          </div>

          <!-- 字段列表 -->
          <div class="card-body">
            <div
              v-for="field in table.fields"
              :key="field.id"
              class="field-row"
              :class="{
                'field-pk': isPrimaryKey(table, field.columnName),
                'field-fk': isForeignKey(field.id),
                'field-rel': isRelatedField(field.id),
              }"
            >
              <!-- 左侧：字段图标 + 名称 -->
              <div class="field-left">
                <!-- PK 图标 -->
                <svg v-if="isPrimaryKey(table, field.columnName)"
                  width="12" height="12" viewBox="0 0 24 24" fill="none" class="field-icon icon-pk-svg">
                  <circle cx="8" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                  <path d="M13 12h8M17 9l4 3-4 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <!-- FK 图标 -->
                <svg v-else-if="isForeignKey(field.id)"
                  width="12" height="12" viewBox="0 0 24 24" fill="none" class="field-icon icon-fk-svg">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <!-- 普通字段 -->
                <span v-else class="field-icon icon-normal-dot"></span>

                <span class="field-name">{{ field.columnName }}</span>
              </div>

              <!-- 右侧：数据类型 -->
              <span class="field-type">{{ field.dataType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { fetchMetaSchema, ApiError } from '../api'
import { ElMessage } from 'element-plus'

// ─── 调色盘 ───────────────────────────────────────────────────────────────────

/** 每张物理表的 Header 颜色（顺序分配） */
const TABLE_COLORS = [
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#DB2777', // Pink
  '#2563EB', // Blue
  '#D97706', // Amber
  '#059669', // Emerald
  '#DC2626', // Red
  '#6366F1', // Indigo
  '#0891B2', // Cyan
  '#16A34A', // Green
]

/** 每条关系连线的颜色（顺序分配，与表头色相错开） */
const REL_COLORS = [
  '#7C3AED',
  '#0D9488',
  '#DB2777',
  '#2563EB',
  '#D97706',
  '#059669',
  '#DC2626',
  '#6366F1',
  '#0891B2',
  '#16A34A',
]

// ─── 类型 ──────────────────────────────────────────────────────────────────────
interface Field { id: number; columnName: string; label: string; dataType: string }
interface Table { id: number; tableName: string; displayName: string; primaryColumn: string; fields: Field[] }
interface Relation {
  id: number; name: string
  sourceFieldId: number; sourceTable: string; sourceColumn: string
  targetFieldId: number; targetTable: string; targetColumn: string
  relationType: string
}
interface Schema {
  datasources: Array<{ id: number; name: string; dbType: string; tables: Table[] }>
  relations: Relation[]
}

// ─── 状态 ──────────────────────────────────────────────────────────────────────
const schema      = ref<Schema>({ datasources: [], relations: [] })
const loading     = ref(false)
const coordinates = ref<Record<string, { x: number; y: number }>>({})
const activeTable  = ref<string | null>(null)
const hoveredRelId = ref<number | null>(null)
const activeRelId  = ref<number | null>(null)

/** 追踪哪些表是本次刷新新增的（用于短暂高亮动画） */
const newTableNames = ref<Set<string>>(new Set())

/** 定时轮询句柄（可选：默认关闭，用户可按刷新按钮手动更新） */
let pollTimer: ReturnType<typeof setInterval> | null = null

// ─── 计算属性 ──────────────────────────────────────────────────────────────────
const allTables = computed<Table[]>(() => {
  const list: Table[] = []
  ;(schema.value?.datasources || []).forEach(ds => ds.tables && list.push(...ds.tables))
  return list
})

const tablesMap = computed<Record<string, Table>>(() => {
  const m: Record<string, Table> = {}
  allTables.value.forEach(t => { m[t.tableName] = t })
  return m
})

const fkFieldIds = computed<Set<number>>(() => {
  const s = new Set<number>()
  ;(schema.value?.relations || []).forEach(r => { if (r.targetFieldId) s.add(r.targetFieldId) })
  return s
})

const relFieldIds = computed<Set<number>>(() => {
  const s = new Set<number>()
  ;(schema.value?.relations || []).forEach(r => {
    if (r.sourceFieldId) s.add(r.sourceFieldId)
    if (r.targetFieldId) s.add(r.targetFieldId)
  })
  return s
})

const isPrimaryKey  = (t: Table, col: string) => t.primaryColumn === col
const isForeignKey  = (id: number) => fkFieldIds.value.has(id)
const isRelatedField = (id: number) => relFieldIds.value.has(id)
const isRelActive   = (id: number) => hoveredRelId.value === id || activeRelId.value === id

// ─── 布局常量 ──────────────────────────────────────────────────────────────────
const CARD_W   = 260   // 卡片宽度 px
const HEADER_H = 38    // 头部高度 px
const FIELD_H  = 30    // 单行字段高度 px
const CARD_GAP = 48    // 卡片纵向间距 px
const COL_GAP  = 140   // 列间距 px
const MARKER_R = 9     // 基数圆半径 px

const cardH = (name: string) => {
  const t = tablesMap.value[name]
  return HEADER_H + (t ? t.fields.length * FIELD_H : 0)
}

const getCoords = (name: string) => {
  if (!coordinates.value[name]) {
    const c = Object.keys(coordinates.value).length
    coordinates.value[name] = {
      x: 80 + (c % 3) * (CARD_W + COL_GAP),
      y: 80 + Math.floor(c / 3) * 280,
    }
  }
  return coordinates.value[name]
}

// ─── 自动分层排版 ──────────────────────────────────────────────────────────────
/**
 * @param preserveExisting  true = 保留已有坐标，只为新表分配位置（增量模式）
 *                          false = 全量重新计算所有坐标（手动重排模式）
 */
const autoArrange = (preserveExisting = false) => {
  const tables = allTables.value
  const rels   = schema.value.relations || []
  if (!tables.length) return

  // ① 计算出入度，用于分层
  const inD: Record<string, number>  = {}
  const outD: Record<string, number> = {}
  tables.forEach(t => { inD[t.tableName] = 0; outD[t.tableName] = 0 })
  rels.forEach(r => {
    if (r.sourceTable && outD[r.sourceTable] !== undefined) outD[r.sourceTable]++
    if (r.targetTable && inD[r.targetTable] !== undefined)  inD[r.targetTable]++
  })

  // ② 分层（全量或只对新表分层）
  const toPlace = preserveExisting
    ? tables.filter(t => !coordinates.value[t.tableName])  // 只处理坐标未知的新表
    : tables

  const cols: [string[], string[], string[], string[]] = [[], [], [], []]
  toPlace.forEach(t => {
    const n = t.tableName
    const ind = inD[n] || 0, outd = outD[n] || 0
    if (!ind && !outd) cols[3].push(n)
    else if (!ind && outd) cols[0].push(n)
    else if (ind && outd)  cols[1].push(n)
    else                   cols[2].push(n)
  })

  const colX = [60, 60 + CARD_W + COL_GAP, 60 + (CARD_W + COL_GAP) * 2]

  // ③ 构建新坐标对象：全量模式从零开始，增量模式叠加到现有坐标之上
  const newC: Record<string, { x: number; y: number }> = preserveExisting
    ? { ...coordinates.value }  // 保留已有拖拽位置
    : {}

  const placeCol = (names: string[], x: number, startY = 80) => {
    // 增量模式：在该列已有卡片的最底部追加，避免与现有卡片重叠
    let y = startY
    if (preserveExisting) {
      // 找出该列（X 位置相近 ±60px）已有卡片的最大 bottom
      const colBottom = Object.entries(coordinates.value)
        .filter(([, c]) => Math.abs(c.x - x) < 60)
        .reduce((maxY, [name, c]) => Math.max(maxY, c.y + cardH(name) + CARD_GAP), startY)
      y = colBottom
    }
    names.forEach(n => {
      newC[n] = { x, y }
      y += cardH(n) + CARD_GAP
    })
  }

  placeCol(cols[0], colX[0], 80)
  placeCol(cols[1], colX[1], 60)
  placeCol(cols[2], colX[2], 80)
  const isoStartY = 80 + (preserveExisting ? 0 : cols[0].reduce((s, n) => s + cardH(n) + CARD_GAP, 0))
  placeCol(cols[3], colX[0], isoStartY)

  coordinates.value = newC
  if (!preserveExisting) {
    ElMessage.success({ message: '全量重排完成 ✓', duration: 900 })
  }
}

// ─── 响应式监听：拓扑变化时增量自适应 ─────────────────────────────────────────
/**
 * 监听 allTables 变化：
 * - 有新增表 → 以增量模式安插到画布末尾，并短暂高亮
 * - 有删除表 → 清理其坐标，防止孤立坐标堆积
 */
watch(allTables, (newTables, oldTables) => {
  const oldNames = new Set((oldTables || []).map(t => t.tableName))
  const newNames = new Set(newTables.map(t => t.tableName))

  // 找出新增表和已删除表
  const added   = newTables.filter(t => !oldNames.has(t.tableName))
  const removed = (oldTables || []).filter(t => !newNames.has(t.tableName))

  // 清理已删除表的坐标
  if (removed.length) {
    const cleaned = { ...coordinates.value }
    removed.forEach(t => delete cleaned[t.tableName])
    coordinates.value = cleaned
  }

  // 增量放置新增表
  if (added.length) {
    newTableNames.value = new Set(added.map(t => t.tableName))
    nextTick(() => {
      autoArrange(true)  // 保留现有坐标，只为新表分配位置
      ElMessage.info({
        message: `检测到 ${added.length} 张新表，已自动追加到画布 ✦`,
        duration: 2500
      })
      // 3 秒后取消高亮动画
      setTimeout(() => { newTableNames.value = new Set() }, 3000)
    })
  }
}, { deep: false })

// ─── SVG 路径计算 ──────────────────────────────────────────────────────────────

/** 同源字段有多条连线时，做 Y 轴偏移防止重叠 */
const fieldOffset = (rel: Relation): number => {
  const siblings = (schema.value.relations || []).filter(
    r => r.sourceTable === rel.sourceTable && r.sourceColumn === rel.sourceColumn
  )
  if (siblings.length <= 1) return 0
  const pos = siblings.findIndex(r => r.id === rel.id)
  return (pos - (siblings.length - 1) / 2) * 7
}

/** 计算连线起止端点坐标 */
const relEndpoints = (rel: Relation, _i: number) => {
  const sc  = getCoords(rel.sourceTable)
  const tc  = getCoords(rel.targetTable)
  const st  = tablesMap.value[rel.sourceTable]
  const tt  = tablesMap.value[rel.targetTable]

  let sIdx = st?.fields.findIndex(f => f.columnName === rel.sourceColumn) ?? 0
  let tIdx = tt?.fields.findIndex(f => f.columnName === rel.targetColumn) ?? 0
  if (sIdx < 0) sIdx = 0
  if (tIdx < 0) tIdx = 0

  const off = fieldOffset(rel)

  // 起点在源表右边缘，终点在目标表左边缘
  const x1 = sc.x + CARD_W
  const y1 = sc.y + HEADER_H + sIdx * FIELD_H + FIELD_H / 2 + off
  const x2 = tc.x
  const y2 = tc.y + HEADER_H + tIdx * FIELD_H + FIELD_H / 2 + off

  return { x1, y1, x2, y2 }
}

/** SVG 折线路径（正交折弯，留出基数圆的空间）*/
const relPath = (rel: Relation, i: number): string => {
  const { x1, y1, x2, y2 } = relEndpoints(rel, i)
  const pad  = MARKER_R + 5
  const midX = (x1 + pad + x2 - pad) / 2
  // 折弯路径：从基数圆右边缘到基数圆左边缘
  return `M ${x1 + pad} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2 - pad} ${y2}`
}

/** 关系名称标签位于折线中点 */
const relMidpoint = (rel: Relation, i: number) => {
  const { x1, y1 } = relEndpoints(rel, i)
  const { x2 }     = relEndpoints(rel, i)
  return { x: (x1 + x2) / 2, y: y1 }
}

// ─── 数据加载 ──────────────────────────────────────────────────────────────────
const fetchSchema = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    const res  = await fetchMetaSchema()
    const data = res.data || { datasources: [], relations: [] }
    data.datasources = data.datasources || []
    data.relations   = data.relations   || []

    const isFirstLoad = allTables.value.length === 0
    schema.value = data

    // 首次加载：全量排版；后续刷新：增量感知（watch 会自动处理新增表，这里仅处理关系变化）
    if (isFirstLoad) {
      nextTick(() => autoArrange(false))
    }
    // 关系变化时（新增/删除），SVG 连线是响应式的，会自动重绘，无需手动处理
  } catch (err: any) {
    if (!silent) ElMessage.error(err instanceof ApiError ? err.message : '获取全局元数据失败')
  } finally {
    if (!silent) loading.value = false
  }
}

// ─── 拖拽 ─────────────────────────────────────────────────────────────────────
let dragTable = '', sx = 0, sy = 0, scx = 0, scy = 0

const onDragStart = (name: string, e: MouseEvent) => {
  dragTable = name; sx = e.clientX; sy = e.clientY
  const c = getCoords(name); scx = c.x; scy = c.y
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup',   onDragEnd)
}
const onDragMove = (e: MouseEvent) => {
  if (!dragTable) return
  coordinates.value[dragTable] = {
    x: Math.max(10, scx + e.clientX - sx),
    y: Math.max(10, scy + e.clientY - sy),
  }
}
const onDragEnd = () => {
  dragTable = ''
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup',   onDragEnd)
}

onMounted(() => {
  fetchSchema()
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
/* ── 整体面板 ──────────────────────────────────────────────────────── */
.schema-designer {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  width: 100%;
  height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #FAFBFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  box-sizing: border-box;
}

/* ── 顶部工具栏 ─────────────────────────────────────────────────────── */
.action-panel {
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
  padding: 9px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
}
.panel-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.title {
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
}
.sub-title {
  font-size: 10px;
  color: #64748B;
  border: 1px solid #E2E8F0;
  padding: 2px 7px;
  border-radius: 4px;
  background: #F8FAFC;
  font-family: monospace;
}
.meta-stats {
  display: flex;
  gap: 6px;
}
.stat-pill {
  font-size: 11px;
  color: #475569;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  padding: 2px 8px;
  border-radius: 20px;
}
.panel-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tip-text { font-size: 11px; color: #94A3B8; }

/* ── 图例栏 ─────────────────────────────────────────────────────────── */
.legend-bar {
  background: #fff;
  border-bottom: 1px solid #F1F5F9;
  padding: 6px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 20px;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.legend-item:hover { background: #F1F5F9; }
.legend-item.leg-active { border-color: #CBD5E1; background: #F8FAFC; }
.leg-line {
  display: inline-block;
  width: 18px;
  height: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}
.leg-label {
  font-size: 11px;
  color: #475569;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 画布视口 ───────────────────────────────────────────────────────── */
.canvas-viewport {
  flex: 1;
  position: relative;
  overflow: auto;
  user-select: none;
}

/* 网格点 */
.canvas-bg {
  position: absolute;
  top: 0; left: 0;
  width: 2200px; height: 1800px;
  pointer-events: none;
  background-image: radial-gradient(circle, #D1D5DB 1px, transparent 1px);
  background-size: 22px 22px;
}

/* SVG 层 */
.svg-layer {
  position: absolute;
  top: 0; left: 0;
  width: 2200px; height: 1800px;
  pointer-events: none;
  z-index: 10;
  overflow: visible;
}

/* 拖拽容器 */
.drag-container {
  position: relative;
  width: 2200px;
  height: 1800px;
}

/* ── 表卡片 ─────────────────────────────────────────────────────────── */
.table-card {
  position: absolute;
  width: 260px;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 2px 10px rgba(0,0,0,0.07);
  box-sizing: border-box;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.table-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.13);
  border-color: #CBD5E1;
}
.card-active {
  border-color: #6366F1 !important;
  box-shadow: 0 8px 28px rgba(99,102,241,0.18) !important;
}

/* ── 彩色表头 ───────────────────────────────────────────────────────── */
.card-header {
  height: 38px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  gap: 8px;
  box-sizing: border-box;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1;
}
.table-name {
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.table-display-name {
  color: rgba(255,255,255,0.65);
  font-size: 10px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

/* ── 字段列表 ───────────────────────────────────────────────────────── */
.card-body {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.field-row {
  height: 30px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;
  box-sizing: border-box;
  gap: 6px;
  transition: background 0.12s;
}
.field-row:last-child { border-bottom: none; }
.field-row:hover { background: #F8FAFC; }

/* PK 行：左侧加淡黄色 accent 线 */
.field-pk {
  border-left: 3px solid #F59E0B;
  padding-left: 9px;
}
/* FK 行：左侧加淡蓝色 accent 线 */
.field-fk {
  border-left: 3px solid #6366F1;
  padding-left: 9px;
}
/* 参与关系的行底色 */
.field-rel { background: #FAFBFF; }
.field-rel:hover { background: #F0F1FF; }

.field-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

/* 字段图标 */
.field-icon { flex-shrink: 0; }
.icon-pk-svg  { color: #F59E0B; }
.icon-fk-svg  { color: #6366F1; }
.icon-normal-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #D1D5DB;
  flex-shrink: 0;
}

.field-name {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11.5px;
  color: #1E293B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: #94A3B8;
  flex-shrink: 0;
  text-align: right;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 连线流动动画 ─────────────────────────────────────────────────────── */
/* 新增表进场动画 */
.card-new {
  animation: newCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
             newCardGlow 3s ease-in-out forwards;
}

@keyframes newCardIn {
  from { opacity: 0; transform: scale(0.88) translateY(10px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}

@keyframes newCardGlow {
  0%   { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); border-color: #6366F1; }
  40%  { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.15); border-color: #6366F1; }
  100% { box-shadow: 0 2px 10px rgba(0,0,0,0.07); border-color: #E2E8F0; }
}

/* 连线流动动画 */
@keyframes dashFlow {
  to { stroke-dashoffset: -40; }
}
</style>
