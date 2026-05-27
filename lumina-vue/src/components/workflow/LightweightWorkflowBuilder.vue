<template>
  <div @click="closeAllDropdowns" class="p-8 space-y-12 w-full animate-in fade-in duration-500">
    <!-- Main container click handler automatically dismisses active dropdowns -->
    
    <!-- Header Action Section (标题与按钮对齐) -->
    <div class="flex justify-between items-center mb-6 mt-[-1rem]" @click.stop>
      <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
        <PenTool class="mr-2 text-primary w-5 h-5" />
        流程配置设计器 (Flow Designer)
      </h2>
      
      <!-- Action Buttons -->
      <div class="flex space-x-3">
        <button @click="resetNodes" 
                class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center cursor-pointer">
          <Trash2 class="w-4 h-4 mr-2" />
          清空
        </button>
        <button @click="saveWorkflow" 
                class="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center cursor-pointer">
          <CheckCheck class="w-4 h-4 mr-2" />
          发布流程
        </button>
      </div>
    </div>

    <!-- Designer Main Canvas Card -->
    <div class="max-w-4xl mx-auto w-full relative">
      
      <!-- Main Flow Container (Backbone) -->
      <div class="flex flex-col items-center relative pl-4 pr-4">
        
        <!-- Continuous Vertical Backbone Laser Line -->
        <div class="absolute top-6 bottom-[150px] left-1/2 -translate-x-1/2 w-[2px] bg-slate-300 z-0"></div>

        <!-- Start Capsule Node -->
        <div class="relative z-10 mb-10 flex flex-col items-center animate-in fade-in zoom-in duration-500" @click.stop>
          <div class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-emerald-400 rounded-2xl shadow-[0px_4px_12px_rgba(16,185,129,0.06)]">
            <div class="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-[inset_0px_1px_3px_rgba(255,255,255,0.4)]">
              <Play class="w-4 h-4 fill-white" />
            </div>
            <div class="text-left">
              <div class="text-[11px] font-extrabold text-slate-800 leading-tight">流程开始</div>
              <div class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">申请人提交表单</div>
            </div>
          </div>
        </div>

        <!-- Nodes List -->
        <div class="w-full space-y-10 pb-10">
          <template v-for="(node, idx) in nodes" :key="node.tempId">
            <div class="relative w-full flex flex-col items-center"
                 :class="activeDropdownNodeIdx === idx ? 'z-30' : 'z-10'">
              
              <!-- Connection Arrow (Before Node) -->
              <div class="absolute -top-10 h-10 left-0 right-0 w-full flex items-end justify-center pointer-events-none">
                <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-slate-300"></div>
              </div>

              <!-- Node Card -->
              <div class="w-full max-w-[720px] bg-white rounded-3xl border border-slate-200/70 p-6 transition-all duration-300 shadow-[0px_6px_20px_rgba(25,28,29,0.03)] hover:shadow-[0px_12px_32px_rgba(25,28,29,0.06)] relative"
                   :class="node.type === 'parallel_group' ? 'hover:border-violet-200' : 'hover:border-primary/30'">
                
                <!-- Left-side vertical indicator line -->
                <div class="absolute left-0 top-6 bottom-6 w-1 rounded-r-md transition-colors"
                     :class="node.type === 'parallel_group' ? 'bg-violet-500' : 'bg-primary'"></div>

                <div class="flex justify-between items-center mb-6 pl-2" @click.stop>
                  <div class="flex items-center gap-4">
                    <div class="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shadow-inner font-mono"
                         :class="node.type === 'parallel_group' ? 'bg-violet-50 text-violet-600' : 'bg-primary/5 text-primary'">
                      {{ String(idx + 1).padStart(2, '0') }}
                    </div>
                    <div class="flex flex-col md:flex-row md:items-center gap-3">
                      <input v-model="node.name" 
                             class="font-headline font-extrabold text-base text-slate-800 bg-transparent border-b border-transparent focus:border-slate-200 focus:ring-0 p-0 py-0.5 w-64 md:w-80 outline-none transition-colors" 
                             placeholder="设置审批环节名称..." />
                      
                      <!-- Segmented Pill Box Mode Switcher -->
                      <div class="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200/30 self-start">
                        <button @click="node.type = 'user_task'" 
                                class="px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
                                :class="node.type === 'user_task' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                          <User class="w-3 h-3" /> 单人审批
                        </button>
                        <button @click="node.type = 'parallel_group'" 
                                class="px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
                                :class="node.type === 'parallel_group' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                          <GitBranch class="w-3 h-3" /> 并联协作
                        </button>
                      </div>
                    </div>
                  </div>
                  <button @click="removeNode(idx)" 
                          class="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center border border-slate-100 hover:border-rose-100 shadow-sm cursor-pointer">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>

                <!-- Node Body Content -->
                <div class="pl-2 pr-2">
                  <!-- Single Task View: Interactive Searchable Dropdowns -->
                  <div v-if="node.type === 'user_task'" class="flex flex-col gap-5 w-full text-left">
                    
                    <!-- Advanced Target & Decision Mode Controls -->
                    <div class="flex items-center gap-4 flex-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100" @click.stop>
                      
                      <!-- 1. Approver Type Toggle -->
                      <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">指派类型:</span>
                        <div class="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                          <button @click="node.approverType = 'role'; ensureNodeDefaults(node)" 
                                  class="px-2.5 py-1 rounded-md text-[9px] font-black tracking-wide transition-all cursor-pointer"
                                  :class="node.approverType === 'role' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                            指定角色 (多选)
                          </button>
                          <button @click="node.approverType = 'user'; ensureNodeDefaults(node)" 
                                  class="px-2.5 py-1 rounded-md text-[9px] font-black tracking-wide transition-all cursor-pointer"
                                  :class="node.approverType === 'user' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                            指定人员 (多选)
                          </button>
                        </div>
                      </div>

                      <!-- Divider -->
                      <span class="text-slate-200 hidden md:inline">|</span>

                      <!-- 2. Decision Mode Toggle -->
                      <div class="flex items-center gap-2">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">审批模式:</span>
                        <div class="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                          <button @click="node.approveMode = 'OR'" 
                                  class="px-2.5 py-1 rounded-md text-[9px] font-black tracking-wide transition-all cursor-pointer flex items-center gap-1"
                                  :class="node.approveMode === 'OR' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 或签 (OR)
                          </button>
                          <button @click="node.approveMode = 'AND'" 
                                  class="px-2.5 py-1 rounded-md text-[9px] font-black tracking-wide transition-all cursor-pointer flex items-center gap-1"
                                  :class="node.approveMode === 'AND' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> 会签 (AND)
                          </button>
                        </div>
                      </div>
                      <span class="text-[9px] text-slate-400 font-medium ml-auto tracking-tight bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                        {{ node.approveMode === 'OR' ? '说明: 指派成员中任意一人通过即可' : '说明: 指派成员必须全部通过才可推进' }}
                      </span>
                    </div>

                    <!-- 3. Space-saving Dropdown Assignment Fields -->
                    
                    <!-- Option A: Multi-Select Role Dropdown -->
                    <div v-if="node.approverType === 'role'" class="relative w-full text-left">
                      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">选择指派角色 (Select Roles)</span>
                      
                      <!-- Selector Bar -->
                      <div @click.stop="toggleDropdown(idx, 'role')"
                           class="w-full bg-white border border-slate-200 rounded-xl p-2.5 min-h-[44px] flex flex-wrap items-center gap-2 pr-10 relative cursor-pointer hover:border-slate-300 transition-all select-none">
                        
                        <!-- Selected Roles Tags -->
                        <div v-for="rVal in node.roles" :key="rVal"
                             class="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg text-xs font-bold animate-in scale-in duration-200">
                          <component :is="rolesConfig.find(r => r.val === rVal)?.icon || GraduationCap" class="w-3.5 h-3.5" />
                          <span>{{ rolesConfig.find(r => r.val === rVal)?.label || rVal }}</span>
                          <button @click.stop="removeRole(node, rVal)"
                                  class="text-primary/60 hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center justify-center">
                            <X class="w-3 h-3" />
                          </button>
                        </div>
                        
                        <span v-if="!node.roles || node.roles.length === 0" class="text-xs text-slate-400 font-medium">点击指派一个或多个审批角色...</span>
                        
                        <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300"
                                     :class="activeDropdownNodeIdx === idx && activeDropdownType === 'role' ? 'rotate-180 text-primary' : ''" />
                      </div>

                      <!-- Searchable Menu Overlay -->
                      <div v-if="activeDropdownNodeIdx === idx && activeDropdownType === 'role'"
                           @click.stop
                           class="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 max-h-72 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                        
                        <!-- Search Box -->
                        <div class="relative flex items-center">
                          <Search class="w-4 h-4 absolute left-3 text-slate-400" />
                          <input v-model="memberSearchQuery"
                                 class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all placeholder-slate-400 text-slate-800"
                                 placeholder="输入角色名称或简称搜索..." />
                        </div>

                        <!-- Dropdown Items -->
                        <div class="overflow-y-auto custom-scrollbar flex-1 max-h-48 divide-y divide-slate-100">
                          <div v-for="role in getFilteredRoles()" :key="role.val"
                               @click="toggleRole(node, role.val)"
                               class="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors select-none text-xs">
                            
                            <div class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-200"
                                 :class="node.roles && node.roles.includes(role.val) 
                                   ? 'bg-primary border-primary text-white' 
                                   : 'border-slate-300 bg-white'">
                              <Check v-if="node.roles && node.roles.includes(role.val)" class="w-2.5 h-2.5" />
                            </div>

                            <component :is="role.icon" class="w-4 h-4 text-slate-400" />
                            <span class="font-extrabold text-slate-700">{{ role.label }}</span>
                            <span class="text-[8px] px-1.5 py-0.5 rounded font-mono font-black bg-slate-100 text-slate-400 ml-auto uppercase tracking-wider">{{ role.code }}</span>
                          </div>
                          <div v-if="getFilteredRoles().length === 0" class="text-center py-4 text-slate-400 text-xs italic">未找到匹配的角色</div>
                        </div>
                      </div>
                    </div>

                    <!-- Option B: Multi-Select Person Dropdown -->
                    <div v-else class="relative w-full text-left">
                      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">选择指派人员 (Select Users)</span>
                      
                      <!-- Selector Bar -->
                      <div @click.stop="toggleDropdown(idx, 'user')"
                           class="w-full bg-white border border-slate-200 rounded-xl p-2.5 min-h-[44px] flex flex-wrap items-center gap-2 pr-10 relative cursor-pointer hover:border-slate-300 transition-all select-none">
                        
                        <!-- Selected Users Tags -->
                        <div v-for="uVal in node.users" :key="uVal"
                             class="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary border border-primary/10 rounded-lg text-xs font-bold animate-in scale-in duration-200">
                          <div class="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center">
                            {{ mockUsers.find(u => u.val === uVal)?.avatarText || 'U' }}
                          </div>
                          <span>{{ mockUsers.find(u => u.val === uVal)?.label || uVal }}</span>
                          <button @click.stop="removeUser(node, uVal)"
                                  class="text-primary/60 hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center justify-center">
                            <X class="w-3 h-3" />
                          </button>
                        </div>
                        
                        <span v-if="!node.users || node.users.length === 0" class="text-xs text-slate-400 font-medium">点击指派一个或多个审批人员...</span>
                        
                        <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300"
                                     :class="activeDropdownNodeIdx === idx && activeDropdownType === 'user' ? 'rotate-180 text-primary' : ''" />
                      </div>

                      <!-- Searchable Menu Overlay -->
                      <div v-if="activeDropdownNodeIdx === idx && activeDropdownType === 'user'"
                           @click.stop
                           class="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 max-h-72 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                        
                        <!-- Search Box -->
                        <div class="relative flex items-center">
                          <Search class="w-4 h-4 absolute left-3 text-slate-400" />
                          <input v-model="memberSearchQuery"
                                 class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all placeholder-slate-400 text-slate-800"
                                 placeholder="输入姓名或工号简称搜索..." />
                        </div>

                        <!-- Dropdown Items -->
                        <div class="overflow-y-auto custom-scrollbar flex-1 max-h-48 divide-y divide-slate-100">
                          <div v-for="user in getFilteredUsers()" :key="user.val"
                               @click="toggleUser(node, user.val)"
                               class="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors select-none text-xs">
                            
                            <div class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-200"
                                 :class="node.users && node.users.includes(user.val) 
                                   ? 'bg-primary border-primary text-white' 
                                   : 'border-slate-300 bg-white'">
                              <Check v-if="node.users && node.users.includes(user.val)" class="w-2.5 h-2.5" />
                            </div>

                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors"
                                 :class="node.users && node.users.includes(user.val) ? 'bg-primary text-white shadow-sm' : 'bg-slate-200 text-slate-600'">
                              {{ user.avatarText }}
                            </div>

                            <span class="font-extrabold text-slate-700">{{ user.label }}</span>
                            <span class="text-[8px] px-1.5 py-0.5 rounded font-mono font-black bg-slate-100 text-slate-400 ml-auto uppercase tracking-wider">{{ user.code }}</span>
                          </div>
                          <div v-if="getFilteredUsers().length === 0" class="text-center py-4 text-slate-400 text-xs italic">未找到匹配的人员</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <!-- Parallel Group View (Upgraded with Cohesive Searchable Multi-Select Assignee Cards) -->
                  <div class="relative" v-else>
                    <!-- Fork Connector -->
                    <div class="flex flex-col items-center mb-5" @click.stop>
                      <div class="w-[2px] h-4 bg-gradient-to-b from-slate-200 to-violet-100"></div>
                      <div class="w-[85%] h-[2px] bg-gradient-to-r from-transparent via-violet-200 to-transparent"></div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      <div v-for="(branch, bIdx) in node.branches" :key="bIdx" 
                           class="bg-slate-50/30 rounded-2xl border border-slate-200/50 p-4 shadow-sm hover:shadow-md transition-all relative group/branch text-left"
                           :class="activeDropdownNodeIdx === idx && activeDropdownBranchIdx === bIdx ? 'z-30' : 'z-10'">
                        
                        <!-- Side purple line indicator on hover (with rounded-l-2xl alignment) -->
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-violet-400/20 group-hover/branch:bg-violet-500 transition-all rounded-l-2xl"></div>
                        
                        <div class="flex justify-between items-center mb-3 pl-1.5" @click.stop>
                          <span class="text-[9px] font-black text-violet-600 uppercase tracking-widest">协作分支 {{ bIdx + 1 }}</span>
                          <button @click="removeBranch(idx, bIdx)" 
                                  class="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer flex items-center justify-center">
                            <X class="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div class="px-1.5 space-y-3">
                          <div class="flex flex-col gap-1">
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-wider">分支任务描述</span>
                            <input v-model="branch.name" 
                                   class="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder-slate-200" 
                                   placeholder="录入协作任务名称..." />
                          </div>

                          <!-- Compact Toggle Controls for Branch (Matching Single Node Logic) -->
                          <div class="flex flex-col gap-2 bg-slate-100/40 p-2.5 rounded-xl border border-slate-200/30" @click.stop>
                            <div class="flex items-center justify-between gap-1.5">
                              <span class="text-[8px] font-black text-slate-400 uppercase tracking-wider">指派类型:</span>
                              <div class="flex bg-slate-200/60 p-0.5 rounded-md">
                                <button @click="branch.approverType = 'role'; ensureBranchDefaults(branch)" 
                                        class="px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer"
                                        :class="branch.approverType === 'role' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                                  角色
                                </button>
                                <button @click="branch.approverType = 'user'; ensureBranchDefaults(branch)" 
                                        class="px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer"
                                        :class="branch.approverType === 'user' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                                  人员
                                </button>
                              </div>
                            </div>
                            
                            <div class="flex items-center justify-between gap-1.5">
                              <span class="text-[8px] font-black text-slate-400 uppercase tracking-wider">审批模式:</span>
                              <div class="flex bg-slate-200/60 p-0.5 rounded-md">
                                <button @click="branch.approveMode = 'OR'; ensureBranchDefaults(branch)" 
                                        class="px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer"
                                        :class="branch.approveMode === 'OR' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                                  或签
                                </button>
                                <button @click="branch.approveMode = 'AND'; ensureBranchDefaults(branch)" 
                                        class="px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer"
                                        :class="branch.approveMode === 'AND' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                                  会签
                                </button>
                              </div>
                            </div>
                          </div>

                          <!-- Multi-Select Role Selector for Branch -->
                          <div v-if="branch.approverType === 'role'" class="relative w-full text-left">
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">选择角色</span>
                            
                            <div @click.stop="toggleBranchDropdown(idx, bIdx, 'branch-role')"
                                 class="w-full bg-white border border-slate-200 rounded-xl p-2 min-h-[38px] flex flex-wrap items-center gap-1.5 pr-8 relative cursor-pointer hover:border-slate-300 transition-all select-none">
                              
                              <div v-for="rVal in branch.roles" :key="rVal"
                                   class="flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-md text-[10px] font-extrabold animate-in scale-in duration-200">
                                <span>{{ rolesConfig.find(r => r.val === rVal)?.label || rVal }}</span>
                                <button @click.stop="removeBranchRole(branch, rVal)"
                                        class="text-violet-600/60 hover:text-violet-600 focus:outline-none cursor-pointer flex items-center justify-center">
                                  <X class="w-2.5 h-2.5" />
                                </button>
                              </div>
                              
                              <span v-if="!branch.roles || branch.roles.length === 0" class="text-[10px] text-slate-400 font-medium">指派审批角色...</span>
                              
                              <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-300"
                                           :class="activeDropdownNodeIdx === idx && activeDropdownBranchIdx === bIdx && activeDropdownType === 'branch-role' ? 'rotate-180 text-violet-500' : ''" />
                            </div>

                            <div v-if="activeDropdownNodeIdx === idx && activeDropdownBranchIdx === bIdx && activeDropdownType === 'branch-role'"
                                 @click.stop
                                 class="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 max-h-56 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
                              <div class="relative flex items-center">
                                <Search class="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                                <input v-model="memberSearchQuery"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-[10px] font-semibold focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder-slate-400 text-slate-800"
                                       placeholder="搜索角色..." />
                              </div>
                              <div class="overflow-y-auto custom-scrollbar flex-1 max-h-36 divide-y divide-slate-100">
                                <div v-for="role in getFilteredRoles()" :key="role.val"
                                     @click="toggleBranchRole(branch, role.val)"
                                     class="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors select-none text-[10px]">
                                  <div class="w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200"
                                       :class="branch.roles && branch.roles.includes(role.val) ? 'bg-violet-500 border-violet-500 text-white' : 'border-slate-300 bg-white'">
                                    <Check v-if="branch.roles && branch.roles.includes(role.val)" class="w-2 h-2" />
                                  </div>
                                  <span class="font-extrabold text-slate-700">{{ role.label }}</span>
                                </div>
                                <div v-if="getFilteredRoles().length === 0" class="text-center py-2 text-slate-400 text-[10px] italic">未匹配</div>
                              </div>
                            </div>
                          </div>

                          <!-- Multi-Select Person Selector for Branch -->
                          <div v-else class="relative w-full text-left">
                            <span class="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">选择人员</span>
                            
                            <div @click.stop="toggleBranchDropdown(idx, bIdx, 'branch-user')"
                                 class="w-full bg-white border border-slate-200 rounded-xl p-2 min-h-[38px] flex flex-wrap items-center gap-1.5 pr-8 relative cursor-pointer hover:border-slate-300 transition-all select-none">
                              
                              <div v-for="uVal in branch.users" :key="uVal"
                                   class="flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-md text-[10px] font-extrabold animate-in scale-in duration-200">
                                <div class="w-3.5 h-3.5 rounded-full bg-violet-500 text-white text-[8px] font-black flex items-center justify-center">
                                  {{ mockUsers.find(u => u.val === uVal)?.avatarText || 'U' }}
                                </div>
                                <span>{{ mockUsers.find(u => u.val === uVal)?.label || uVal }}</span>
                                <button @click.stop="removeBranchUser(branch, uVal)"
                                        class="text-violet-600/60 hover:text-violet-600 focus:outline-none cursor-pointer flex items-center justify-center">
                                  <X class="w-2.5 h-2.5" />
                                </button>
                              </div>
                              
                              <span v-if="!branch.users || branch.users.length === 0" class="text-[10px] text-slate-400 font-medium">指派审批人员...</span>
                              
                              <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-300"
                                           :class="activeDropdownNodeIdx === idx && activeDropdownBranchIdx === bIdx && activeDropdownType === 'branch-user' ? 'rotate-180 text-violet-500' : ''" />
                            </div>

                            <div v-if="activeDropdownNodeIdx === idx && activeDropdownBranchIdx === bIdx && activeDropdownType === 'branch-user'"
                                 @click.stop
                                 class="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2.5 max-h-56 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
                              <div class="relative flex items-center">
                                <Search class="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                                <input v-model="memberSearchQuery"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-[10px] font-semibold focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder-slate-400 text-slate-800"
                                       placeholder="搜索人员..." />
                              </div>
                              <div class="overflow-y-auto custom-scrollbar flex-1 max-h-36 divide-y divide-slate-100">
                                <div v-for="user in getFilteredUsers()" :key="user.val"
                                     @click="toggleBranchUser(branch, user.val)"
                                     class="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors select-none text-[10px]">
                                  <div class="w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200"
                                       :class="branch.users && branch.users.includes(user.val) ? 'bg-violet-500 border-violet-500 text-white' : 'border-slate-300 bg-white'">
                                    <Check v-if="branch.users && branch.users.includes(user.val)" class="w-2 h-2" />
                                  </div>
                                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black bg-slate-200 text-slate-600"
                                       :class="branch.users && branch.users.includes(user.val) ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'">
                                    {{ user.avatarText }}
                                  </div>
                                  <span class="font-extrabold text-slate-700">{{ user.label }}</span>
                                </div>
                                <div v-if="getFilteredUsers().length === 0" class="text-center py-2 text-slate-400 text-[10px] italic">未匹配</div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                      
                      <!-- Add Branch Placeholder -->
                      <button @click.stop="addBranch(idx)" 
                              class="rounded-2xl border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-all bg-slate-50/10 hover:bg-violet-50/5 cursor-pointer min-h-[150px] group/add-b">
                        <PlusCircle class="w-6 h-6 mb-1.5 transition-transform duration-300 group-hover/add-b:scale-110 text-slate-300 group-hover/add-b:text-violet-400" />
                        <span class="text-[9px] font-black uppercase tracking-widest">添加并联分支</span>
                      </button>
                    </div>

                    <!-- Join Connector -->
                    <div class="flex flex-col items-center mt-5" @click.stop>
                      <div class="w-[85%] h-[2px] bg-gradient-to-r from-transparent via-violet-200 to-transparent"></div>
                      <div class="w-[2px] h-4 bg-gradient-to-b from-violet-100 to-slate-200"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inter-node Add Button (Floating on Laser Backbone) -->
              <div class="relative w-full flex justify-center py-6" @click.stop>
                <button @click="addNodeAt(idx + 1)" 
                        class="w-8 h-8 rounded-full bg-white border-2 border-slate-200 text-slate-500 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center hover:scale-115 active:scale-95 z-20 group cursor-pointer">
                  <Plus class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                </button>
              </div>

            </div>
          </template>
        </div>

        <!-- End Capsule Node -->
        <div class="relative z-10 pb-32 flex flex-col items-center animate-in fade-in zoom-in duration-500" @click.stop>
          <!-- Final Connection Arrow -->
          <div class="absolute -top-10 h-10 left-0 right-0 w-full flex items-end justify-center pointer-events-none">
            <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-slate-300"></div>
          </div>

          <div class="flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-300 rounded-2xl shadow-[0px_4px_12px_rgba(100,116,139,0.05)]">
            <div class="w-7 h-7 rounded-lg bg-slate-400 text-white flex items-center justify-center shadow-[inset_0px_1px_3px_rgba(255,255,255,0.4)]">
              <Flag class="w-4 h-4 fill-white" />
            </div>
            <div class="text-left">
              <div class="text-[11px] font-extrabold text-slate-800 leading-tight">流程归档</div>
              <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">审批通过并生效</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  PenTool, 
  Trash2, 
  CheckCheck, 
  Play, 
  User, 
  GitBranch, 
  Search, 
  X, 
  Check, 
  PlusCircle, 
  Plus, 
  Flag, 
  GraduationCap, 
  Landmark, 
  Wallet, 
  Shield, 
  Users, 
  ChevronDown 
} from 'lucide-vue-next';

// 1. 统一指派与模拟角色名录配置
const rolesConfig = [
  { val: 'head_teacher', label: '任课老师', code: 'TEA', icon: GraduationCap },
  { val: 'academic_admin', label: '教务处', code: 'EDU', icon: Landmark },
  { val: 'finance', label: '财务处', code: 'FIN', icon: Wallet },
  { val: 'principal', label: '学校校长', code: 'PRN', icon: Shield },
  { val: 'hr_director', label: '人事总监', code: 'HRD', icon: Users }
];

// 2. 统一 Mock 用户人员名录配置
const mockUsers = [
  { val: 'alex_zhang', label: '张老师', code: 'TEA', icon: User, avatarText: '张' },
  { val: 'bella_wang', label: '王教务', code: 'EDU', icon: User, avatarText: '王' },
  { val: 'charlie_li', label: '李财务', code: 'FIN', icon: User, avatarText: '李' },
  { val: 'david_zhao', label: '赵校长', code: 'PRN', icon: User, avatarText: '赵' },
  { val: 'emma_sun', label: '孙人事', code: 'HRD', icon: User, avatarText: '孙' }
];

// 3. 响应式序列节点定义
const nodes = ref([
  { 
    tempId: 1, 
    name: '环节一：合规性初审', 
    type: 'user_task', 
    approverType: 'role', 
    roles: ['head_teacher'], 
    users: ['alex_zhang'],
    approveMode: 'OR'
  },
  { 
    tempId: 2, 
    name: '环节二：跨部门并联会签', 
    type: 'parallel_group', 
    branches: [
      { 
        branch_id: 'b1', name: '学术价值核查', role_target: 'academic_admin',
        approverType: 'role', roles: ['academic_admin'], users: ['bella_wang'], approveMode: 'OR'
      },
      { 
        branch_id: 'b2', name: '经费报销复核', role_target: 'finance',
        approverType: 'role', roles: ['finance'], users: ['charlie_li'], approveMode: 'OR'
      }
    ]
  }
]);

// 4. 下拉菜单全局状态处理器（通过节点索引、分支索引及类型统一管理，完美应对并联内包含审批的多维度下拉树）
const activeDropdownNodeIdx = ref(null);
const activeDropdownBranchIdx = ref(null);
const activeDropdownType = ref('');
const memberSearchQuery = ref('');

const toggleDropdown = (idx, type) => {
  if (activeDropdownNodeIdx.value === idx && activeDropdownBranchIdx.value === null && activeDropdownType.value === type) {
    closeAllDropdowns();
  } else {
    activeDropdownNodeIdx.value = idx;
    activeDropdownBranchIdx.value = null;
    activeDropdownType.value = type;
    memberSearchQuery.value = '';
  }
};

const toggleBranchDropdown = (nodeIdx, branchIdx, type) => {
  if (activeDropdownNodeIdx.value === nodeIdx && activeDropdownBranchIdx.value === branchIdx && activeDropdownType.value === type) {
    closeAllDropdowns();
  } else {
    activeDropdownNodeIdx.value = nodeIdx;
    activeDropdownBranchIdx.value = branchIdx;
    activeDropdownType.value = type;
    memberSearchQuery.value = '';
  }
};

const closeAllDropdowns = () => {
  activeDropdownNodeIdx.value = null;
  activeDropdownBranchIdx.value = null;
  activeDropdownType.value = '';
  memberSearchQuery.value = '';
};

// 5. 动态搜索过滤计算属性方法
const getFilteredRoles = () => {
  const q = memberSearchQuery.value.trim().toLowerCase();
  if (!q) return rolesConfig;
  return rolesConfig.filter(r => r.label.includes(q) || r.code.toLowerCase().includes(q));
};

const getFilteredUsers = () => {
  const q = memberSearchQuery.value.trim().toLowerCase();
  if (!q) return mockUsers;
  return mockUsers.filter(u => u.label.includes(q) || u.code.toLowerCase().includes(q));
};

const ensureNodeDefaults = (node) => {
  if (!node.roles || node.roles.length === 0) {
    node.roles = ['head_teacher'];
  }
  if (!node.users || node.users.length === 0) {
    node.users = ['alex_zhang'];
  }
  if (!node.approveMode) {
    node.approveMode = 'OR';
  }
};

const toggleRole = (node, roleVal) => {
  ensureNodeDefaults(node);
  const idx = node.roles.indexOf(roleVal);
  if (idx > -1) {
    // 强制至少留存一个角色
    if (node.roles.length > 1) {
      node.roles.splice(idx, 1);
    }
  } else {
    node.roles.push(roleVal);
  }
};

const removeRole = (node, roleVal) => {
  ensureNodeDefaults(node);
  const idx = node.roles.indexOf(roleVal);
  if (idx > -1) {
    if (node.roles.length > 1) {
      node.roles.splice(idx, 1);
    }
  }
};

const toggleUser = (node, userVal) => {
  ensureNodeDefaults(node);
  const idx = node.users.indexOf(userVal);
  if (idx > -1) {
    // 强制至少留存一个人员
    if (node.users.length > 1) {
      node.users.splice(idx, 1);
    }
  } else {
    node.users.push(userVal);
  }
};

const removeUser = (node, userVal) => {
  ensureNodeDefaults(node);
  const idx = node.users.indexOf(userVal);
  if (idx > -1) {
    if (node.users.length > 1) {
      node.users.splice(idx, 1);
    }
  }
};

// 6. 并联分支数据一致性初始化及 Toggle 处理器
const ensureBranchDefaults = (branch) => {
  if (!branch.roles || branch.roles.length === 0) {
    branch.roles = branch.role_target ? [branch.role_target] : ['finance'];
  }
  if (!branch.users || branch.users.length === 0) {
    branch.users = ['charlie_li'];
  }
  if (!branch.approverType) {
    branch.approverType = 'role';
  }
  if (!branch.approveMode) {
    branch.approveMode = 'OR';
  }
};

const toggleBranchRole = (branch, roleVal) => {
  ensureBranchDefaults(branch);
  const idx = branch.roles.indexOf(roleVal);
  if (idx > -1) {
    if (branch.roles.length > 1) {
      branch.roles.splice(idx, 1);
    }
  } else {
    branch.roles.push(roleVal);
  }
  branch.role_target = branch.roles[0];
};

const removeBranchRole = (branch, roleVal) => {
  ensureBranchDefaults(branch);
  const idx = branch.roles.indexOf(roleVal);
  if (idx > -1) {
    if (branch.roles.length > 1) {
      branch.roles.splice(idx, 1);
    }
  }
  branch.role_target = branch.roles[0];
};

const toggleBranchUser = (branch, userVal) => {
  ensureBranchDefaults(branch);
  const idx = branch.users.indexOf(userVal);
  if (idx > -1) {
    if (branch.users.length > 1) {
      branch.users.splice(idx, 1);
    }
  } else {
    branch.users.push(userVal);
  }
};

const removeBranchUser = (branch, userVal) => {
  ensureBranchDefaults(branch);
  const idx = branch.users.indexOf(userVal);
  if (idx > -1) {
    if (branch.users.length > 1) {
      branch.users.splice(idx, 1);
    }
  }
};

const addNodeAt = (idx) => {
  nodes.value.splice(idx, 0, {
    tempId: Date.now(),
    name: '新审批步骤',
    type: 'user_task',
    approverType: 'role',
    roles: ['academic_admin'],
    users: ['bella_wang'],
    approveMode: 'OR'
  });
};

const removeNode = (idx) => {
  if (nodes.value.length > 1) nodes.value.splice(idx, 1);
};

const addBranch = (nodeIdx) => {
  const node = nodes.value[nodeIdx];
  if (!node.branches) node.branches = [];
  node.branches.push({ 
    branch_id: `b${Date.now()}`, 
    name: '协作子任务', 
    role_target: 'finance',
    approverType: 'role',
    roles: ['finance'],
    users: ['charlie_li'],
    approveMode: 'OR'
  });
};

const removeBranch = (nodeIdx, bIdx) => {
  const node = nodes.value[nodeIdx];
  if (!node || !node.branches) return;
  node.branches.splice(bIdx, 1);
};

const resetNodes = () => {
  if (confirm('确定清空并重新开始设计吗？')) {
    nodes.value = [{ 
      tempId: Date.now(), 
      name: '环节一：申请人自评', 
      type: 'user_task', 
      approverType: 'role', 
      roles: ['head_teacher'], 
      users: ['alex_zhang'],
      approveMode: 'OR'
    }];
  }
};

const saveWorkflow = async () => {
  console.log('[Workflow] Final Sequence Payload:', JSON.parse(JSON.stringify(nodes.value)));
  alert('审批流配置已成功发布！\n\n后端将自动解析此序列为带逻辑关系的双向链表。');
};

defineExpose({
  resetNodes,
  saveWorkflow
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 12px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

input::placeholder { color: #cbd5e1; font-weight: normal; }
</style>
