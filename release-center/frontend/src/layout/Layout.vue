<template>
  <el-container class="h-screen w-screen">
    <el-aside width="200px" class="bg-gray-800">
      <el-menu
        active-text-color="#ffd04b"
        background-color="#545c64"
        text-color="#fff"
        router
        class="h-full border-none"
      >
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/applications">Applications</el-menu-item>
        <el-menu-item index="/environments">Environments</el-menu-item>
        <el-menu-item index="/releases">Releases</el-menu-item>
        <el-menu-item index="/approvals">Approvals</el-menu-item>
        <el-menu-item index="/workflows">Workflows</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="flex justify-between items-center shadow">
        <h2 class="text-xl">DevOps Release Center</h2>
        <el-button @click="logout" type="danger" plain>Logout</el-button>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useUserStore } from '../store';
import { useRouter } from 'vue-router';

const store = useUserStore();
const router = useRouter();

const logout = () => {
  store.logout();
  router.push('/login');
}
</script>

<style>
.h-screen { height: 100vh; }
.w-screen { width: 100vw; }
</style>