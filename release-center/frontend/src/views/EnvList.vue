<template>
  <div>
    <div class="flex gap-2 mb-4">
      <el-button type="primary" @click="fetchData">Refresh</el-button>
      <el-button type="success" @click="dialogVisible = true">Create Env</el-button>
    </div>
    <el-table :data="envs" style="width: 100%;">
      <el-table-column prop="id" label="ID" width="50" />
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="status" label="Status" />
      <el-table-column prop="approvalRequired" label="Requires Approval">
        <template #default="scope">
          <el-switch v-model="scope.row.approvalRequired" disabled />
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="Create Environment">
      <el-form :model="form" label-width="120px">
        <el-form-item label="Name">
          <el-select v-model="form.name" placeholder="Select Env Type">
            <el-option label="DEV" value="DEV" />
            <el-option label="SIT" value="SIT" />
            <el-option label="UAT" value="UAT" />
            <el-option label="PRE" value="PRE" />
            <el-option label="PROD" value="PROD" />
          </el-select>
        </el-form-item>
        <el-form-item label="Approval Required">
          <el-switch v-model="form.approvalRequired" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="createEnv">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '../api';

const envs = ref([]);
const dialogVisible = ref(false);
const form = reactive({ name: '', approvalRequired: false });

const fetchData = async () => {
  const res: any = await api.get('/environments');
  if (res.code === 0) {
    envs.value = res.data;
  }
};

const createEnv = async () => {
  const res: any = await api.post('/environments', form);
  if (res.code === 0) {
    ElMessage.success('Environment created');
    dialogVisible.value = false;
    form.name = ''; form.approvalRequired = false;
    fetchData();
  }
};

onMounted(fetchData);
</script>