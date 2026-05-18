<template>
  <div class="flex flex-col h-full bg-slate-50/30 rounded-2xl border border-outline-variant/10 p-8 overflow-y-auto custom-scrollbar">
    <div class="max-w-4xl mx-auto w-full relative">
      
      <!-- Fixed Header -->
      <div class="flex justify-between items-center mb-12 relative z-30 bg-slate-50/80 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm">
        <div>
          <h3 class="text-xl font-black font-headline text-on-surface tracking-tight">极简序列设计器</h3>
          <p class="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold mt-1 opacity-50">Lumina Sequential Flow Engine</p>
        </div>
        <div class="flex gap-3">
          <button @click="resetNodes" class="px-5 py-2 text-xs font-bold text-on-surface-variant hover:bg-white rounded-2xl transition-all border border-transparent hover:border-outline-variant/20">清空</button>
          <button @click="saveWorkflow" class="px-8 py-2 bg-primary text-on-primary text-sm font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">send</span> 发布流程
          </button>
        </div>
      </div>

      <!-- Main Flow Container (Backbone) -->
      <div class="flex flex-col items-center relative">
        
        <!-- Continuous Vertical Backbone Line -->
        <div class="absolute top-6 bottom-6 w-1 bg-slate-200 z-0"></div>

        <!-- Start Node -->
        <div class="flex flex-col items-center relative z-10 mb-8">
          <div class="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-200/50 border-4 border-white">
            <span class="material-symbols-outlined text-3xl">play_arrow</span>
          </div>
          <div class="mt-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
            <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">流程开始</span>
          </div>
        </div>

        <!-- Nodes List -->
        <div class="w-full space-y-12 pb-12">
          <template v-for="(node, idx) in nodes" :key="node.tempId">
            <div class="relative w-full flex flex-col items-center">
              
              <!-- Connection Arrow (Before Node) -->
              <div class="absolute -top-12 h-12 flex items-center justify-center">
                <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-slate-300"></div>
              </div>

              <!-- Node Card -->
              <div class="w-full bg-white rounded-[2.5rem] border-2 p-8 transition-all duration-500 shadow-sm hover:shadow-2xl relative z-10"
                   :class="node.type === 'parallel_group' ? 'border-tertiary/10' : 'border-primary/5'">
                
                <!-- Center Alignment Dot (Internal Backbone) -->
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-200 rounded-b-full"></div>
                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-200 rounded-t-full"></div>

                <div class="flex justify-between items-center mb-8">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner"
                         :class="node.type === 'parallel_group' ? 'bg-tertiary' : 'bg-primary'">
                      {{ idx + 1 }}
                    </div>
                    <div>
                      <input v-model="node.name" class="font-headline font-black text-xl text-on-surface bg-transparent border-none focus:ring-0 p-0 w-80" placeholder="设置审批环节名称..." />
                      <div class="flex gap-5 mt-2">
                        <button @click="node.type = 'user_task'" class="text-[11px] font-black transition-all" :class="node.type === 'user_task' ? 'text-primary' : 'text-slate-300 hover:text-slate-400'">● 普通单审</button>
                        <button @click="node.type = 'parallel_group'" class="text-[11px] font-black transition-all" :class="node.type === 'parallel_group' ? 'text-tertiary' : 'text-slate-300 hover:text-slate-400'">● 并联协作</button>
                      </div>
                    </div>
                  </div>
                  <button @click="removeNode(idx)" class="w-10 h-10 rounded-full bg-slate-50 text-slate-300 hover:bg-error/10 hover:text-error transition-all flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>

                <!-- Node Body Content -->
                <div class="px-4">
                  <!-- Single Task View -->
                  <div v-if="node.type === 'user_task'" class="flex flex-col items-center">
                    <div class="w-full bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex items-center gap-5">
                      <div class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <span class="material-symbols-outlined text-2xl">shield_person</span>
                      </div>
                      <div class="flex-1">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">执行审批的角色</span>
                        <select v-model="node.role" class="w-full bg-transparent border-none p-0 text-base font-bold text-on-surface focus:ring-0">
                          <option v-for="r in availableRoles" :key="r.val" :value="r.val">{{ r.label }}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Parallel Group View (With Internal Fork-Join Lines) -->
                  <div v-else class="relative">
                    <!-- Fork Connector -->
                    <div class="flex flex-col items-center mb-6">
                      <div class="w-1 h-6 bg-slate-100"></div>
                      <div class="w-full h-px bg-slate-100 max-w-[80%]"></div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      <div v-for="(branch, bIdx) in node.branches" :key="bIdx" 
                           class="bg-white rounded-3xl border-2 border-tertiary/5 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group/branch">
                        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary/20 group-hover/branch:bg-tertiary transition-colors"></div>
                        <div class="flex justify-between items-start mb-4">
                           <span class="text-[9px] font-black text-tertiary uppercase tracking-widest">协作分支 {{ bIdx + 1 }}</span>
                           <button @click="removeBranch(idx, bIdx)" class="opacity-0 group-hover/branch:opacity-100 text-slate-300 hover:text-error transition-all"><span class="material-symbols-outlined text-base">close</span></button>
                        </div>
                        <input v-model="branch.name" class="w-full bg-transparent border-none p-0 text-sm font-bold text-on-surface mb-3 focus:ring-0" placeholder="任务描述" />
                        <select v-model="branch.role_target" class="w-full bg-tertiary/5 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-tertiary focus:ring-1 focus:ring-tertiary/20">
                          <option v-for="r in availableRoles" :key="r.val" :value="r.val">{{ r.label }}</option>
                        </select>
                      </div>
                      
                      <!-- Add Branch Placeholder -->
                      <button @click="addBranch(idx)" class="rounded-3xl border-2 border-dashed border-slate-100 p-6 flex flex-col items-center justify-center text-slate-300 hover:border-tertiary/30 hover:text-tertiary transition-all bg-slate-50/30">
                        <span class="material-symbols-outlined text-3xl mb-2">add_circle</span>
                        <span class="text-[10px] font-black uppercase tracking-widest">添加新分支</span>
                      </button>
                    </div>

                    <!-- Join Connector -->
                    <div class="flex flex-col items-center mt-6">
                      <div class="w-full h-px bg-slate-100 max-w-[80%]"></div>
                      <div class="w-1 h-6 bg-slate-100"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inter-node Add Button (Floating on Backbone) -->
              <div class="relative w-full flex justify-center py-6">
                <button @click="addNodeAt(idx + 1)" 
                        class="w-10 h-10 rounded-full bg-white border-4 border-slate-50 text-slate-400 hover:border-primary/20 hover:text-primary transition-all flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 z-20 group">
                  <span class="material-symbols-outlined text-2xl font-black">add</span>
                </button>
              </div>

            </div>
          </template>
        </div>

        <!-- End Point -->
        <div class="flex flex-col items-center pb-32 relative z-10">
           <!-- Final Arrow -->
           <div class="absolute -top-12 h-12 flex items-center justify-center">
             <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-slate-300"></div>
           </div>
           
           <div class="w-16 h-16 rounded-full border-8 border-slate-100 bg-white flex items-center justify-center text-slate-200 shadow-inner">
             <span class="material-symbols-outlined text-3xl">flag</span>
           </div>
           <div class="mt-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">流程归档</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const availableRoles = [
  { val: 'head_teacher', label: '任课老师 / 教研组长' },
  { val: 'academic_admin', label: '教务处 / 行政主管' },
  { val: 'finance', label: '财务处 / 结算会计' },
  { val: 'principal', label: '学校校长 / 终审席' },
  { val: 'hr_director', label: '人事总监 / 组织部' }
];

const nodes = ref([
  { tempId: 1, name: '环节一：合规性初审', type: 'user_task', role: 'head_teacher' },
  { tempId: 2, name: '环节二：跨部门并联会签', type: 'parallel_group', branches: [
    { branch_id: 'b1', name: '学术价值核查', role_target: 'academic_admin' },
    { branch_id: 'b2', name: '经费报销复核', role_target: 'finance' }
  ]}
]);

const addNodeAt = (idx) => {
  nodes.value.splice(idx, 0, {
    tempId: Date.now(),
    name: '新审批步骤',
    type: 'user_task',
    role: 'academic_admin'
  });
};

const removeNode = (idx) => {
  if (nodes.value.length > 1) nodes.value.splice(idx, 1);
};

const addBranch = (nodeIdx) => {
  const node = nodes.value[nodeIdx];
  if (!node.branches) node.branches = [];
  node.branches.push({ branch_id: `b${Date.now()}`, name: '协作子任务', role_target: 'finance' });
};

const removeBranch = (nodeIdx, bIdx) => {
  if (nodes.value[nodeIdx].branches.length > 1) nodes.value[nodeIdx].branches.splice(bIdx, 1);
};

const resetNodes = () => {
  if (confirm('确定清空并重新开始设计吗？')) {
    nodes.value = [{ tempId: Date.now(), name: '环节一：申请人自评', type: 'user_task', role: 'head_teacher' }];
  }
};

const saveWorkflow = async () => {
  console.log('[Workflow] Final Sequence Payload:', JSON.parse(JSON.stringify(nodes.value)));
  alert('审批流配置已成功发布！\n\n后端将自动解析此序列为带逻辑关系的双向链表。');
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 12px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

input::placeholder { color: #cbd5e1; font-weight: normal; }
</style>
