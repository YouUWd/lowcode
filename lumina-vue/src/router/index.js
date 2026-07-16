import { createRouter, createWebHistory } from 'vue-router';
import ModuleList from '../views/modules/index.vue';
import ModuleConfig from '../views/modules/Config.vue';
import ModulePermissions from '../views/modules/Permissions.vue';
import WorkflowList from '../views/workflow/index.vue';
import LightweightWorkflowBuilder from '../views/workflow/Designer.vue';
import WorkflowDetail from '../views/workflow/Detail.vue';
import ErDiagram from '../views/diagram/index.vue';
import DataCenter from '../views/data/index.vue';
import { updateView } from '../store/index';

const routes = [
  {
    path: '/',
    redirect: '/data-center'
  },

  {
    path: '/modules',
    name: 'modules',
    component: ModuleList,
    meta: {
      title: '模块管理',
      icon: 'LayoutGrid',
      sidebar: true,
      group: 'config',
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
      }
    },
    beforeEnter: async (to, from, next) => {
      const moduleId = to.params.id;
      await updateView('config', { id: moduleId });
      next();
    }
  },
  {
    path: '/permissions',
    name: 'permissions',
    component: ModulePermissions,
    meta: {
      title: '字段权限',
      icon: 'ShieldAlert',
      sidebar: true,
      group: 'config',
      breadcrumb: {
        title: '字段权限配置',
        description: '配置系统所有物理字段的细粒度安全访问控制矩阵 (CLS)'
      }
    },
    beforeEnter: async (to, from, next) => {
      await updateView('permissions');
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
      title: '待办审批',
      icon: 'Workflow',
      sidebar: true,
      group: 'business',
      breadcrumb: {
        title: '待办审批',
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
      icon: 'PenTool',
      sidebar: true,
      group: 'config',
      breadcrumb: {
        parent: { name: 'workflow-list', title: '待办审批' },
        dynamicActive: true,
        description: '定义并联协作配置，支持指派多角色/人员及或签会签流转'
      }
    },
    beforeEnter: (to, from, next) => {
      updateView('workflow-designer');
      next();
    }
  },
  {
    path: '/workflow/detail',
    name: 'workflow-detail',
    component: WorkflowDetail,
    meta: {
      title: '处理控制台',
      sidebar: false,
      breadcrumb: {
        parent: { name: 'workflow-list', title: '待办审批' },
        dynamicActive: true,
        description: '详细展示并处理当前审批流的流转拓扑与任务分配'
      }
    },
    beforeEnter: async (to, from, next) => {
      const bizNo = to.query.bizNo;
      await updateView('workflow-detail', { id: bizNo });
      next();
    }
  },
  {
    path: '/data-center',
    name: 'data-center',
    component: DataCenter,
    meta: {
      title: '数据中心',
      icon: 'Database',
      sidebar: true,
      group: 'business',
      breadcrumb: {
        title: '数据中心',
        description: '访问和消费系统动态低代码建模数据，实时触发列级鉴权与脱敏'
      }
    },
    beforeEnter: (to, from, next) => {
      updateView('data-center');
      next();
    }
  },
  {
    path: '/diagram',
    name: 'diagram',
    component: ErDiagram,
    meta: {
      title: 'ER 图模型',
      icon: 'GitFork',
      sidebar: true,
      group: 'config',
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
