import { defineStore } from 'pinia';
import api from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null as any,
  }),
  actions: {
    async login(loginForm: any) {
      const res: any = await api.post('/auth/login', loginForm);
      if (res.code === 0) {
        this.token = res.data.access_token;
        localStorage.setItem('token', this.token);
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
    }
  }
});