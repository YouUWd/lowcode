import { reactive } from 'vue';

export const appState = reactive({
  currentView: 'list',
  loading: false
});

export const setView = (view) => {
  appState.currentView = view;
};

export const setLoading = (val) => {
  appState.loading = val;
};
