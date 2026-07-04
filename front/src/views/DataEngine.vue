<template>
  <div class="engine">
    <!-- 角色切换 + 查询条件 -->
    <el-card shadow="never" class="page-card">
      <div class="query-bar">
        <div class="role-switch">
          <span class="bar-label">当前角色 (X-Role)：</span>
          <el-radio-group v-model="currentRole" size="small" @change="loadList">
            <el-radio-button v-for="r in roles" :key="r.code" :value="r.code">
              {{ r.name }} ({{ r.code }})
            </el-radio-button>
          </el-radio-group>
        </div>
        <el-divider direction="vertical" />
        <el-form inline class="filter-form" @submit.prevent>
          <el-form-item label="客户名">
            <el-input v-model="filterCustomer" size="small" placeholder="LIKE 模糊查询" style="width: 140px" clearable @keyup.enter="onSearch" />
          </el-form-item>
          <el-form-item label="金额 >">
            <el-input-number v-model="filterAmount" size="small" :min="0" :controls="false" placeholder="GT" style="width: 110px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterStatus" size="small" placeholder="EQ 精确" style="width: 130px" clearable>
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="onSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button size="small" @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="bar-right">
          <el-button type="primary" size="small" @click="openCreate">
            <el-icon><Plus /></el-icon>
            新建订单
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 无权限占位 -->
    <el-card v-if="noPermission" shadow="never" class="page-card">
      <el-empty description="暂无该模块数据访问权限">
        <el-text type="info" size="small">后端返回 400：表 [orders] 无任何可读字段</el-text>
      </el-empty>
    </el-card>

    <!-- 数据列表 -->
    <el-card v-else shadow="never" class="page-card" v-loading="loading">
      <template #header>
        <div class="list-head">
          <span>订单列表（POST /api/module/order/query）</span>
          <el-text type="info" size="small">无读权限（perm &amp; 4 = 0）的列已被引擎自动抹除</el-text>
        </div>
      </template>
      <el-table :data="rows" size="small" border stripe @sort-change="onSortChange">
        <el-table-column v-for="col in visibleColumns" :key="col.prop" :prop="col.prop" :label="col.label" :sortable="col.sortable ? 'custom' : false" :min-width="col.width">
          <template #default="{ row }">
            <el-tag v-if="col.prop === 'orders_status'" size="small" :type="statusTagType(String(row[col.prop]))">
              {{ statusLabel(String(row[col.prop])) }}
            </el-tag>
            <el-tag v-else-if="col.prop === 'customer_profiles_level'" size="small" effect="plain" type="warning">
              {{ row[col.prop] ?? '—' }}
            </el-tag>
            <span v-else>{{ row[col.prop] ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(Number(row.orders_id))">详情</el-button>
            <el-button link type="primary" size="small" @click="openEdit(Number(row.orders_id))">编辑</el-button>
            <el-popconfirm title="将级联删除从表明细，确认删除？" confirm-button-text="删除" cancel-button-text="取消" @confirm="onDelete(Number(row.orders_id))">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination v-model:current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next" small @current-change="loadList" />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="订单详情（携带 id 的详情模式查询）" size="46%">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item v-for="f in mainFieldsReadable" :key="f.columnName" :label="f.label">
              <template v-if="detail[f.columnName] !== undefined">{{ detail[f.columnName] }}</template>
              <el-text v-else type="info" size="small">（无读权限，已被引擎抹除）</el-text>
            </el-descriptions-item>
          </el-descriptions>
          <h4 class="sub-title">从表明细 order_items（with 级联加载）</h4>
          <template v-if="orderItemsFieldsReadable.length > 0">
            <el-table :data="(detail.order_items as Record<string, unknown>[]) ?? []" size="small" border>
              <el-table-column v-for="col in orderItemsFieldsReadable" :key="col.columnName" :prop="col.columnName" :label="col.label" />
            </el-table>
          </template>
          <el-alert v-else type="warning" :closable="false" title="当前角色无从表的任何字段读取权限，已隐藏明细" />
        </template>
      </div>
    </el-drawer>

    <!-- 新建/编辑抽屉（级联保存表单） -->
    <el-drawer v-model="formVisible" :title="formTitle" size="46%" destroy-on-close>
      <el-alert type="info" :closable="false" show-icon class="form-tip">
        {{ isEdit
          ? '编辑模式：无修改权限（perm & 1 = 0）的字段以只读呈现，避免被引擎 400 拒绝。'
          : '新建模式：无新增写权限（perm & 2 = 0）的字段被禁用，避免被引擎 400 拒绝。' }}
      </el-alert>
      <el-form :model="form" label-width="90px">
        <el-row :gutter="16">
          <el-col v-for="f in writableMainFields" :key="f.columnName" :span="12">
            <el-form-item :label="f.label">
              <el-select v-if="f.columnName === 'status'" v-model="form.status" :disabled="isFieldDisabled('orders', f.columnName)" style="width: 100%">
                <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
              <el-input-number v-else-if="f.dataType === 'DECIMAL'" v-model="form.amount" :min="0" :precision="2" :disabled="isFieldDisabled('orders', f.columnName)" style="width: 100%" :controls="false" />
              <el-input v-else v-model="form[f.columnName]" :disabled="isFieldDisabled('orders', f.columnName)" :placeholder="isFieldDisabled('orders', f.columnName) ? '当前角色无权操作该字段' : ''" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="items-head">
        <h4 class="sub-title">从表明细 order_items（级联覆盖保存）</h4>
        <el-button v-if="!isSubTableDisabled('order_items')" size="small" text type="primary" @click="addItem">
          <el-icon><Plus /></el-icon>
          添加明细行
        </el-button>
      </div>
      <el-table :data="formItems" size="small" border>
        <el-table-column label="商品名称" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.product_name" size="small" :disabled="isFieldDisabled('order_items', 'product_name')" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="110">
          <template #default="{ row }">
            <el-input-number v-model="row.qty" size="small" :min="1" style="width: 100%" :controls="false" :disabled="isFieldDisabled('order_items', 'qty')" />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.price" size="small" :min="0" :precision="2" style="width: 100%" :controls="false" :disabled="isFieldDisabled('order_items', 'price')" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center">
          <template #default="{ $index }">
            <el-button v-if="!isSubTableDisabled('order_items')" link type="danger" size="small" @click="formItems.splice($index, 1)">删</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div style="flex: auto">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="onSave">
            一键级联保存
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ApiError, deleteModuleData, fetchRolePermissions, queryModuleData, saveModuleData, fetchModuleMeta } from '../api'
import type { PermTable, QueryFilter, ModuleMeta } from '../types'
import { canRead, canUpdate, canWrite } from '../utils/perm'

const roles = [
  { code: 'admin', name: '系统管理员' },
  { code: 'manager', name: '业务主管' },
  { code: 'editor', name: '数据专员' },
  { code: 'viewer', name: '只读访客' },
]

const MODULE_ID = 'order'

const currentRole = ref('editor')
const loading = ref(false)
const noPermission = ref(false)
const rows = ref<Record<string, unknown>[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const filterCustomer = ref('')
const filterAmount = ref<number | undefined>(undefined)
const filterStatus = ref('')
const sortField = ref('orders_id')
const sortDir = ref<'ASC' | 'DESC'>('DESC')

const rolePerms = ref<PermTable[]>([])
const moduleMeta = ref<ModuleMeta | null>(null)

const statusOptions = [
  { value: 'PENDING', label: '待付款' },
  { value: 'PAID', label: '已付款' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'CANCELLED', label: '已取消' },
]

function statusLabel(v: string) {
  return statusOptions.find((s) => s.value === v)?.label ?? v
}
function statusTagType(v: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  switch (v) {
    case 'PAID': return 'success'
    case 'SHIPPED': return 'primary'
    case 'PENDING': return 'warning'
    case 'CANCELLED': return 'danger'
    default: return 'info'
  }
}

function fieldPerm(tableName: string, columnName: string): number {
  const t = rolePerms.value.find((x) => x.tableName === tableName)
  return t?.fields.find((f) => f.columnName === columnName)?.perm ?? 0
}

/** 列表可见列：主表可读字段 + JOIN 表补充列 */
const visibleColumns = computed(() => {
  const cols: { prop: string; label: string; sortable: boolean; width: number }[] = []
  if (!moduleMeta.value) return cols
  for (const f of moduleMeta.value.mainTable.fields) {
    if (!canRead(fieldPerm(moduleMeta.value.mainTable.tableName, f.columnName))) continue
    cols.push({ prop: `orders_${f.columnName}`, label: f.label, sortable: true, width: f.dataType === 'DATETIME' ? 150 : 110 })
  }
  cols.push({ prop: 'customer_profiles_level', label: '客户级别 (JOIN)', sortable: false, width: 120 })
  cols.push({ prop: 'customer_profiles_contact_phone', label: '联系电话 (JOIN)', sortable: false, width: 130 })
  return cols
})

const mainFieldsReadable = computed(() =>
  moduleMeta.value?.mainTable.fields.filter((f) => canRead(fieldPerm(moduleMeta.value!.mainTable.tableName, f.columnName))) ?? [],
)

const writableMainFields = computed(() =>
  moduleMeta.value?.mainTable.fields.filter((f) => f.columnName !== 'id' && f.columnName !== 'created_at' && f.columnName !== 'updated_at') ?? [],
)

const orderItemsFieldsReadable = computed(() => {
  const tMeta = moduleMeta.value?.subTables.find(st => st.tableName === 'order_items')
  if (!tMeta) return []
  // 过滤掉不可读的字段，如果要隐藏 id 等，可以在此过滤，目前严格按配置权限判断
  return tMeta.fields.filter(f => canRead(fieldPerm('order_items', f.columnName)) && f.columnName !== 'order_id')
})

async function loadRolePerms() {
  const res = await fetchRolePermissions(MODULE_ID, currentRole.value)
  rolePerms.value = res.data
}

async function loadMeta() {
  const res = await fetchModuleMeta(MODULE_ID)
  moduleMeta.value = res.data
}

async function loadList() {
  loading.value = true
  noPermission.value = false
  try {
    if (!moduleMeta.value) {
      await loadMeta()
    }
    await loadRolePerms()
    const filters: QueryFilter[] = []
    if (filterCustomer.value) filters.push({ tableName: 'orders', field: 'customer', op: 'like', value: filterCustomer.value })
    if (filterAmount.value != null) filters.push({ tableName: 'orders', field: 'amount', op: '>', value: filterAmount.value })
    if (filterStatus.value) filters.push({ tableName: 'orders', field: 'status', op: '=', value: filterStatus.value })

    const withClause: any[] = []
    if (moduleMeta.value) {
      moduleMeta.value.subTables.forEach(st => withClause.push({ tableName: st.tableName, fields: [] }))
      moduleMeta.value.joinTables.forEach(jt => withClause.push({ tableName: jt.tableName, fields: [] }))
    }

    const res = await queryModuleData(MODULE_ID, currentRole.value, {
      page: page.value,
      size: size.value,
      filters,
      sorts: [{ field: sortField.value, dir: sortDir.value }],
      with: withClause,
    })
    const data = res.data as { rows: Record<string, unknown>[]; total: number }
    // Flatten rows
    rows.value = data.rows.map((row: any) => {
      const flat: Record<string, unknown> = {}
      if (moduleMeta.value?.mainTable.tableName && row[moduleMeta.value.mainTable.tableName]) {
        const mainData = row[moduleMeta.value.mainTable.tableName]
        for (const k in mainData) {
          flat[`orders_${k}`] = mainData[k]
        }
      }
      if (row.customer_profiles) {
        for (const k in row.customer_profiles) {
          flat[`customer_profiles_${k}`] = row.customer_profiles[k]
        }
      }
      return flat
    })
    total.value = data.total
  } catch (e) {
    if (e instanceof ApiError && e.message.includes('无任何可读字段')) {
      noPermission.value = true
    } else {
      ElMessage.error(e instanceof ApiError ? e.message : '查询失败')
    }
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  loadList()
}

function resetFilters() {
  filterCustomer.value = ''
  filterAmount.value = undefined
  filterStatus.value = ''
  onSearch()
}

function onSortChange(e: { prop: string; order: string | null }) {
  if (e.order) {
    sortField.value = e.prop
    sortDir.value = e.order === 'ascending' ? 'ASC' : 'DESC'
  } else {
    sortField.value = 'orders_id'
    sortDir.value = 'DESC'
  }
  loadList()
}

/* ---------- 详情 ---------- */
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<Record<string, unknown> | null>(null)

async function openDetail(id: number) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await queryModuleData(MODULE_ID, currentRole.value, {
      id,
      page: 1,
      size: 1,
      filters: [],
      sorts: [],
      with: [{ tableName: 'order_items', fields: ['id', 'order_id', 'product_name', 'qty', 'price', 'created_at'] }],
    })
    const data = res.data as Record<string, unknown>
    // Flatten detail
    const flatDetail: Record<string, unknown> = {}
    if (moduleMeta.value?.mainTable.tableName && data[moduleMeta.value.mainTable.tableName]) {
      Object.assign(flatDetail, data[moduleMeta.value.mainTable.tableName])
    }
    flatDetail.order_items = data.order_items
    detail.value = flatDetail
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '详情加载失败')
  } finally {
    detailLoading.value = false
  }
}

/* ---------- 新建 / 编辑 ---------- */
const formVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = reactive<Record<string, unknown>>({})
const formItems = ref<Record<string, unknown>[]>([])

const formTitle = computed(() =>
  isEdit.value ? `编辑订单 #${form.id}（POST /save，id 不为空）` : '新建订单（POST /save，id 为空）',
)

function isFieldDisabled(tableName: string, columnName: string): boolean {
  const perm = fieldPerm(tableName, columnName)
  return isEdit.value ? !canUpdate(perm) : !canWrite(perm)
}

function isSubTableDisabled(tableName: string): boolean {
  const t = rolePerms.value.find((x) => x.tableName === tableName)
  if (!t) return true
  for (const f of t.fields) {
    if (isEdit.value ? canUpdate(f.perm) : canWrite(f.perm)) {
      return false
    }
  }
  return true
}

function openCreate() {
  isEdit.value = false
  Object.keys(form).forEach((k) => delete form[k])
  form.order_no = `ORD-${Date.now()}`
  form.customer = ''
  form.amount = 0
  form.status = 'PENDING'
  form.remark = ''
  formItems.value = []
  formVisible.value = true
}

async function openEdit(id: number) {
  isEdit.value = true
  try {
    const res = await queryModuleData(MODULE_ID, currentRole.value, {
      id,
      page: 1,
      size: 1,
      filters: [],
      sorts: [],
      with: [{ tableName: 'order_items', fields: ['id', 'order_id', 'product_name', 'qty', 'price', 'created_at'] }],
    })
    const data = res.data as Record<string, unknown>
    Object.keys(form).forEach((k) => delete form[k])
    if (moduleMeta.value?.mainTable.tableName && data[moduleMeta.value.mainTable.tableName]) {
      Object.assign(form, data[moduleMeta.value.mainTable.tableName])
    }
    formItems.value = ((data.order_items as Record<string, unknown>[]) ?? []).map((i) => ({ ...i }))
    formVisible.value = true
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '加载编辑数据失败')
  }
}

function addItem() {
  formItems.value.push({ product_name: '', qty: 1, price: 0 })
}

async function onSave() {
  saving.value = true
  try {
    const mainData: Record<string, unknown> = {}
    for (const f of writableMainFields.value) {
      if (!isFieldDisabled('orders', f.columnName)) mainData[f.columnName] = form[f.columnName]
    }
    if (isEdit.value) mainData.id = form.id
    
    const payload: Record<string, unknown> = {}
    const mainTableName = moduleMeta.value?.mainTable.tableName || 'orders'
    payload[mainTableName] = mainData
    
    const subTableMeta = moduleMeta.value?.subTables.find(st => st.tableName === 'order_items')
    payload.order_items = formItems.value.map((i) => {
      const itemData: Record<string, unknown> = {}
      if (i.id) itemData.id = i.id
      itemData.order_id = isEdit.value ? form.id : undefined
      if (subTableMeta) {
        for (const f of subTableMeta.fields) {
          if (f.columnName !== 'id' && f.columnName !== 'order_id' && f.columnName !== 'created_at' && f.columnName !== 'updated_at' && !isFieldDisabled('order_items', f.columnName)) {
            itemData[f.columnName] = i[f.columnName]
          }
        }
      }
      return itemData
    })
    const res = await saveModuleData(MODULE_ID, currentRole.value, { data: payload })
    ElMessage.success(`级联保存成功，主表 ID = ${res.data}`)
    formVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function onDelete(id: number) {
  try {
    await deleteModuleData(MODULE_ID, id)
    ElMessage.success(`已级联删除主记录 #${id} 及其从表明细`)
    loadList()
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '删除失败')
  }
}

onMounted(loadList)
</script>

<style scoped>
.engine {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.query-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.role-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-label {
  font-size: 13px;
  color: #475569;
  white-space: nowrap;
}
.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}
.bar-right {
  margin-left: auto;
}
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
.sub-title {
  margin: 16px 0 8px;
  font-size: 13px;
  color: #0f172a;
}
.items-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.form-tip {
  margin-bottom: 14px;
}
</style>
