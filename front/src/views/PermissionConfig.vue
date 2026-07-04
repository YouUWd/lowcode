<template>
  <div class="perm-page">
    <!-- 角色选择 -->
    <el-card shadow="never" class="page-card">
      <div class="role-bar">
        <div class="role-select">
          <span class="bar-label">配置角色：</span>
          <el-radio-group v-model="roleCode" size="small" @change="loadPerms">
            <el-radio-button v-for="r in roles" :key="r.code" :value="r.code">
              {{ r.name }} ({{ r.code }})
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="role-actions">
          <el-button size="small" @click="loadPerms">
            <el-icon><Refresh /></el-icon>
            重新加载
          </el-button>
          <el-button type="primary" size="small" :loading="saving" @click="savePerms">
            <el-icon><Check /></el-icon>
            批量保存权限
          </el-button>
        </div>
      </div>
      <el-alert type="info" :closable="false" show-icon class="perm-tip">
        perm 位掩码规则：可读 = 4（100），新增 = 2（010），修改 = 1（001）。级联约束：取消"可读"后，"新增/修改"自动置空并禁用（对用户隐藏的字段不应可写）。
      </el-alert>
    </el-card>

    <!-- 各物理表权限 -->
    <el-card v-for="table in permRows" :key="table.tableMetaId" shadow="never" class="page-card" v-loading="loading">
      <template #header>
        <div class="table-head">
          <span class="mono table-name">{{ table.tableName }}</span>
          <el-tag size="small" effect="plain" type="info">tableMetaId: {{ table.tableMetaId }}</el-tag>
          <div class="head-right">
            <el-button size="small" text type="primary" @click="setAll(table, 7)">全部读写</el-button>
            <el-button size="small" text type="primary" @click="setAll(table, 4)">全部只读</el-button>
            <el-button size="small" text type="danger" @click="setAll(table, 0)">全部禁用</el-button>
          </div>
        </div>
      </template>
      <el-table :data="table.fields" size="small" border stripe>
        <el-table-column prop="columnName" label="物理列名" min-width="130">
          <template #default="{ row }">
            <span class="mono">{{ row.columnName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="label" label="显示名称" min-width="110" />
        <el-table-column label="可读 (4)" width="100" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.canRead" @change="onReadChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="新增 (2)" width="100" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.canWrite" :disabled="!row.canRead" />
          </template>
        </el-table-column>
        <el-table-column label="修改 (1)" width="100" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="row.canUpdate" :disabled="!row.canRead" />
          </template>
        </el-table-column>
        <el-table-column label="perm 掩码值" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="permTagType(rowPerm(row))" effect="plain" class="mono">
              {{ rowPerm(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限说明" min-width="110">
          <template #default="{ row }">
            <el-text size="small" :type="rowPerm(row) === 0 ? 'danger' : 'info'">
              {{ permLabel(rowPerm(row)) }}
            </el-text>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 提交报文预览 -->
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="table-head">
          <span>POST /api/admin/permission/field/batch 提交报文预览</span>
          <el-switch v-model="showPreview" active-text="展开" />
        </div>
      </template>
      <pre v-if="showPreview" class="json-preview mono">{{ JSON.stringify(buildBatchRequest(), null, 2) }}</pre>
      <el-text v-else type="info" size="small">开启右上角开关查看即将推送的批量权限变更报文。</el-text>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ApiError, fetchRolePermissions, savePermissionBatch } from '../api'
import type { PermBatchRequest } from '../types'
import { getCheckboxStates, getPermValue, permLabel } from '../utils/perm'

const roles = [
  { code: 'admin', name: '系统管理员' },
  { code: 'manager', name: '业务主管' },
  { code: 'editor', name: '数据专员' },
  { code: 'viewer', name: '只读访客' },
]

const MODULE_ID = 'order'

interface PermRowField {
  fieldMetaId: number
  columnName: string
  label: string
  canRead: boolean
  canWrite: boolean
  canUpdate: boolean
}

interface PermRowTable {
  tableMetaId: number
  tableName: string
  fields: PermRowField[]
}

const roleCode = ref('viewer')
const loading = ref(false)
const saving = ref(false)
const permRows = ref<PermRowTable[]>([])
const showPreview = ref(false)

function rowPerm(row: PermRowField): number {
  return getPermValue(row.canRead, row.canWrite, row.canUpdate)
}

function permTagType(perm: number): 'success' | 'warning' | 'danger' | 'info' {
  if (perm === 7) return 'success'
  if (perm === 0) return 'danger'
  if (perm === 4) return 'info'
  return 'warning'
}

/** 白名单级联约束：取消可读时，新增/修改一并置空 */
function onReadChange(row: PermRowField) {
  if (!row.canRead) {
    row.canWrite = false
    row.canUpdate = false
  }
}

function setAll(table: PermRowTable, perm: number) {
  const states = getCheckboxStates(perm)
  for (const f of table.fields) {
    f.canRead = states.canRead
    f.canWrite = states.canWrite
    f.canUpdate = states.canUpdate
  }
}

async function loadPerms() {
  loading.value = true
  try {
    const res = await fetchRolePermissions(MODULE_ID, roleCode.value)
    permRows.value = res.data.map((t) => ({
      tableMetaId: t.tableMetaId,
      tableName: t.tableName,
      fields: t.fields.map((f) => ({
        fieldMetaId: f.fieldMetaId,
        columnName: f.columnName,
        label: f.label,
        ...getCheckboxStates(f.perm),
      })),
    }))
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '加载权限配置失败')
  } finally {
    loading.value = false
  }
}

function buildBatchRequest(): PermBatchRequest {
  return {
    roleCode: roleCode.value,
    moduleId: MODULE_ID,
    tables: permRows.value.map((t) => ({
      tableMetaId: t.tableMetaId,
      fields: t.fields.map((f) => ({
        fieldMetaId: f.fieldMetaId,
        perm: rowPerm(f),
      })),
    })),
  }
}

async function savePerms() {
  saving.value = true
  try {
    await savePermissionBatch(buildBatchRequest())
    ElMessage.success(`角色 [${roleCode.value}] 权限已批量保存，缓存强制刷新生效`)
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadPerms)
</script>

<style scoped>
.perm-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.role-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.role-select {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-label {
  font-size: 13px;
  color: #475569;
  white-space: nowrap;
}
.role-actions {
  display: flex;
  gap: 8px;
}
.perm-tip {
  margin-top: 12px;
}
.table-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.table-name {
  font-weight: 600;
  font-size: 14px;
}
.head-right {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.json-preview {
  max-height: 360px;
  overflow: auto;
  background: #0f172a;
  color: #a5f3fc;
  padding: 14px;
  border-radius: 6px;
  margin: 0;
}
</style>
