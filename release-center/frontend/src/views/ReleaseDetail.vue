<template>
  <div v-if="release">
    <el-page-header @back="$router.back()" :title="'Back'" class="mb-4">
      <template #content>
        <span class="text-large font-600 mr-3"> Release: {{ release.releaseNo }} </span>
      </template>
    </el-page-header>

    <el-descriptions border :column="2">
      <el-descriptions-item label="Title">{{ release.title }}</el-descriptions-item>
      <el-descriptions-item label="Status">
        <el-tag>{{ release.status }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="Application">{{ release.application?.name }}</el-descriptions-item>
      <el-descriptions-item label="Environment">{{ release.environment?.name }}</el-descriptions-item>
      <el-descriptions-item label="Version">{{ release.version }}</el-descriptions-item>
    </el-descriptions>

    <div class="mt-4 flex gap-4">
      <el-button v-if="release.status === 'DRAFT'" type="primary" @click="submitForApproval">Submit for Approval</el-button>
      <el-button v-if="release.status === 'APPROVED'" type="success" @click="executeRelease">Execute Release</el-button>
      <el-button v-if="release.status === 'SUCCESS' || release.status === 'FAILED'" type="danger" @click="rollbackRelease">Rollback</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../api';

const route = useRoute();
const release = ref<any>(null);

const fetchData = async () => {
  const res: any = await api.get(`/releases/${route.params.id}`);
  if (res.code === 0) {
    release.value = res.data;
  }
};

const submitForApproval = async () => {
  const res: any = await api.post(`/releases/${route.params.id}/submit`);
  if (res.code === 0) {
    ElMessage.success('Submitted');
    fetchData();
  }
};

const executeRelease = async () => {
  const res: any = await api.post(`/releases/${route.params.id}/execute`);
  if (res.code === 0) {
    ElMessage.success('Execution started');
    fetchData();
  }
};

const rollbackRelease = async () => {
  const res: any = await api.post(`/releases/${route.params.id}/rollback`);
  if (res.code === 0) {
    ElMessage.success('Rollback initiated');
    fetchData();
  }
};

onMounted(fetchData);
</script>