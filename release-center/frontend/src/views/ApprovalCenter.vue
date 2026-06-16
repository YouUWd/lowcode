<template>
  <div>
    <h2 class="text-xl mb-4">Approval Center</h2>
    <el-table :data="releases" style="width: 100%;">
      <el-table-column prop="releaseNo" label="Release No" />
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="status" label="Status" />
      <el-table-column label="Actions">
        <template #default="scope">
          <el-button type="success" size="small" @click="approve(scope.row.id)">Approve</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api';

const releases = ref([]);

const fetchData = async () => {
  const res: any = await api.get('/releases');
  if (res.code === 0) {
    releases.value = res.data.filter((r: any) => r.status === 'PENDING_APPROVAL');
  }
};

const approve = async (id: number) => {
  const res: any = await api.post(`/releases/${id}/approve`);
  if (res.code === 0) {
    ElMessage.success('Approved');
    fetchData();
  }
};

onMounted(fetchData);
</script>