import { reactive } from 'vue';

export const userToRoleMap = {
  admin_sys: 'admin',
  alex_zhang: 'head_teacher',
  bella_wang: 'academic_admin',
  charlie_li: 'finance',
  david_zhao: 'principal',
  emma_sun: 'hr_director'
};

export const roleToUserMap = {
  admin: 'admin_sys',
  head_teacher: 'alex_zhang',
  academic_admin: 'bella_wang',
  finance: 'charlie_li',
  principal: 'david_zhao',
  hr_director: 'emma_sun'
};

export const appState = reactive({
  currentView: 'list',
  loading: false,
  workflowViewMode: 'list',
  sidebarCollapsed: false, // Left sidebar fold/unfold state
  
  // Simulated identity states:
  simulationMode: 'role', // 'role' | 'user'
  currentUserRole: 'admin',
  currentUser: 'admin_sys',
  
  // Global event to trigger reload
  refreshTrigger: 0
});

export const setView = (view) => {
  appState.currentView = view;
};

export const setLoading = (val) => {
  appState.loading = val;
};

export const selectRole = (roleVal) => {
  appState.currentUserRole = roleVal;
  appState.currentUser = roleToUserMap[roleVal] || 'admin_sys';
  appState.refreshTrigger++;
};

export const selectUser = (userVal) => {
  appState.currentUser = userVal;
  appState.currentUserRole = userToRoleMap[userVal] || 'admin';
  appState.refreshTrigger++;
};
