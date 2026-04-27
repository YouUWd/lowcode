<template>
  <div class="p-8 space-y-12 w-full">

    <!-- Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)]">
        <div class="flex items-center gap-4 mb-4">
          <div class="p-3 bg-secondary-container rounded-xl text-on-secondary-container">
            <span class="material-symbols-outlined">widgets</span>
          </div>
          <span class="text-sm font-bold text-on-surface-variant uppercase tracking-wider">总模块数</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold font-headline">128</span>
          <span class="text-sm font-semibold text-primary">+12% vs 上月</span>
        </div>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)]">
        <div class="flex items-center gap-4 mb-4">
          <div class="p-3 bg-primary-container/10 rounded-xl text-primary">
            <span class="material-symbols-outlined">account_tree</span>
          </div>
          <span class="text-sm font-bold text-on-surface-variant uppercase tracking-wider">活跃实体</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold font-headline">2,456</span>
          <span class="text-sm font-semibold text-tertiary-container">高负载运行中</span>
        </div>
      </div>

      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] border-b-4 border-primary">
        <div class="flex items-center gap-4 mb-4">
          <div class="p-3 bg-tertiary-fixed rounded-xl text-on-tertiary-fixed">
            <span class="material-symbols-outlined">health_and_safety</span>
          </div>
          <span class="text-sm font-bold text-on-surface-variant uppercase tracking-wider">系统健康度</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold font-headline">99.8%</span>
          <span class="text-sm font-semibold text-emerald-600">运行平稳</span>
        </div>
      </div>
    </div>

    <!-- Main Data Table -->
    <div class="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] overflow-hidden">
      <div class="p-6 border-b border-surface-container-low flex justify-between items-center bg-surface-container-low/30">
        <h3 class="font-headline font-bold text-lg">模块列表</h3>
        <div class="flex items-center gap-3">
          <div v-if="state.loading" class="flex items-center gap-2 text-primary text-xs font-bold animate-pulse mr-2">
            <span class="material-symbols-outlined text-sm animate-spin">sync</span>
            同步中...
          </div>
          <button @click="fetchModules" class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" title="刷新">
            <span class="material-symbols-outlined text-sm">refresh</span>
          </button>
          <div class="w-px bg-outline-variant/30 my-1 mx-1"></div>
          <button @click="isAddModalOpen = true" class="px-4 py-2 text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">add_circle</span> 新建模块
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low/50">
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">模块 ID</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">模块名称</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">主实体 (Primary)</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">关联实体数</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">状态</th>
              <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-for="mod in state.modules" :key="mod.id" class="border-b border-outline-variant/15 hover:bg-surface-container-low/30 transition-colors group">
              <td class="px-6 py-5">
                <span class="font-mono text-xs font-semibold bg-surface-container-high px-2 py-1 rounded" :class="{'text-slate-400': !mod.active}">{{ mod.id }}</span>
              </td>
              <td class="px-6 py-5">
                <div class="font-semibold" :class="mod.active ? 'text-on-surface' : 'text-slate-400'">{{ mod.name }}</div>
                <div class="text-xs text-on-surface-variant mt-0.5">{{ mod.desc }}</div>
              </td>
              <td class="px-6 py-5 font-mono text-sm" :class="mod.active ? 'text-primary' : 'text-slate-400'">{{ mod.entity }}</td>
              <td class="px-6 py-5 text-center">
                <span class="text-sm font-medium px-3 py-1 rounded-full" :class="mod.active ? 'bg-secondary-container/30 text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'">{{ mod.count }}</span>
              </td>
              <td class="px-6 py-5">
                <label class="relative inline-flex items-center cursor-pointer" @click.stop>
                  <input type="checkbox" v-model="mod.active" class="sr-only peer"/>
                  <div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </td>
              <td class="px-6 py-5 text-right">
                <div class="flex justify-end gap-2">
                  <button @click.stop="goToConfig(mod)" class="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-on-surface-variant" title="配置">
                    <span class="material-symbols-outlined text-[20px]">settings_input_component</span>
                  </button>
                  <button @click.stop="openPermissionModal(mod)" class="p-2 hover:bg-tertiary/10 hover:text-tertiary rounded-lg transition-colors text-on-surface-variant" title="权限节点定义">
                    <span class="material-symbols-outlined text-[20px]">security</span>
                  </button>
                  <button @click.stop class="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-on-surface-variant" title="编辑">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button @click.stop class="p-2 hover:bg-error/10 hover:text-error rounded-lg transition-colors text-on-surface-variant" title="删除">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-6 bg-surface-container-low/10 flex justify-between items-center text-sm font-medium text-on-surface-variant">
        <div>显示 1 - 4 之 48 个模块</div>
        <div class="flex gap-1">
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-sm">chevron_left</span></button>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary">1</button>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">2</button>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">3</button>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"><span class="material-symbols-outlined text-sm">chevron_right</span></button>
        </div>
      </div>
    </div>

    <!-- Asymmetric Decorative / Info Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-8 bg-primary-container p-8 rounded-xl text-on-primary-container flex flex-col md:flex-row items-center gap-8 shadow-[0px_12px_32px_rgba(25,28,29,0.06)]">
        <div class="flex-1">
          <h2 class="text-2xl font-extrabold mb-3">提升模块效能</h2>
          <p class="text-on-primary-container/80 mb-6 leading-relaxed">最新的企业架构标准已更新。通过实施“动态映射”策略，您的关联实体响应速度可平均提升 45%。</p>
          <button class="bg-white text-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-surface-bright transition-colors">查看架构指南</button>
        </div>
        <div class="w-full md:w-48 h-32 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
          <span class="material-symbols-outlined text-5xl opacity-40">auto_awesome</span>
        </div>
      </div>
      <div class="lg:col-span-4 bg-surface-container-highest p-8 rounded-xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)]">
        <h3 class="font-headline font-bold text-lg mb-4">系统公告</h3>
        <div class="space-y-4">
          <div class="flex gap-4">
            <div class="min-w-[4px] h-12 bg-tertiary rounded-full"></div>
            <div>
              <div class="text-xs font-bold text-tertiary uppercase">维护</div>
              <div class="text-sm font-semibold">凌晨 2:00 进行核心镜像升级</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="min-w-[4px] h-12 bg-primary rounded-full"></div>
            <div>
              <div class="text-xs font-bold text-primary uppercase">更新</div>
              <div class="text-sm font-semibold">支持了新的 Graph 实体模型</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Module Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isAddModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="isAddModalOpen = false"></div>
          <div class="bg-surface rounded-2xl shadow-2xl w-[560px] max-w-[90vw] relative z-10 overflow-hidden flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-surface-container-low flex justify-between items-center bg-surface-container-lowest">
              <h3 class="text-lg font-bold text-on-surface flex items-center">
                <span class="material-symbols-outlined text-primary mr-2">add_box</span>
                新建系统模块
              </h3>
              <button @click="isAddModalOpen = false" class="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors">
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <!-- Modal Body -->
            <div class="p-6 space-y-5 overflow-y-auto">
              <div class="grid grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-on-surface-variant">模块名称 <span class="text-error">*</span></label>
                  <input v-model="newModule.name" type="text" class="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：员工档案管理" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-semibold text-on-surface-variant">模块标识 (ID) <span class="text-error">*</span></label>
                  <input v-model="newModule.id" type="text" class="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：MOD-HR-EMP" />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-semibold text-on-surface-variant">绑定的主实体表 <span class="text-error">*</span></label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">table_chart</span>
                  <input v-model="newModule.entity" type="text" class="w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：hr_employee_base" />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-semibold text-on-surface-variant">模块描述</label>
                <textarea v-model="newModule.desc" rows="3" class="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow resize-none" placeholder="简要描述该模块的业务边界和职责..."></textarea>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-surface-container-low flex justify-end gap-3 bg-surface-container-lowest">
              <button @click="isAddModalOpen = false" class="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
                取消
              </button>
              <button @click="submitModule" class="px-6 py-2 text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 shadow-sm rounded-lg transition-colors flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">check</span>
                确认创建
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, updateView, addModule, fetchModules } from '../store/mockStore';

const goToConfig = (mod) => {
  updateView('config', mod);
};

const openPermissionModal = (mod) => {
  updateView('permissions', mod);
};

const isAddModalOpen = ref(false);

const newModule = ref({
  id: 'MOD-HR-003',
  name: '考勤与排班中心',
  entity: 'hr_attendance_record',
  desc: '管理员工考勤打卡记录、假期额度及复杂倒班规则'
});

const submitModule = () => {
  if (!newModule.value.name || !newModule.value.id || !newModule.value.entity) return;
  
  addModule({
    id: newModule.value.id,
    name: newModule.value.name,
    desc: newModule.value.desc,
    entity: newModule.value.entity
  });
  
  isAddModalOpen.value = false;
  // Reset for next time
  newModule.value = { id: '', name: '', entity: '', desc: '' };
};
</script>

<style>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
