<template>
  <div>
    <div class="flex gap-2 mb-4">
      <el-button type="primary" @click="fetchData">Refresh</el-button>
      <el-button type="success" @click="dialogVisible = true">Create App</el-button>
    </div>
    <el-table :data="apps" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="code" label="Code" />
      <el-table-column prop="owner" label="Owner" />
      <el-table-column prop="status" label="Status" />
    </el-table>

    <el-dialog v-model="dialogVisible" title="Create Application">
      <el-form :model="form" label-width="80px">
        <el-form-item label="Name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="Owner">
          <el-input v-model="form.owner" />
        </el-form-item>
        <el-form-item label="Pipeline ID">
          <el-input v-model="form.yunxiaoPipelineId" placeholder="e.g. mock-pipe-1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="createApp">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api';

const apps = ref([]);
const dialogVisible = ref(false);
const form = reactive({ name: '', code: '', owner: '', yunxiaoPipelineId: '' });

const fetchData = async () => {
  const res: any = await api.get('/applications');
  if (res.code === 0) {
    apps.value = res.data;
  }
};

const createApp = async () => {
  const res: any = await api.post('/applications', form);
  if (res.code === 0) {
    ElMessage.success('Application created');
    dialogVisible.value = false;
    form.name = ''; form.code = ''; form.owner = ''; form.yunxiaoPipelineId = '';
    fetchData();
  }
};

onMounted(fetchData);
</script>