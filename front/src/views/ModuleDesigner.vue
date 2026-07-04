<template>
  <div v-loading="loading" class="designer">
    <template v-if="design">
      <!-- 模块基本信息 -->
      <el-card shadow="never" class="page-card">
        <div class="module-head">
          <div class="module-info">
            <el-form inline label-width="80px" class="module-form">
              <el-form-item label="模块 ID">
                <el-input v-model="design.id" class="mono" style="width: 160px" disabled />
              </el-form-item>
              <el-form-item label="模块名称">
                <el-input v-model="design.name" style="width: 200px" />
              </el-form-item>
              <el-form-item label="模块描述">
                <el-input v-model="design.description" style="width: 320px" />
              </el-form-item>
            </el-form>
          </div>
          <div class="module-actions">
            <el-button @click="loadMeta">
              <el-icon><Refresh /></el-icon>
              重新加载
            </el-button>
            <el-button type="success" :loading="refreshing" @click="onRefreshCache">
              <el-icon><RefreshRight /></el-icon>
              刷新缓存
            </el-button>
            <el-button type="primary" :loading="saving" @click="saveDesign">
              <el-icon><Check /></el-icon>
              保存模块设计
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 表结构 Tabs -->
      <el-card shadow="never" class="page-card table-card">
        <el-tabs v-model="activeTab">
          <!-- MAIN 主表 -->
          <el-tab-pane name="main">
            <template #label>
              <span class="tab-label">
                <el-tag size="small" type="primary" effect="dark">MAIN</el-tag>
                主实体表
              </span>
            </template>
            <div class="table-meta">
              <el-form inline label-width="90px">
                <el-form-item label="物理表名">
                  <el-input v-model="design.mainTable.tableName" class="mono" style="width: 200px" />
                </el-form-item>
              </el-form>
              <el-alert type="info" :closable="false" show-icon class="type-tip">
                主实体表为根节点，奠定主查询的分页、排序和事务写入基调。
              </el-alert>
            </div>
            <FieldTableEditor :fields="design.mainTable.fields" />
          </el-tab-pane>

          <!-- SUB 从表 -->
          <el-tab-pane name="sub">
            <template #label>
              <span class="tab-label">
                <el-tag size="small" type="success" effect="dark">SUB</el-tag>
                一对多从表 ({{ design.subTables.length }})
              </span>
            </template>
            <el-alert type="info" :closable="false" show-icon class="type-tip">
              从表数据生命周期完全依附于主表（1:N），写入时执行级联物理覆盖。
            </el-alert>
            <el-collapse v-model="openSubTables">
              <el-collapse-item v-for="(sub, si) in design.subTables" :key="sub.id" :name="sub.id">
                <template #title>
                  <span class="mono collapse-title">{{ sub.tableName || '（未命名从表）' }}</span>
                  <el-tag size="small" type="info" effect="plain" class="fk-tag">FK: {{ sub.foreignKey || '未设置' }}</el-tag>
                </template>
                <el-form inline label-width="110px">
                  <el-form-item label="物理表名">
                    <el-input v-model="sub.tableName" class="mono" style="width: 200px" />
                  </el-form-item>
                  <el-form-item label="外键 foreignKey">
                    <el-input v-model="sub.foreignKey" class="mono" style="width: 180px" placeholder="如 order_id" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="danger" plain size="small" @click="removeSubTable(si)">删除该从表</el-button>
                  </el-form-item>
                </el-form>
                <FieldTableEditor :fields="sub.fields" />
              </el-collapse-item>
            </el-collapse>
            <el-button class="add-table-btn" type="success" plain @click="addSubTable">
              <el-icon><Plus /></el-icon>
              新增从表
            </el-button>
          </el-tab-pane>

          <!-- JOIN 关联表 -->
          <el-tab-pane name="join">
            <template #label>
              <span class="tab-label">
                <el-tag size="small" type="warning" effect="dark">JOIN</el-tag>
                关联实体表 ({{ design.joinTables.length }})
              </span>
            </template>
            <el-alert type="info" :closable="false" show-icon class="type-tip">
              1:1 / N:1 关联实体表，查询时 LEFT JOIN 补充属性；写入时仅做引用，绝不级联破坏。
            </el-alert>
            <el-collapse v-model="openJoinTables">
              <el-collapse-item v-for="(jt, ji) in design.joinTables" :key="jt.id" :name="jt.id">
                <template #title>
                  <span class="mono collapse-title">{{ jt.tableName || '（未命名关联表）' }}</span>
                  <el-tag size="small" type="warning" effect="plain" class="fk-tag">{{ jt.joinType }} JOIN</el-tag>
                </template>
                <el-form inline label-width="90px">
                  <el-form-item label="物理表名">
                    <el-input v-model="jt.tableName" class="mono" style="width: 200px" />
                  </el-form-item>
                  <el-form-item label="连接方式">
                    <el-select v-model="jt.joinType" style="width: 110px">
                      <el-option label="LEFT" value="LEFT" />
                      <el-option label="INNER" value="INNER" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="连接条件">
                    <el-input v-model="jt.joinOn" class="mono" style="width: 360px" placeholder="orders.customer = customer_profiles.name" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="danger" plain size="small" @click="removeJoinTable(ji)">删除该关联表</el-button>
                  </el-form-item>
                </el-form>
                <FieldTableEditor :fields="jt.fields" />
              </el-collapse-item>
            </el-collapse>
            <el-button class="add-table-btn" type="warning" plain @click="addJoinTable">
              <el-icon><Plus /></el-icon>
              新增关联表
            </el-button>
          </el-tab-pane>

          <!-- RELATION 多对多 -->
          <el-tab-pane name="relation">
            <template #label>
              <span class="tab-label">
                <el-tag size="small" type="danger" effect="dark">N:M</el-tag>
                多对多关系 ({{ design.relations.length }})
              </span>
            </template>
            <el-alert type="info" :closable="false" show-icon class="type-tip">
              通过中间表 (Junction Table) 定义两个物理表之间的多对多关联。
            </el-alert>
            <el-table :data="design.relations" size="small" border stripe>
              <el-table-column label="关系名" min-width="110">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="左表" min-width="110">
                <template #default="{ row }">
                  <el-input v-model="row.leftTable" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="右表" min-width="110">
                <template #default="{ row }">
                  <el-input v-model="row.rightTable" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="中间表" min-width="150">
                <template #default="{ row }">
                  <el-input v-model="row.junctionTable" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="左外键" min-width="100">
                <template #default="{ row }">
                  <el-input v-model="row.leftFk" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="右外键" min-width="100">
                <template #default="{ row }">
                  <el-input v-model="row.rightFk" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="左连接列" min-width="90">
                <template #default="{ row }">
                  <el-input v-model="row.leftJoinColumn" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="右连接列" min-width="90">
                <template #default="{ row }">
                  <el-input v-model="row.rightJoinColumn" size="small" class="mono" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="64" align="center">
                <template #default="{ $index }">
                  <el-button link type="danger" size="small" @click="design!.relations.splice($index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="add-table-btn" type="danger" plain @click="addRelation">
              <el-icon><Plus /></el-icon>
              新增多对多关系
            </el-button>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 提交报文预览 -->
      <el-card shadow="never" class="page-card">
        <template #header>
          <div class="preview-head">
            <span>POST /api/module/design 提交报文预览</span>
            <el-switch v-model="showPreview" active-text="展开" />
          </div>
        </template>
        <pre v-if="showPreview" class="json-preview mono">{{ JSON.stringify(design, null, 2) }}</pre>
        <el-text v-else type="info" size="small">开启右上角开关查看即将推送给后端的完整 JSON 报文。</el-text>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ApiError, fetchModuleMeta, saveModuleDesign, refreshModuleCache } from '../api'
import type { ModuleMeta } from '../types'
import FieldTableEditor from '../components/FieldTableEditor.vue'

const design = ref<ModuleMeta | null>(null)
const loading = ref(false)
const saving = ref(false)
const refreshing = ref(false)
const activeTab = ref('main')
const openSubTables = ref<number[]>([])
const openJoinTables = ref<number[]>([])
const showPreview = ref(false)

async function loadMeta() {
  loading.value = true
  try {
    const res = await fetchModuleMeta('order')
    design.value = res.data
    openSubTables.value = res.data.subTables.map((t) => t.id)
    openJoinTables.value = res.data.joinTables.map((t) => t.id)
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '加载模块元数据失败')
  } finally {
    loading.value = false
  }
}

async function saveDesign() {
  if (!design.value) return
  saving.value = true
  try {
    await saveModuleDesign(design.value)
    ElMessage.success('模块设计已保存（POST /api/module/design）')
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function onRefreshCache() {
  if (!design.value) return
  refreshing.value = true
  try {
    await refreshModuleCache(design.value.id)
    ElMessage.success('刷新成功，新模型配置已实时生效于数据接口')
  } catch (e) {
    ElMessage.error(e instanceof ApiError ? e.message : '刷新失败')
  } finally {
    refreshing.value = false
  }
}

function nextTableId(): number {
  if (!design.value) return 1
  const all = [design.value.mainTable, ...design.value.subTables, ...design.value.joinTables]
  return Math.max(0, ...all.map((t) => t.id)) + 1
}

function addSubTable() {
  if (!design.value) return
  const id = nextTableId()
  design.value.subTables.push({
    id,
    tableName: '',
    queryType: 'SUB',
    joinType: null,
    joinOn: null,
    foreignKey: '',
    fields: [],
  })
  openSubTables.value.push(id)
}

function removeSubTable(index: number) {
  design.value?.subTables.splice(index, 1)
}

function addJoinTable() {
  if (!design.value) return
  const id = nextTableId()
  design.value.joinTables.push({
    id,
    tableName: '',
    queryType: 'JOIN',
    joinType: 'LEFT',
    joinOn: '',
    foreignKey: null,
    fields: [],
  })
  openJoinTables.value.push(id)
}

function removeJoinTable(index: number) {
  design.value?.joinTables.splice(index, 1)
}

function addRelation() {
  if (!design.value) return
  const id = Math.max(0, ...design.value.relations.map((r) => r.id)) + 1
  design.value.relations.push({
    id,
    name: '',
    leftTable: design.value.mainTable.tableName,
    rightTable: '',
    junctionTable: '',
    leftFk: '',
    rightFk: '',
    leftJoinColumn: 'id',
    rightJoinColumn: 'id',
  })
}

onMounted(loadMeta)
</script>

<style scoped>
.designer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 200px;
}
.module-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.module-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.module-actions {
  display: flex;
  gap: 8px;
}
.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.table-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.type-tip {
  margin-bottom: 12px;
}
.collapse-title {
  font-weight: 600;
}
.fk-tag {
  margin-left: 10px;
}
.add-table-btn {
  margin-top: 12px;
}
.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.json-preview {
  max-height: 400px;
  overflow: auto;
  background: #0f172a;
  color: #a5f3fc;
  padding: 14px;
  border-radius: 6px;
  margin: 0;
}
</style>
