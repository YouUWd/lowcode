import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/designer' },
    {
      path: '/designer',
      name: 'designer',
      component: () => import('../views/ModuleDesigner.vue'),
      meta: { title: '模块设计器' },
    },
    {
      path: '/engine',
      name: 'engine',
      component: () => import('../views/DataEngine.vue'),
      meta: { title: '数据引擎' },
    },
    {
      path: '/permission',
      name: 'permission',
      component: () => import('../views/PermissionConfig.vue'),
      meta: { title: '字段权限配置' },
    },
  ],
})

export default router
