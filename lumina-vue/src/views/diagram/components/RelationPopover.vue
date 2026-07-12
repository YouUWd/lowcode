<template>
  <div v-if="visible" class="relative z-50">
      <div class="fixed inset-0 bg-black/25 backdrop-blur-sm" @click="onCancel" />

      <div class="fixed inset-0 overflow-y-auto pointer-events-none">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
            <div class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all pointer-events-auto">
              <h3 class="text-lg font-bold leading-6 text-gray-900 mb-4 flex justify-between items-center">
                建立字段关系
                <button @click="onCancel" class="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none">
                  <X class="w-5 h-5" />
                </button>
              </h3>

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
                <div class="mt-2 flex space-x-2">
                    <div
                      @click="relationType = 'ONE_TO_MANY'"
                      :class="[
                        relationType === 'ONE_TO_MANY' ? 'ring-2 ring-primary ring-offset-2 bg-primary text-white' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      ]"
                      class="relative flex flex-1 cursor-pointer rounded-lg px-4 py-2.5 focus:outline-none transition-colors border border-transparent shadow-sm"
                    >
                      <div class="flex w-full items-center justify-center flex-col gap-1">
                        <span class="text-xs font-bold font-mono">1 : N</span>
                        <span class="text-xs font-medium">一对多</span>
                      </div>
                    </div>

                    <div
                      @click="relationType = 'ONE_TO_ONE'"
                      :class="[
                        relationType === 'ONE_TO_ONE' ? 'ring-2 ring-primary ring-offset-2 bg-primary text-white' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      ]"
                      class="relative flex flex-1 cursor-pointer rounded-lg px-4 py-2.5 focus:outline-none transition-colors border border-transparent shadow-sm"
                    >
                      <div class="flex w-full items-center justify-center flex-col gap-1">
                        <span class="text-xs font-bold font-mono">1 : 1</span>
                        <span class="text-xs font-medium">一对一</span>
                      </div>
                    </div>

                    <div
                      @click="relationType = 'MANY_TO_ONE'"
                      :class="[
                        relationType === 'MANY_TO_ONE' ? 'ring-2 ring-primary ring-offset-2 bg-primary text-white' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      ]"
                      class="relative flex flex-1 cursor-pointer rounded-lg px-4 py-2.5 focus:outline-none transition-colors border border-transparent shadow-sm"
                    >
                      <div class="flex w-full items-center justify-center flex-col gap-1">
                        <span class="text-xs font-bold font-mono">N : 1</span>
                        <span class="text-xs font-medium">多对一</span>
                      </div>
                    </div>
                  </div>
              </div>

              <!-- 关系名称（可选） -->
              <div class="form-section">
                <label class="form-label">关系名称 <span class="optional">（可选，用于图谱标注）</span></label>
                <input
                  v-model="relationName"
                  placeholder="如：orders->order_items"
                  class="w-full mt-2 rounded-lg border border-outline-variant/30 bg-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary py-2 px-3 outline-none transition-shadow font-mono"
                />
              </div>

              <!-- 错误提示 -->
              <div
                v-if="errorMsg"
                class="bg-error/10 text-error text-[13px] px-3 py-2.5 rounded-lg mt-3 flex items-center gap-2"
              >
                <Info class="w-4 h-4 shrink-0" />
                {{ errorMsg }}
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  class="inline-flex justify-center rounded-xl border border-transparent bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest focus:outline-none transition-colors"
                  @click="onCancel"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="inline-flex justify-center rounded-xl border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="submitting"
                  @click="onConfirm"
                >
                  <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                  确认建立关系
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import { X, Info, Loader2 } from 'lucide-vue-next'

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


</style>
