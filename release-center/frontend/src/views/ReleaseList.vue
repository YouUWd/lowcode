<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl">Releases</h2>
      <el-button type="primary" @click="$router.push('/releases/create')">Create Release</el-button>
    </div>
    <el-table :data="releases" style="width: 100%;">
      <el-table-column prop="releaseNo" label="Release No" />
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="version" label="Version" />
      <el-table-column prop="status" label="Status">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions">
        <template #default="scope">
          <el-button size="small" @click="$router.push(`/releases/${scope.row.id}`)">Detail</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';

const releases = ref([]);

const fetchData = async () => {
  const res: any = await api.get('/releases');
  if (res.code === 0) {
    releases.value = res.data;
  }
};

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'primary',
    RELEASING: 'warning',
    SUCCESS: 'success',
    FAILED: 'danger',
    ROLLBACK: 'danger'
  };
  return map[status] || 'info';
};

onMounted(fetchData);
</script>