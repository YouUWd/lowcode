<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <el-card class="w-96">
      <template #header>
        <div class="text-center font-bold text-lg">Release Center Login</div>
      </template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="Username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="Password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="w-full">Login</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useUserStore } from '../store';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const store = useUserStore();
const router = useRouter();
const form = reactive({ username: 'admin', password: 'admin' });

const handleLogin = async () => {
  try {
    await store.login(form);
    ElMessage.success('Login success');
    router.push('/');
  } catch (e) {
    ElMessage.error('Login failed');
  }
};
</script>