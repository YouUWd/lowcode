<template>
  <div>
    <el-button type="primary" @click="fetchData">Refresh</el-button>
    <el-table :data="apps" style="width: 100%; margin-top: 10px;">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="code" label="Code" />
      <el-table-column prop="owner" label="Owner" />
      <el-table-column prop="status" label="Status" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';

const apps = ref([]);

const fetchData = async () => {
  const res: any = await api.get('/applications');
  if (res.code === 0) {
    apps.value = res.data;
  }
};

onMounted(fetchData);
</script>