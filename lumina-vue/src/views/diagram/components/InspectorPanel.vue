<template>
  <!--
    InspectorPanel — 右侧详情/编辑面板
    功能：
    1. 编辑表显示名
    2. 设置主键字段
    3. 编辑已有字段（label / dataType）
    4. ★ 新增字段（列名 + 标签 + 类型）
    5. ★ 从本表发起新增关系（源字段 → 目标表.目标字段，关系类型）
    6. 删除关系
  -->
  <div class="inspector" :class="{ open: !!table }">
    <div v-if="table" class="inspector-inner">

      <!-- ── 面板标题栏 ── -->
      <div class="inspector-header">
        <div class="inspector-title">
          <span class="title-badge" :style="{ background: titleColor }"></span>
          <div>
            <div class="title-table">{{ table.tableName }}</div>
            <div class="title-sub">{{ table.fields.length + newFields.length }} 个字段</div>
          </div>
        </div>
        <button class="p-1 hover:bg-surface-container-highest rounded-lg transition-colors cursor-pointer" @click="emit('close')">
          <X class="w-4 h-4 text-on-surface-variant"/>
        </button>
      </div>

      <!-- ── 可滚动内容区 ── -->
      <div class="inspector-scroll">

        <!-- §1 基本信息 -->
        <div class="section">
          <div class="section-title">基本信息</div>
          <div class="form-row">
            <label>物理表名</label>
            <input :value="table.tableName" disabled class="w-full rounded-md border border-outline-variant/30 bg-surface-container-low text-on-surface-variant text-[13px] py-1.5 px-2.5 font-mono cursor-not-allowed focus:outline-none"/>
          </div>
          <div class="form-row">
            <label>显示名称</label>
            <input v-model="editDisplayName" class="w-full rounded-md border border-outline-variant/30 bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary py-1.5 px-2.5 outline-none transition-shadow" placeholder="中文名，如：订单表"/>
          </div>
          <div class="form-row">
            <label>主键字段</label>
            <select v-model="editPrimaryColumn" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none">
              <option v-for="f in table.fields" :key="f.columnName" :value="f.columnName">{{ f.columnName }}</option>
            </select>
          </div>
        </div>

        <!-- §2 字段列表 + 新增字段 -->
        <div class="section section-fields">
          <div class="section-title-row">
            <span class="section-title">字段列表</span>
            <button
              class="text-primary hover:bg-primary/10 px-2.5 py-1.5 flex items-center text-xs font-medium rounded-lg transition-colors cursor-pointer outline-none"
              title="添加新字段"
              @click="addNewFieldRow"
            >
              <Plus class="w-3.5 h-3.5 mr-1" /> 添加字段
            </button>
          </div>

          <!-- 列头 -->
          <div class="fields-header">
            <span class="fh-name">列名</span>
            <span class="fh-label">标签</span>
            <span class="fh-type">类型</span>
            <span class="fh-act"></span>
          </div>

          <!-- 已有字段 -->
          <div
            v-for="field in table.fields"
            :key="field.id"
            class="field-item"
            :class="{
              'field-item-pk': editPrimaryColumn === field.columnName,
              'field-item-fk': fkFieldIds?.has(field.id),
            }"
          >
            <span class="fi-col-name">
              <svg v-if="editPrimaryColumn === field.columnName"
                width="9" height="9" viewBox="0 0 24 24" fill="none" class="pk-icon">
                <circle cx="8" cy="12" r="5" stroke="#F59E0B" stroke-width="2.2"/>
                <path d="M13 12h8" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M17 9l4 3-4 3" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else-if="fkFieldIds?.has(field.id)"
                width="9" height="9" viewBox="0 0 24 24" fill="none" class="fk-icon">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  stroke="#6366F1" stroke-width="2" stroke-linecap="round"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  stroke="#6366F1" stroke-width="2" stroke-linecap="round"/>
              </svg>
              {{ field.columnName }}
            </span>
            <input
              v-model="editFields[field.columnName].label"
              placeholder="标签"
              class="w-full text-xs rounded-md border border-outline-variant/30 bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-1 px-2 outline-none transition-shadow"
            />
            <input
              v-model="editFields[field.columnName].dataType"
              placeholder="类型"
              class="w-full text-xs rounded-md border border-outline-variant/30 bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-1 px-2 outline-none transition-shadow font-mono"
            />
            <span class="fi-act"></span>
          </div>

          <!-- 新增字段行 -->
          <div
            v-for="(nf, idx) in newFields"
            :key="`new-${idx}`"
            class="field-item field-item-new"
          >
            <input
              v-model="nf.columnName"
              placeholder="列名*"
              class="w-full text-xs rounded-md border border-outline-variant/40 bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-1 px-2 outline-none transition-shadow font-mono text-primary font-medium"
            />
            <input
              v-model="nf.label"
              placeholder="标签"
              class="w-full text-xs rounded-md border border-outline-variant/30 bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-1 px-2 outline-none transition-shadow"
            />
            <input
              v-model="nf.dataType"
              placeholder="VARCHAR"
              class="w-full text-xs rounded-md border border-outline-variant/30 bg-surface focus:border-primary focus:ring-1 focus:ring-primary py-1 px-2 outline-none transition-shadow font-mono"
            />
            <button
              class="text-error/70 hover:text-error hover:bg-error/10 p-1 rounded-md transition-colors cursor-pointer outline-none flex items-center justify-center h-[26px] w-[26px]"
              @click="removeNewField(idx)"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- §3 关联关系 -->
        <div class="section">
          <div class="section-title-row">
            <span class="section-title">
              关联关系
              <span v-if="relatedRelations.length" class="section-count">
                ({{ relatedRelations.length }})
              </span>
            </span>
            <button
              class="text-primary hover:bg-primary/10 px-2.5 py-1.5 flex items-center text-xs font-medium rounded-lg transition-colors cursor-pointer outline-none"
              title="新增关系"
              @click="showAddRel = !showAddRel"
            >
              <Plus class="w-3.5 h-3.5 mr-1" /> 新增关系
            </button>
          </div>

          <!-- 新增关系表单 -->
          <transition name="slide-down">
            <div v-if="showAddRel" class="add-rel-form">
              <div class="add-rel-title">从 <b>{{ table.tableName }}</b> 建立新关系</div>

              <div class="form-row">
                <label>源字段（本表）</label>
                <select v-model="newRel.sourceColumn" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none">
                  <option value="" disabled>选择源字段</option>
                  <option v-for="f in table.fields" :key="f.columnName" :value="f.columnName">{{ f.columnName }}</option>
                </select>
              </div>

              <div class="form-row">
                <label>关系类型</label>
                <select v-model="newRel.relationType" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none">
                  <option value="ONE_TO_MANY">一对多 (1:N)</option>
                  <option value="ONE_TO_ONE">一对一 (1:1)</option>
                  <option value="MANY_TO_ONE">多对一 (N:1)</option>
                </select>
              </div>

              <div class="form-row">
                <label>目标表</label>
                <select
                  v-model="newRel.targetTable"
                  class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none"
                  @change="newRel.targetColumn = ''"
                >
                  <option value="" disabled>选择目标表</option>
                  <option v-for="t in otherTables" :key="t.tableName" :value="t.tableName">{{ t.tableName }}</option>
                </select>
              </div>

              <div class="form-row">
                <label>目标字段</label>
                <select
                  v-model="newRel.targetColumn"
                  class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none disabled:bg-surface-container-low disabled:cursor-not-allowed"
                  :disabled="!newRel.targetTable"
                >
                  <option value="" disabled>先选目标表</option>
                  <option v-for="f in targetTableFields" :key="f.columnName" :value="f.columnName">{{ f.columnName }}</option>
                </select>
              </div>

              <div class="form-row">
                <label>关系名称 <span class="optional">（可选）</span></label>
                <input v-model="newRel.name" class="w-full rounded-md border border-outline-variant/30 bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary py-1.5 px-2.5 outline-none transition-shadow" placeholder="如：orders→items" />
              </div>

              <div
                v-if="addRelError"
                class="bg-error/10 text-error text-[13px] px-3 py-2 rounded-lg mb-2 flex items-center gap-2"
              >
                <Info class="w-4 h-4" />
                {{ addRelError }}
              </div>

              <div class="flex items-center justify-end gap-2 mt-4">
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer outline-none"
                  @click="cancelAddRel"
                >取消</button>
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  :disabled="!newRel.sourceColumn || !newRel.targetTable || !newRel.targetColumn || props.saving"
                  @click="onAddRelConfirm"
                >
                  <Loader2 v-if="props.saving" class="w-3.5 h-3.5 mr-1 animate-spin" />
                  确认新增
                </button>
              </div>
            </div>
          </transition>

          <!-- 已有关系列表 -->
          <div v-if="!relatedRelations.length && !showAddRel" class="rel-empty">
            暂无关系，点击"新增关系"建立
          </div>
          
          <div
            v-for="rel in relatedRelations"
            :key="rel.id"
            class="rel-item-container"
          >
            <!-- 正常显示模式 -->
            <div v-if="editingRelId !== rel.id" class="rel-item" @click="emit('focus-relation', rel.id)">
              <div class="rel-item-left">
                <span class="rel-endpoint">{{ getSource(rel)?.tableName }}.{{ getSource(rel)?.columnName }}</span>
                <select class="rel-type-select" :value="getRelTypeKey(rel)" @change="(e) => emit('update-relation-type', { relId: rel.id, relationType: (e.target as HTMLSelectElement).value })" @click.stop>
                  <option value="ONE_TO_MANY">1:N</option>
                  <option value="ONE_TO_ONE">1:1</option>
                  <option value="MANY_TO_ONE">N:1</option>
                </select>
                <span class="rel-endpoint">{{ getTarget(rel)?.tableName }}.{{ getTarget(rel)?.columnName }}</span>
              </div>
              <div class="flex items-center">
                <button
                  class="text-primary/70 hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer outline-none flex items-center justify-center mr-1"
                  title="编辑关系"
                  @click.stop="startEditRel(rel)"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>
                <button
                  class="text-error/70 hover:text-error hover:bg-error/10 p-1.5 rounded-md transition-colors cursor-pointer outline-none flex items-center justify-center"
                  title="删除关系"
                  @click.stop="emit('delete-relation', rel.id)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 内联编辑模式 -->
            <div v-else class="add-rel-form !mt-2 !mb-2 !bg-surface">
              <div class="add-rel-title text-primary">编辑关系</div>
              
              <div class="form-row">
                <label>源字段（本表）</label>
                <select v-model="editRel.sourceColumn" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none">
                  <option v-for="f in table.fields" :key="f.columnName" :value="f.columnName">{{ f.columnName }}</option>
                </select>
              </div>

              <div class="form-row">
                <label>关系类型</label>
                <select v-model="editRel.relationType" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none">
                  <option value="ONE_TO_MANY">一对多 (1:N)</option>
                  <option value="ONE_TO_ONE">一对一 (1:1)</option>
                  <option value="MANY_TO_ONE">多对一 (N:1)</option>
                </select>
              </div>

              <div class="form-row">
                <label>目标表</label>
                <select v-model="editRel.targetTable" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none" @change="editRel.targetColumn = ''">
                  <option v-for="t in otherTables" :key="t.tableName" :value="t.tableName">{{ t.tableName }}</option>
                </select>
              </div>

              <div class="form-row">
                <label>目标字段</label>
                <select v-model="editRel.targetColumn" class="w-full text-sm rounded-md border border-outline-variant/30 bg-surface focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1.5 pl-2.5 pr-8 appearance-none outline-none disabled:bg-surface-container-low disabled:cursor-not-allowed" :disabled="!editRel.targetTable">
                  <option v-for="f in editTargetTableFields" :key="f.columnName" :value="f.columnName">{{ f.columnName }}</option>
                </select>
              </div>

              <div class="form-row">
                <label>关系名称 <span class="optional">（可选）</span></label>
                <input v-model="editRel.name" class="w-full rounded-md border border-outline-variant/30 bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary py-1.5 px-2.5 outline-none transition-shadow" placeholder="如：orders→items" />
              </div>

              <div v-if="editRelError" class="bg-error/10 text-error text-[13px] px-3 py-2 rounded-lg mb-2 flex items-center gap-2">
                <Info class="w-4 h-4" />
                {{ editRelError }}
              </div>

              <div class="flex items-center justify-end gap-2 mt-4">
                <button class="px-3 py-1.5 text-xs font-medium rounded-lg text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer outline-none" @click="cancelEditRel">取消</button>
                <button class="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center" :disabled="!editRel.sourceColumn || !editRel.targetTable || !editRel.targetColumn || props.saving" @click="onEditRelConfirm">
                  <Loader2 v-if="props.saving" class="w-3.5 h-3.5 mr-1 animate-spin" />
                  保存
                </button>
              </div>
            </div>
          </div>

        </div>

      </div><!-- /inspector-scroll -->

      <!-- ── 底部操作按钮 ── -->
      <div class="inspector-footer">
        <button class="px-4 py-2 text-sm font-medium rounded-xl text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer outline-none" @click="onReset">重置</button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary/90 transition-colors cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          :disabled="props.saving"
          @click="onSave"
        >
          <Loader2 v-if="props.saving" class="w-4 h-4 mr-2 animate-spin" />
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Plus, Trash2, Edit2, Info, Loader2 } from 'lucide-vue-next'
import { TABLE_COLORS } from '../../../composables/useErData'
import type { ErTable, ErRelation } from '../../../composables/useErData'

// ── Props ─────────────────────────────────────────────────────────────────
const props = defineProps<{
  table?:         ErTable | null
  relations?:     ErRelation[]
  allTables?:     ErTable[]          // 所有表，用于新增关系时选择目标表
  fkFieldIds?:    Set<number>
  tableIndex?:    number
  saving?:        boolean
}>()

// ── Emits ─────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: {
    displayName:   string
    primaryColumn: string
    fields: Array<{ columnName: string; label: string; dataType: string }>
    newFields: Array<{ columnName: string; label: string; dataType: string }>
  }): void
  (e: 'add-relation', payload: {
    sourceTable:  string
    sourceColumn: string
    targetTable:  string
    targetColumn: string
    relationType: string
    name:         string
  }): void
  (e: 'focus-relation', relId: number): void
  (e: 'delete-relation', relId: number): void
  (e: 'update-relation', payload: { relId: number; sourceTable: string; sourceColumn: string; targetTable: string; targetColumn: string; relationType: string; name: string }): void
  (e: 'update-relation-type', payload: { relId: number, relationType: string }): void
}>()

// ── 编辑态：基本信息 ──────────────────────────────────────────────────────
const editDisplayName   = ref('')
const editPrimaryColumn = ref('')
const editFields        = ref<Record<string, { label: string; dataType: string }>>({})

// ── 新增字段暂存 ──────────────────────────────────────────────────────────
interface NewFieldRow { columnName: string; label: string; dataType: string }
const newFields = ref<NewFieldRow[]>([])

const addNewFieldRow = () => {
  newFields.value.push({ columnName: '', label: '', dataType: 'VARCHAR' })
}
const removeNewField = (idx: number) => {
  newFields.value.splice(idx, 1)
}

// ── 新增关系表单 ───────────────────────────────────────────────────────────

const editingRelId = ref<number | null>(null)
const editRelError = ref<string | null>(null)
const editRel = ref({
  sourceColumn: '',
  targetTable:  '',
  targetColumn: '',
  relationType: 'ONE_TO_MANY',
  name:         '',
})

const startEditRel = (rel: ErRelation) => {
  editingRelId.value = rel.id
  editRelError.value = null
  const source = getSource(rel)
  const target = getTarget(rel)
  editRel.value = {
    sourceColumn: source?.columnName || '',
    targetTable:  target?.tableName || '',
    targetColumn: target?.columnName || '',
    relationType: getRelTypeKey(rel),
    name:         rel.name || '',
  }
}

const cancelEditRel = () => {
  editingRelId.value = null
  editRelError.value = null
}

const onEditRelConfirm = () => {
  editRelError.value = null
  if (!editRel.value.sourceColumn || !editRel.value.targetTable || !editRel.value.targetColumn) {
    editRelError.value = '请填写源字段、目标表和目标字段'
    return
  }
  emit('update-relation', {
    relId:        editingRelId.value!,
    sourceTable:  props.table!.tableName,
    sourceColumn: editRel.value.sourceColumn,
    targetTable:  editRel.value.targetTable,
    targetColumn: editRel.value.targetColumn,
    relationType: editRel.value.relationType,
    name:         editRel.value.name,
  })
  editingRelId.value = null
}

const editTargetTableFields = computed(() =>
  (props.allTables ?? []).find(t => t.tableName === editRel.value.targetTable)?.fields ?? []
)

const showAddRel  = ref(false)
const addRelError = ref<string | null>(null)
const newRel = ref({
  sourceColumn: '',
  targetTable:  '',
  targetColumn: '',
  relationType: 'ONE_TO_MANY',
  name:         '',
})

// 目标表的字段列表（依赖 targetTable 选择）
const targetTableFields = computed(() =>
  (props.allTables ?? []).find(t => t.tableName === newRel.value.targetTable)?.fields ?? []
)

// 排除当前表自身（不允许自关联，简化设计）
const otherTables = computed(() =>
  (props.allTables ?? []).filter(t => t.tableName !== props.table?.tableName)
)

const cancelAddRel = () => {
  showAddRel.value = false
  addRelError.value = null
  newRel.value = { sourceColumn: '', targetTable: '', targetColumn: '', relationType: 'ONE_TO_MANY', name: '' }
}

const onAddRelConfirm = () => {
  addRelError.value = null
  if (!newRel.value.sourceColumn || !newRel.value.targetTable || !newRel.value.targetColumn) {
    addRelError.value = '请填写源字段、目标表和目标字段'
    return
  }
  emit('add-relation', {
    sourceTable:  props.table!.tableName,
    sourceColumn: newRel.value.sourceColumn,
    targetTable:  newRel.value.targetTable,
    targetColumn: newRel.value.targetColumn,
    relationType: newRel.value.relationType,
    name:         newRel.value.name,
  })
  // 父组件成功后会调用 cancelAddRel 或由父重置
}

// 新增关系成功后，父组件通过清空 saving 来回调，这里暂用 watch 关闭
watch(() => props.saving, (cur, prev) => {
  if (prev && !cur) cancelAddRel()
})

// ── 计算属性 ─────────────────────────────────────────────────────────────
const titleColor = computed(() =>
  TABLE_COLORS[(props.tableIndex ?? 0) % TABLE_COLORS.length]
)

const getSource = (rel: ErRelation) => rel.nodes?.find(n => n.cardinality === '1') || rel.nodes?.[0]
const getTarget = (rel: ErRelation) => rel.nodes?.find(n => n !== getSource(rel)) || rel.nodes?.[1]
const getRelTypeKey = (rel: ErRelation) => {
  const cards = rel.nodes?.map(n => n.cardinality).sort().join('')
  if (cards === '1N') return 'ONE_TO_MANY'
  if (cards === '11') return 'ONE_TO_ONE'
  if (cards === 'NN') return 'MANY_TO_ONE' // fallback for now
  return 'ONE_TO_MANY'
}

const getRelType = (rel: ErRelation) => {
  const cards = rel.nodes?.map(n => n.cardinality).sort().join('')
  if (cards === '1N') return '1:N'
  if (cards === '11') return '1:1'
  if (cards === 'NN') return 'N:M'
  return '1:N'
}

const relatedRelations = computed<ErRelation[]>(() => {
  if (!props.relations || !props.table) return []
  return props.relations.filter(
    r => r.nodes && r.nodes.some(n => n.tableName === props.table!.tableName)
  )
})

const relTypeLabel = (rt: string) => {
  if (rt === 'ONE_TO_ONE')  return '1:1'
  if (rt === 'ONE_TO_MANY') return '1:N'
  if (rt === 'MANY_TO_ONE') return 'N:1'
  return rt
}

// ── 监听 table 切换，重置所有编辑状态 ───────────────────────────────────
watch(() => props.table, (t) => {
  newFields.value   = []
  showAddRel.value  = false
  addRelError.value = null
  newRel.value      = { sourceColumn: '', targetTable: '', targetColumn: '', relationType: 'ONE_TO_MANY', name: '' }
  if (!t) return
  editDisplayName.value   = t.displayName   ?? ''
  editPrimaryColumn.value = t.primaryColumn ?? ''
  editFields.value = {}
  t.fields.forEach(f => {
    editFields.value[f.columnName] = { label: f.label ?? '', dataType: f.dataType ?? '' }
  })
}, { immediate: true })

// ── 重置 ─────────────────────────────────────────────────────────────────
function onReset() {
  if (!props.table) return
  newFields.value     = []
  editDisplayName.value   = props.table.displayName   ?? ''
  editPrimaryColumn.value = props.table.primaryColumn ?? ''
  props.table.fields.forEach(f => {
    editFields.value[f.columnName] = { label: f.label ?? '', dataType: f.dataType ?? '' }
  })
}

// ── 保存 ─────────────────────────────────────────────────────────────────
function onSave() {
  if (!props.table) return
  emit('save', {
    displayName:   editDisplayName.value,
    primaryColumn: editPrimaryColumn.value,
    fields: props.table.fields.map(f => ({
      columnName: f.columnName,
      label:      editFields.value[f.columnName]?.label    ?? f.label,
      dataType:   editFields.value[f.columnName]?.dataType ?? f.dataType,
    })),
    newFields: newFields.value.filter(nf => nf.columnName.trim()),
  })
  newFields.value = []
}
</script>

<style scoped>
/* ── 面板容器（滑出动画）─────────────────────────────────────────────── */
.inspector {
  width: 0;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
}
.inspector.open { width: 300px; }
.inspector-inner { width: 300px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }

/* ── 标题栏 ────────────────────────────────────────────────────────── */
.inspector-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.inspector-title { display: flex; align-items: center; gap: 8px; }
.title-badge { display: inline-block; width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
.title-table { font-weight: 700; font-size: 13px; color: #1E293B; font-family: 'JetBrains Mono', monospace; }
.title-sub   { font-size: 10px; color: #94A3B8; margin-top: 1px; }

/* ── 滚动内容区 ────────────────────────────────────────────────────── */
.inspector-scroll { flex: 1; overflow-y: auto; }

/* ── 通用 Section ──────────────────────────────────────────────────── */
.section { padding: 12px 14px; border-bottom: 1px solid #F1F5F9; }
.section-fields { padding-bottom: 8px; }

.section-title-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.section-title {
  font-size: 10.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: #94A3B8;
}
.section-count { font-weight: 400; }

.add-btn {
  font-size: 11px !important;
  color: #6366F1 !important;
  padding: 2px 6px !important;
}

.form-row { margin-bottom: 8px; }
.form-row label { display: block; font-size: 11.5px; color: #64748B; margin-bottom: 4px; font-weight: 500; }
.optional { font-weight: 400; color: #9CA3AF; font-size: 10px; }

.mono-input :deep(input) { font-family: 'JetBrains Mono', monospace !important; font-size: 11px !important; }

/* ── 字段表格 ──────────────────────────────────────────────────────── */
.fields-header {
  display: flex; align-items: center;
  padding: 0 6px; margin-bottom: 3px;
  gap: 4px;
}
.fh-name  { font-size: 10px; color: #CBD5E1; font-weight: 600; flex: 2; min-width: 0; }
.fh-label { font-size: 10px; color: #CBD5E1; font-weight: 600; flex: 2; min-width: 0; }
.fh-type  { font-size: 10px; color: #CBD5E1; font-weight: 600; flex: 1.5; min-width: 0; }
.fh-act   { width: 24px; flex-shrink: 0; }

.field-item {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 6px; border-radius: 5px;
  margin-bottom: 3px;
  background: #F8FAFC;
  border: 1px solid transparent;
}
.field-item-pk { border-color: #FDE68A; background: #FFFBEB; }
.field-item-fk { border-color: #C7D2FE; background: #EEF2FF; }
.field-item-new { background: #F0FDF4; border-color: #BBF7D0; }

.fi-col-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px; color: #374151;
  flex: 2; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: flex; align-items: center; gap: 3px;
}
.fi-col-input { flex: 2 !important; min-width: 0; }
.fi-input  { flex: 2 !important; min-width: 0; }
.fi-type   { flex: 1.5 !important; }
.fi-del-btn { flex-shrink: 0; padding: 0 2px !important; }
.fi-act    { width: 24px; flex-shrink: 0; }

/* ── 新增关系表单 ──────────────────────────────────────────────────── */
.add-rel-form {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}
.add-rel-title {
  font-size: 11.5px; color: #374151; margin-bottom: 10px;
  padding-bottom: 8px; border-bottom: 1px dashed #E2E8F0;
}
.add-rel-actions {
  display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px;
}

/* ── 已有关系 ──────────────────────────────────────────────────────── */
.rel-empty { font-size: 11.5px; color: #CBD5E1; text-align: center; padding: 12px 0; }

.rel-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border: 1px solid #E2E8F0;
  border-radius: 6px; margin-bottom: 5px;
  cursor: pointer; transition: background 0.1s;
}
.rel-item:hover { background: #F8FAFC; }

.rel-item-left {
  display: flex; align-items: center; gap: 4px;
  overflow: hidden; flex: 1; min-width: 0;
}
.rel-endpoint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; color: #374151;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 80px;
}
.rel-type-badge {
  font-size: 9px; font-weight: 700;
  background: #EEF2FF; color: #6366F1;
  padding: 1px 5px; border-radius: 3px; flex-shrink: 0;
}

/* ── 底部操作 ──────────────────────────────────────────────────────── */
.inspector-footer {
  padding: 10px 14px;
  border-top: 1px solid #E2E8F0;
  display: flex; justify-content: flex-end; gap: 8px;
  flex-shrink: 0; background: #FAFBFC;
}

/* ── 动画 ──────────────────────────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.2s ease; overflow: hidden; }
.slide-down-enter-from,
.slide-down-leave-to     { max-height: 0; opacity: 0; }
.slide-down-enter-to,
.slide-down-leave-from   { max-height: 400px; opacity: 1; }
</style>

<style scoped>
.rel-type-select {
  font-size: 9px; font-weight: 700;
  background: #EEF2FF; color: #6366F1;
  padding: 1px 4px; border-radius: 3px;
  border: 1px solid transparent;
  outline: none; cursor: pointer;
  appearance: none; text-align: center;
  transition: all 0.2s;
}
.rel-type-select:hover {
  border-color: #C7D2FE;
}
.rel-type-select:focus {
  border-color: #6366F1;
}
</style>
