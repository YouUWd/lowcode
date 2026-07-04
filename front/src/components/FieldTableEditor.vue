<template>
  <el-table :data="fields" size="small" border stripe>
    <el-table-column label="#" type="index" width="44" align="center" />
    <el-table-column label="物理列名" min-width="140">
      <template #default="{ row }">
        <el-input v-model="row.columnName" size="small" class="mono" placeholder="column_name" />
      </template>
    </el-table-column>
    <el-table-column label="显示名称 Label" min-width="130">
      <template #default="{ row }">
        <el-input v-model="row.label" size="small" placeholder="标签" />
      </template>
    </el-table-column>
    <el-table-column label="数据类型" width="130">
      <template #default="{ row }">
        <el-select v-model="row.dataType" size="small">
          <el-option v-for="t in dataTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="查询操作符" width="120">
      <template #default="{ row }">
        <el-select v-model="row.queryOp" size="small" placeholder="—" clearable>
          <el-option v-for="op in queryOps" :key="op" :label="op" :value="op" />
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="64" align="center">
      <template #default="{ $index }">
        <el-button link type="danger" size="small" @click="removeField($index)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <div class="add-row">
    <el-button size="small" text type="primary" @click="addField">
      <el-icon><Plus /></el-icon>
      添加字段
    </el-button>
  </div>
</template>

<script setup lang="ts">
import type { FieldMeta } from '../types'

const props = defineProps<{ fields: FieldMeta[] }>()

const dataTypes = ['BIGINT', 'VARCHAR', 'DECIMAL', 'INTEGER', 'DATETIME']
const queryOps = ['EQ', 'LIKE', 'GT', 'LT', 'GE', 'LE']

function addField() {
  const maxId = Math.max(0, ...props.fields.map((f) => f.id))
  props.fields.push({
    id: maxId + 1,
    columnName: '',
    label: '',
    dataType: 'VARCHAR',
    queryOp: null,
  })
}

function removeField(index: number) {
  props.fields.splice(index, 1)
}
</script>

<style scoped>
.add-row {
  padding: 6px 0;
}
</style>
