<template>
  <div>
    <el-page-header @back="$router.back()" title="Back" class="mb-4">
      <template #content>
        <span class="text-large font-600 mr-3"> Create Release </span>
      </template>
    </el-page-header>

    <el-form :model="form" label-width="120px" class="max-w-xl mt-4">
      <el-form-item label="Title">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="Application">
        <el-select v-model="form.applicationId" placeholder="Select App">
          <el-option v-for="app in apps" :key="app.id" :label="app.name" :value="app.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Environment">
        <el-select v-model="form.environmentId" placeholder="Select Env">
          <el-option v-for="env in envs" :key="env.id" :label="env.name" :value="env.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Version">
        <el-input v-model="form.version" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Create</el-button>
        <el-button @click="$router.push('/releases')">Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../api';

const router = useRouter();
const form = reactive({
  title: '',
  applicationId: '',
  environmentId: '',
  version: ''
});

const apps = ref<any[]>([]);
const envs = ref<any[]>([]);

const fetchData = async () => {
  const resApps: any = await api.get('/applications');
  if (resApps.code === 0) apps.value = resApps.data;

  const resEnvs: any = await api.get('/environments');
  if (resEnvs.code === 0) envs.value = resEnvs.data;
};

const onSubmit = async () => {
  const res: any = await api.post('/releases', form);
  if (res.code === 0) {
    ElMessage.success('Created successfully');
    router.push('/releases');
  }
};

onMounted(fetchData);
</script>