<template>
  <div class="p-8 space-y-6 w-full animate-in fade-in duration-300">
    <!-- Selected Table Matrix Card (unified: toolbar + matrix in one card) -->
    <div v-if="!loading && currentTable" class="bg-surface rounded-2xl shadow-[0px_4px_24px_rgba(25,28,29,0.04)] border border-outline-variant/30 overflow-hidden animate-in fade-in duration-200">
      <!-- Compact Toolbar Row -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-outline-variant/30 bg-surface z-10 shrink-0">
        <div class="flex-1"></div>

        <div class="flex items-center gap-3">
          <div v-if="tables.length > 0" class="flex items-center gap-1.5">
            <span class="text-xs text-on-surface-variant font-medium">物理表：</span>
            <select 
              v-model="selectedTableId"
              class="text-xs rounded border border-outline-variant/30 bg-surface-container-lowest focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1 pl-2.5 pr-8 outline-none cursor-pointer"
            >
              <option v-for="t in tables" :key="t.tableMetaId" :value="t.tableMetaId">
                {{ t.tableName }}
              </option>
            </select>
          </div>
          
          <div class="w-px h-4 bg-outline-variant/30 mx-1"></div>
          <button 
            @click="toggleAll(true)"
            :disabled="appState.currentUserRole === 'admin' || !selectedTableId"
            class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck class="w-3.5 h-3.5" />
            全选
          </button>
          <button 
            @click="toggleAll(false)"
            :disabled="appState.currentUserRole === 'admin' || !selectedTableId"
            class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eraser class="w-3.5 h-3.5" />
            清空
          </button>
          <div class="w-px h-4 bg-outline-variant/30 mx-1"></div>
          <button 
            @click="handleSave"
            :disabled="appState.currentUserRole === 'admin'"
            class="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check class="w-3.5 h-3.5" />
            保存
          </button>
        </div>
      </div>


      <!-- Columns Matrix Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-lowest text-xs font-extrabold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30">
              <th class="px-4 py-4 border-r border-outline-variant/30 text-center w-16">序号</th>
              <th class="px-6 py-4 border-r border-outline-variant/30">物理字段</th>
              <th class="px-6 py-4 border-r border-outline-variant/30">字段别名</th>
              <th class="px-6 py-4 text-center w-40 border-r border-outline-variant/30 whitespace-nowrap">READ (读取/4)</th>
              <th class="px-6 py-4 text-center w-40 border-r border-outline-variant/30 whitespace-nowrap">CREATE (新建/2)</th>
              <th class="px-6 py-4 text-center w-40 border-r border-outline-variant/30 whitespace-nowrap">UPDATE (修改/1)</th>
              <th class="px-6 py-4 text-center w-32 whitespace-nowrap">当前掩码值</th>
            </tr>
          </thead>
          <tbody class="text-sm text-on-surface">
            <tr 
              v-for="(f, index) in currentTable.fields" 
              :key="f.fieldMetaId" 
              class="border-b border-outline-variant/30 last:border-b-0 hover:bg-surface-container-lowest transition-colors group"
            >
              <!-- 序号 -->
              <td class="px-4 py-4 border-r border-outline-variant/30 text-center font-mono text-xs text-on-surface-variant">
                {{ index + 1 }}
              </td>

              <!-- 物理字段 -->
              <td class="px-6 py-4 border-r border-outline-variant/30 font-mono text-xs font-semibold text-on-surface">
                {{ f.columnName }}
              </td>

              <!-- 字段别名 -->
              <td class="px-6 py-4 border-r border-outline-variant/30 text-on-surface-variant">
                {{ f.label }}
              </td>

              <!-- READ checkbox -->
              <td class="px-6 py-4 text-center border-r border-outline-variant/30">
                <input 
                  type="checkbox"
                  :checked="appState.currentUserRole === 'admin' || (f.perm & 4) !== 0"
                  :disabled="appState.currentUserRole === 'admin'"
                  @change="togglePerm(f, 4, $event.target.checked)"
                  class="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                />
              </td>

              <!-- CREATE checkbox -->
              <td class="px-6 py-4 text-center border-r border-outline-variant/30">
                <input 
                  type="checkbox"
                  :checked="appState.currentUserRole === 'admin' || (f.perm & 2) !== 0"
                  :disabled="appState.currentUserRole === 'admin'"
                  @change="togglePerm(f, 2, $event.target.checked)"
                  class="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                />
              </td>

              <!-- UPDATE checkbox -->
              <td class="px-6 py-4 text-center border-r border-outline-variant/30">
                <input 
                  type="checkbox"
                  :checked="appState.currentUserRole === 'admin' || (f.perm & 1) !== 0"
                  :disabled="appState.currentUserRole === 'admin'"
                  @change="togglePerm(f, 1, $event.target.checked)"
                  class="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                />
              </td>

              <!-- Mask Value Display -->
              <td class="px-6 py-4 text-center">
                <span class="font-mono text-xs font-bold bg-surface-container px-2.5 py-0.5 rounded border border-outline-variant/30" :class="f.perm > 0 ? 'text-primary' : 'text-on-surface-variant/50'">
                  {{ appState.currentUserRole === 'admin' ? 7 : f.perm }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { CheckCheck, Eraser, Check, RotateCw, Database, ChevronDown } from 'lucide-vue-next';
import { permissionsApi } from '../../api/permissions';
import { appState } from '../../store/app';

const loading = ref(false);
const tables = ref([]);
const selectedTableId = ref(null);

const roles = [
  { code: 'admin', name: '管理员 (Admin)' },
  { code: 'editor', name: '编辑员 (Editor)' },
  { code: 'viewer', name: '查看员 (Viewer)' }
];

const activeRoleName = computed(() => {
  return roles.find(r => r.code === appState.currentUserRole)?.name || appState.currentUserRole;
});

const currentTable = computed(() => {
  return tables.value.find(t => t.tableMetaId === selectedTableId.value) || tables.value[0] || null;
});

const loadPermissions = async () => {
  loading.value = true;
  try {
    const res = await permissionsApi.getGlobalPermissions(appState.currentUserRole);
    if (res && Array.isArray(res)) {
      tables.value = res;
      if (res.length > 0 && (!selectedTableId.value || !res.some(t => t.tableMetaId === selectedTableId.value))) {
        selectedTableId.value = res[0].tableMetaId;
      }
    } else if (res && res.data) {
      tables.value = res.data;
      if (res.data.length > 0 && (!selectedTableId.value || !res.data.some(t => t.tableMetaId === selectedTableId.value))) {
        selectedTableId.value = res.data[0].tableMetaId;
      }
    }
  } catch (e) {
    console.error('加载全局权限配置失败:', e);
  } finally {
    loading.value = false;
  }
};

const togglePerm = (field, bitValue, checked) => {
  if (checked) {
    field.perm |= bitValue;
  } else {
    field.perm &= ~bitValue;
  }
};

const toggleAll = (active) => {
  if (currentTable.value) {
    currentTable.value.fields.forEach(f => {
      f.perm = active ? 7 : 0;
    });
  }
};

const handleSave = async () => {
  if (appState.currentUserRole === 'admin') return;
  try {
    const res = await permissionsApi.updateGlobalPermissions(appState.currentUserRole, tables.value);
    if (res === true || (res && (res.code === 200 || res.data === true))) {
      alert('权限配置保存成功！');
      loadPermissions();
    } else {
      alert('保存失败，请检查网络');
    }
  } catch (e) {
    console.error('保存失败:', e);
    alert('保存失败，服务端连接异常');
  }
};

watch(() => appState.currentUserRole, () => {
  loadPermissions();
});

onMounted(() => {
  loadPermissions();
});
</script>

<style scoped>
</style>
