<template>
  <div>
    <el-button type="primary" @click="fetchData">Refresh</el-button>
    <el-table :data="envs" style="width: 100%; margin-top: 10px;">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="status" label="Status" />
      <el-table-column prop="approvalRequired" label="Requires Approval">
        <template #default="scope">
          <el-switch v-model="scope.row.approvalRequired" disabled />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';

const envs = ref([]);

const fetchData = async () => {
  const res: any = await api.get('/environments');
  if (res.code === 0) {
    envs.value = res.data;
  }
};

onMounted(fetchData);
</script>