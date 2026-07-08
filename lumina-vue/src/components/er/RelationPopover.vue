<template>
  <!--
    RelationPopover — 拖拽建立关系后弹出的确认弹窗
    询问关系类型（一对一/一对多/多对一）并做查重检查
  -->
  <el-dialog
    v-model="visible"
    title="建立字段关系"
    width="420px"
    :close-on-click-modal="false"
    :before-close="onCancel"
    class="rel-dialog"
  >
    <!-- 连接信息摘要 -->
    <div class="conn-summary">
      <div class="conn-side">
        <span class="conn-table">{{ props.connection?.sourceTable }}</span>
        <span class="conn-field">{{ props.connection?.sourceColumn }}</span>
      </div>
      <div class="conn-arrow">
        <svg width="40" height="16" viewBox="0 0 40 16">
          <line x1="0" y1="8" x2="32" y2="8" stroke="#94A3B8" stroke-width="1.5"/>
          <path d="M28 4L36 8L28 12" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="conn-side">
        <span class="conn-table">{{ props.connection?.targetTable }}</span>
        <span class="conn-field">{{ props.connection?.targetColumn }}</span>
      </div>
    </div>

    <!-- 关系类型选择 -->
    <div class="form-section">
      <label class="form-label">关系类型</label>
      <el-radio-group v-model="relationType" class="rel-type-group">
        <el-radio-button value="ONE_TO_MANY">
          <span class="rt-icon">1 : N</span>
          <span class="rt-label">一对多</span>
        </el-radio-button>
        <el-radio-button value="ONE_TO_ONE">
          <span class="rt-icon">1 : 1</span>
          <span class="rt-label">一对一</span>
        </el-radio-button>
        <el-radio-button value="MANY_TO_ONE">
          <span class="rt-icon">N : 1</span>
          <span class="rt-label">多对一</span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 关系名称（可选） -->
    <div class="form-section">
      <label class="form-label">关系名称 <span class="optional">（可选，用于图谱标注）</span></label>
      <el-input
        v-model="relationName"
        placeholder="如：orders->order_items"
        clearable
        style="font-family: monospace;"
      />
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMsg"
      :title="errorMsg"
      type="error"
      :closable="false"
      style="margin-top: 12px;"
    />

    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="onConfirm"
      >
        确认建立关系
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export interface PendingConnection {
  sourceTable:  string
  sourceColumn: string
  targetTable:  string
  targetColumn: string
}

const props = defineProps<{
  modelValue:  boolean      // v-model 控制弹窗显隐
  connection:  PendingConnection | null
  submitting?: boolean
  errorMsg?:   string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', payload: {
    relationType:  string
    relationName:  string
    connection:    PendingConnection
  }): void
  (e: 'cancel'): void
}>()

const visible      = ref(props.modelValue)
const relationType = ref('ONE_TO_MANY')
const relationName = ref('')
const errorMsg     = ref<string | null>(null)

// 同步 v-model
watch(() => props.modelValue, v => {
  visible.value = v
  if (v) {
    // 打开时重置状态
    relationType.value = 'ONE_TO_MANY'
    relationName.value = ''
    errorMsg.value     = null
    // 自动预填关系名
    if (props.connection) {
      relationName.value = `${props.connection.sourceTable}->${props.connection.targetTable}`
    }
  }
})
watch(visible, v => emit('update:modelValue', v))
watch(() => props.errorMsg, v => { errorMsg.value = v ?? null })

function onCancel() {
  visible.value = false
  emit('cancel')
}

function onConfirm() {
  if (!props.connection) return
  errorMsg.value = null
  emit('confirm', {
    relationType:  relationType.value,
    relationName:  relationName.value.trim(),
    connection:    props.connection,
  })
}
</script>

<style scoped>
/* 连接摘要卡片 */
.conn-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 14px 20px;
  margin-bottom: 20px;
}

.conn-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.conn-table {
  font-weight: 700;
  font-size: 12px;
  color: #1E293B;
  font-family: 'JetBrains Mono', monospace;
}

.conn-field {
  font-size: 11px;
  color: #6366F1;
  background: #EEF2FF;
  padding: 1px 7px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.conn-arrow { opacity: 0.7; }

/* 表单区域 */
.form-section {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.optional {
  font-weight: 400;
  color: #9CA3AF;
  font-size: 11px;
}

/* 关系类型选择 */
.rel-type-group {
  width: 100%;
  display: flex;
}

.rel-type-group :deep(.el-radio-button) {
  flex: 1;
}

.rel-type-group :deep(.el-radio-button__inner) {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
}

.rt-icon {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 13px;
}

.rt-label {
  font-size: 10px;
  opacity: 0.8;
}
</style>
