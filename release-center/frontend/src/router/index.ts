import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layout/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'applications', component: () => import('../views/AppList.vue') },
      { path: 'environments', component: () => import('../views/EnvList.vue') },
      { path: 'releases', component: () => import('../views/ReleaseList.vue') },
      { path: 'releases/create', component: () => import('../views/ReleaseCreate.vue') },
      { path: 'releases/:id', component: () => import('../views/ReleaseDetail.vue') },
      { path: 'approvals', component: () => import('../views/ApprovalCenter.vue') },
      { path: 'workflows', component: () => import('../views/WorkflowDesigner.vue') },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;