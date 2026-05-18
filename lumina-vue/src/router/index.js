import { createRouter, createWebHistory } from 'vue-router';
import ModuleList from '../components/modules/ModuleList.vue';
import ModuleConfig from '../components/modules/ModuleConfig.vue';
import ModulePermissions from '../components/modules/ModulePermissions.vue';
import WorkflowPanel from '../components/workflow/WorkflowPanel.vue';
import { updateView } from '../store/index';
import { modulesState } from '../store/modules';

const routes = [
  {
    path: '/',
    redirect: '/modules'
  },
  {
    path: '/modules',
    name: 'modules',
    component: ModuleList,
    beforeEnter: (to, from, next) => {
      updateView('list');
      next();
    }
  },
  {
    path: '/modules/:id/config',
    name: 'module-config',
    component: ModuleConfig,
    beforeEnter: async (to, from, next) => {
      // Find module if possible or just pass a mock object with ID
      // Usually we want to ensure the module is loaded in the store
      const moduleId = to.params.id;
      await updateView('config', { id: moduleId });
      next();
    }
  },
  {
    path: '/modules/:id/permissions',
    name: 'module-permissions',
    component: ModulePermissions,
    beforeEnter: async (to, from, next) => {
      const moduleId = to.params.id;
      await updateView('permissions', { id: moduleId });
      next();
    }
  },
  {
    path: '/workflow',
    name: 'workflow',
    component: WorkflowPanel,
    beforeEnter: (to, from, next) => {
      updateView('workflow');
      next();
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
