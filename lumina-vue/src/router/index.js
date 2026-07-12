import { createRouter, createWebHistory } from 'vue-router';
import ModuleList from '../views/modules/index.vue';
import ModuleConfig from '../views/modules/Config.vue';
import ModulePermissions from '../views/modules/Permissions.vue';
import WorkflowList from '../views/workflow/index.vue';
import LightweightWorkflowBuilder from '../views/workflow/Designer.vue';
import WorkflowDetail from '../views/workflow/Detail.vue';
import ErDiagram from '../views/diagram/index.vue';
import { updateView } from '../store/index';

const routes = [
  {
    path: '/',
    redirect: '/modules'
  },
  {
    path: '/modules',
    name: 'modules',
    component: ModuleList,
    meta: {
      title: '模块管理',
      icon: 'LayoutGrid',
      sidebar: true,
      breadcrumb: {
        title: '模块管理',
        description: '配置、监控及优化您的企业级架构模块'
      }
    },
    beforeEnter: (to, from, next) => {
      updateView('list');
      next();
    }
  },
  {
    path: '/modules/:id/config',
    name: 'module-config',
    component: ModuleConfig,
    meta: {
      title: '模块配置',
      sidebar: false,
      breadcrumb: {
        parent: { name: 'modules', title: '模块管理' },
        dynamicActive: true,
        description: '定义主副实体关系及 UI 表现层字段映射规则'
      },
      subViews: [
        { name: 'module-config', title: '配置', activeClass: 'bg-primary text-on-primary shadow-sm' },
        { name: 'module-permissions', title: '权限', activeClass: 'bg-tertiary text-on-tertiary shadow-sm' }
      ]
    },
    beforeEnter: async (to, from, next) => {
      const moduleId = to.params.id;
      await updateView('config', { id: moduleId });
      next();
    }
  },
  {
    path: '/modules/:id/permissions',
    name: 'module-permissions',
    component: ModulePermissions,
    meta: {
      title: '模块权限',
      sidebar: false,
      breadcrumb: {
        parent: { name: 'modules', title: '模块管理' },
        dynamicActive: true,
        description: '配置物理字段的细粒度安全访问控制节点 (CLS)'
      },
      subViews: [
        { name: 'module-config', title: '配置', activeClass: 'bg-primary text-on-primary shadow-sm' },
        { name: 'module-permissions', title: '权限', activeClass: 'bg-tertiary text-on-tertiary shadow-sm' }
      ]
    },
    beforeEnter: async (to, from, next) => {
      const moduleId = to.params.id;
      await updateView('permissions', { id: moduleId });
      next();
    }
  },
  {
    path: '/workflow',
    redirect: '/workflow/list'
  },
  {
    path: '/workflow/list',
    name: 'workflow-list',
    component: WorkflowList,
    meta: {
      title: '审批流引擎',
      icon: 'Workflow',
      sidebar: true,
      breadcrumb: {
        title: '工作流管理',
        description: '演示彻底解耦的 Fork-Join 架构与靶向回退'
      }
    },
    beforeEnter: (to, from, next) => {
      updateView('workflow-list');
      next();
    }
  },
  {
    path: '/workflow/designer',
    name: 'workflow-designer',
    component: LightweightWorkflowBuilder,
    meta: {
      title: '流程设计器',
      sidebar: false,
      breadcrumb: {
        parent: { name: 'workflow-list', title: '工作流管理' },
        dynamicActive: true,
        description: '定义并联协作配置，支持指派多角色/人员及或签会签流转'
      },
      subViews: [
        { name: 'workflow-detail', title: '处理控制台', activeClass: 'bg-primary text-on-primary shadow-sm' },
        { name: 'workflow-designer', title: '流程设计器', activeClass: 'bg-primary text-on-primary shadow-sm' }
      ]
    },
    beforeEnter: (to, from, next) => {
      updateView('workflow-designer');
      next();
    }
  },
  {
    path: '/workflow/:id/detail',
    name: 'workflow-detail',
    component: WorkflowDetail,
    meta: {
      title: '处理控制台',
      sidebar: false,
      breadcrumb: {
        parent: { name: 'workflow-list', title: '工作流管理' },
        dynamicActive: true,
        description: '详细展示并处理当前审批流的流转拓扑与任务分配'
      },
      subViews: [
        { name: 'workflow-detail', title: '处理控制台', activeClass: 'bg-primary text-on-primary shadow-sm' },
        { name: 'workflow-designer', title: '流程设计器', activeClass: 'bg-primary text-on-primary shadow-sm' }
      ]
    },
    beforeEnter: async (to, from, next) => {
      const bizNo = to.params.id;
      await updateView('workflow-detail', { id: bizNo });
      next();
    }
  },
  {
    path: '/diagram',
    name: 'diagram',
    component: ErDiagram,
    meta: {
      title: 'ER 图模型',
      icon: 'Database',
      sidebar: true,
      breadcrumb: {
        title: 'ER 图模型',
        description: '直观地管理和配置系统实体关系模型'
      }
    },
    beforeEnter: (to, from, next) => {
      updateView('diagram');
      next();
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
