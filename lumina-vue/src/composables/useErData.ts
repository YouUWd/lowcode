/**
 * useErData — Schema 数据管理 Composable
 *
 * 职责：
 * 1. 持有从后端加载的原始 schema 数据
 * 2. 将 schema 转换为 Vue Flow 所需的 nodes[] + edges[]
 * 3. 提供增删改关系、字段的方法，并持久化到后端
 * 4. localStorage 兜底（后端不可用时临时保存）
 */
import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { fetchMetaSchema, saveMetaSchema, ApiError } from '../api/er-schema'

// ─── 颜色调色盘 ──────────────────────────────────────────────────────────────
export const TABLE_COLORS = [
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

export const EDGE_COLORS = [
  '#7C3AED', '#0D9488', '#DB2777', '#2563EB', '#D97706',
  '#059669', '#DC2626', '#6366F1', '#0891B2', '#16A34A',
]

// ─── 类型定义 ────────────────────────────────────────────────────────────────
export interface ErField {
  id: number
  columnName: string
  label: string
  dataType: string
}

export interface ErTable {
  id: number
  tableName: string
  displayName: string
  primaryColumn: string
  fields: ErField[]
}

export interface ErRelation {
  id: number
  name: string
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  relationType: string // ONE_TO_ONE | ONE_TO_MANY | MANY_TO_ONE
}

export interface ErSchema {
  tables: ErTable[]
  relations: ErRelation[]
}

// ─── Composable ──────────────────────────────────────────────────────────────
const LS_KEY = 'er_schema_draft'

export function useErData() {
  const schema = ref<ErSchema>({ tables: [], relations: [] })
  const loading = ref(false)
  const saving  = ref(false)
  const error   = ref<string | null>(null)

  // 所有物理表
  const allTables = computed<ErTable[]>(() => {
    return schema.value.tables || []
  })

  // 外键字段 ID 集合（用于 TableNode 中渲染 FK 图标）
  const fkFieldIds = computed<Set<string>>(() => {
    const s = new Set<string>()
    ;(schema.value.relations || []).forEach(r => {
      if (r.targetTable && r.targetColumn) {
        s.add(`${r.targetTable}.${r.targetColumn}`)
      }
      if (r.sourceTable && r.sourceColumn) {
        s.add(`${r.sourceTable}.${r.sourceColumn}`)
      }
    })
    return s
  })

  // 表名 → 表对象的快速索引
  const tablesMap = computed<Record<string, ErTable>>(() => {
    const m: Record<string, ErTable> = {}
    allTables.value.forEach(t => { m[t.tableName] = t })
    return m
  })

  // ── 转换为 Vue Flow nodes ──────────────────────────────────────────────────
  const toVfNodes = (): Node[] => {
    const nodes: Node[] = []
    let tableIndex = 0
    ;(schema.value.tables || []).forEach(table => {
      nodes.push({
        id: table.tableName,
        type: 'tableNode',
        position: { x: 0, y: 0 }, // 由 Dagre 布局赋值
        data: {
          table,
          tableIndex,
          fkFieldIds: fkFieldIds.value,
        },
      })
      tableIndex++
    })
    return nodes
  }

  // ── 转换为 Vue Flow edges ──────────────────────────────────────────────────
  const toVfEdges = (): Edge[] => {
    return (schema.value.relations || []).map((rel, i) => ({
      id: `rel-${rel.id}`,
      type: 'relationEdge',
      source: rel.sourceTable,
      target: rel.targetTable,
      sourceHandle: `${rel.sourceColumn}__src`,
      targetHandle: `${rel.targetColumn}__tgt`,
      data: {
        rel,
        color: EDGE_COLORS[i % EDGE_COLORS.length],
      },
    }))
  }

  // ── 从后端加载 ─────────────────────────────────────────────────────────────
  const loadSchema = async (): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    loading.value = true
    error.value = null
    try {
      const data: ErSchema = await fetchMetaSchema()
      data.tables = data.tables || []
      data.relations   = data.relations   || []
      schema.value = data
      // 成功后同步写 localStorage
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
      return { nodes: toVfNodes(), edges: toVfEdges() }
    } catch (e: any) {
      error.value = e instanceof ApiError ? e.message : '加载 Schema 失败'
      // 降级到 localStorage
      try {
        const draft = localStorage.getItem(LS_KEY)
        if (draft) {
          schema.value = JSON.parse(draft)
          return { nodes: toVfNodes(), edges: toVfEdges() }
        }
      } catch {}
      return { nodes: [], edges: [] }
    } finally {
      loading.value = false
    }
  }

  // ── 保存全量 Schema 到后端 ─────────────────────────────────────────────────
  const saveSchema = async (): Promise<boolean> => {
    saving.value = true
    try {
      await saveMetaSchema(schema.value)
      // 保存成功后重新加载，获取后端分配的真实 ID
      await loadSchema()
      return true
    } catch (e: any) {
      error.value = e instanceof ApiError ? e.message : '保存 Schema 失败'
      return false
    } finally {
      saving.value = false
    }
  }

  // ── 添加新关系 ─────────────────────────────────────────────────────────────
  const addRelation = async (rel: Omit<ErRelation, 'id'>): Promise<boolean> => {
    // 查重（同时检查 A→B 和 B→A）
    const exists = schema.value.relations.some(r =>
      (r.sourceTable === rel.sourceTable && r.sourceColumn === rel.sourceColumn &&
       r.targetTable  === rel.targetTable  && r.targetColumn  === rel.targetColumn) ||
      (r.sourceTable === rel.targetTable && r.sourceColumn === rel.targetColumn &&
       r.targetTable  === rel.sourceTable  && r.targetColumn  === rel.sourceColumn)
    )
    if (exists) {
      error.value = '该字段对之间的关系已存在'
      return false
    }

    const newRel: ErRelation = {
      id: -Date.now(), // 临时 ID，后端保存后会替换
      ...rel,
    }

    schema.value.relations.push(newRel)
    return saveSchema()
  }

  // ── 删除关系 ───────────────────────────────────────────────────────────────
  const removeRelation = async (relId: number): Promise<boolean> => {
    schema.value.relations = schema.value.relations.filter(r => r.id !== relId)
    return saveSchema()
  }

  // ── 更新关系类型 ───────────────────────────────────────────────────────────
  const updateRelationType = async (relId: number, relationType: string): Promise<boolean> => {
    const rel = schema.value.relations.find(r => r.id === relId)
    if (!rel) return false
    rel.relationType = relationType
    return saveSchema()
  }

  // ── 更新表的显示名 ─────────────────────────────────────────────────────────
  const updateTableDisplayName = async (tableName: string, displayName: string): Promise<boolean> => {
    const t = schema.value.tables.find(t => t.tableName === tableName)
    if (t) { t.displayName = displayName }
    return saveSchema()
  }

  // ── 更新字段 ───────────────────────────────────────────────────────────────
  const updateField = async (
    tableName: string,
    columnName: string,
    patch: Partial<Pick<ErField, 'label' | 'dataType'>>,
  ): Promise<boolean> => {
    const t = schema.value.tables.find(t => t.tableName === tableName)
    if (t) {
      const f = t.fields.find(f => f.columnName === columnName)
      if (f) Object.assign(f, patch)
    }
    return saveSchema()
  }

  // ── 更新主键列 ─────────────────────────────────────────────────────────────
  const updatePrimaryColumn = async (tableName: string, primaryColumn: string): Promise<boolean> => {
    const t = schema.value.tables.find(t => t.tableName === tableName)
    if (t) { t.primaryColumn = primaryColumn }
    return saveSchema()
  }

  // ── 新增字段 ───────────────────────────────────────────────────────────────
  const addField = async (
    tableName: string,
    field: { columnName: string; label: string; dataType: string },
  ): Promise<boolean> => {
    if (!field.columnName.trim()) {
      error.value = '列名不能为空'
      return false
    }
    const t = schema.value.tables.find(t => t.tableName === tableName)
    if (t) {
      if (t.fields.some(f => f.columnName === field.columnName.trim())) {
        error.value = `字段 "${field.columnName}" 已存在`
        return false
      }
      t.fields.push({
        id: -Date.now(), // 临时 ID，后端保存后会替换
        columnName: field.columnName.trim(),
        label:      field.label.trim(),
        dataType:   field.dataType.trim() || 'VARCHAR',
      })
    }
    return saveSchema()
  }

  return {
    schema,
    loading,
    saving,
    error,
    allTables,
    tablesMap,
    loadSchema,
    saveSchema,
    toVfNodes,
    toVfEdges,
    addRelation,
    removeRelation,
    updateRelationType,
    updateTableDisplayName,
    updateField,
    updatePrimaryColumn,
    addField,
  }
}
