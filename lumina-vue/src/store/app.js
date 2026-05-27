import { reactive } from 'vue';

export const appState = reactive({
  currentView: 'list',
  loading: false,
  workflowViewMode: 'list',
  
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
