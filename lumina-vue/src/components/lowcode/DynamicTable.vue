<template>
  <div class="w-full">
    <!-- Single Unified Card -->
    <div class="bg-surface rounded-2xl shadow-[0px_4px_24px_rgba(25,28,29,0.04)] border border-outline-variant/30 overflow-hidden">

      <!-- Compact Toolbar Row -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-outline-variant/30 bg-surface z-10 shrink-0">
        <!-- Filters (inline) -->
        <div v-if="filterableFields.length > 0" class="flex items-center gap-2 flex-1 min-w-0">
          <div v-for="field in filterableFields" :key="field.columnName" class="relative">
            <input 
              v-model="filtersState[field.columnName]" 
              type="text" 
              class="pl-2.5 pr-7 py-1 bg-surface-container-lowest border border-outline-variant/30 rounded text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow w-32" 
              :placeholder="field.label"
              @keyup.enter="handleSearch"
            />
            <button v-if="filtersState[field.columnName]" @click="clearFilter(field.columnName)" class="absolute right-1.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5">
              <X class="w-3 h-3" />
            </button>
          </div>
          <button @click="handleSearch" class="px-2.5 py-1 bg-secondary text-on-secondary text-xs font-semibold rounded hover:bg-secondary/90 transition-colors flex items-center gap-1 cursor-pointer">
            <Search class="w-3 h-3" />
            筛选
          </button>
          <button @click="resetFilters" class="px-2.5 py-1 text-on-surface-variant text-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
            清空
          </button>
        </div>
        <div v-else class="flex-1"></div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
          <!-- Module Switcher -->
          <div class="flex items-center gap-2" v-if="modulesList.length > 0">
            <span class="text-xs text-on-surface-variant font-medium">模块：</span>
            <select 
              :value="moduleId"
              @change="$emit('update:moduleId', $event.target.value)"
              class="text-xs rounded border border-outline-variant/30 bg-surface-container-lowest focus:ring-1 focus:border-primary focus:ring-primary transition-shadow py-1 pl-2.5 pr-8 outline-none cursor-pointer min-w-[120px]"
            >
              <option v-for="mod in modulesList" :key="mod.id" :value="mod.id">
                {{ mod.name }}
              </option>
            </select>
          </div>
          <span v-else class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{{ moduleId }}</span>

          <div class="w-px h-4 bg-outline-variant/30 mx-1"></div>

          <button @click="$emit('create')" class="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus class="w-3.5 h-3.5" />
            新建
          </button>
        </div>
      </div>

      <!-- Data Table (directly inside same card) -->
      <div class="overflow-x-auto w-full">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="bg-surface-container-low text-xs font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/35">
              <th v-for="col in columns" :key="col.key" class="px-6 py-4 font-semibold border-r border-outline-variant/10">
                <div class="flex items-center gap-1.5 cursor-pointer select-none" @click="handleSort(col.key)">
                  <span>{{ col.label }}</span>
                  <div class="flex flex-col text-[8px] text-outline">
                    <ChevronUp class="w-2.5 h-2.5 -mb-1" :class="{ 'text-primary font-bold': sortState.field === col.key && sortState.dir === 'ASC' }" />
                    <ChevronDown class="w-2.5 h-2.5" :class="{ 'text-primary font-bold': sortState.field === col.key && sortState.dir === 'DESC' }" />
                  </div>
                </div>
              </th>
              <!-- Extended Relations Columns Header -->
              <th v-for="sub in metaData.subTables" :key="sub.tableName" class="px-6 py-4 font-semibold border-r border-outline-variant/10">
                {{ sub.tableName }} (明细)
              </th>
              <th v-for="rel in metaData.relations" :key="rel.rightTable" class="px-6 py-4 font-semibold border-r border-outline-variant/10">
                {{ rel.name }} (关联)
              </th>
              <th class="px-6 py-4 text-center w-[150px] min-w-[150px]">操作</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-outline-variant/20">
            <tr v-if="loading" class="hover:bg-transparent">
              <td :colspan="columns.length + (metaData.subTables?.length || 0) + (metaData.relations?.length || 0) + 1" class="px-6 py-12 text-center text-on-surface-variant">
                <div class="flex flex-col items-center justify-center gap-3">
                  <RotateCw class="w-6 h-6 text-primary animate-spin" />
                  <span class="text-xs">正在努力拉取业务数据中...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="tableRows.length === 0" class="hover:bg-transparent">
              <td :colspan="columns.length + (metaData.subTables?.length || 0) + (metaData.relations?.length || 0) + 1" class="px-6 py-16 text-center text-on-surface-variant">
                <div class="flex flex-col items-center justify-center gap-2">
                  <Inbox class="w-8 h-8 text-outline" />
                  <span class="text-xs">暂无符合条件的数据</span>
                </div>
              </td>
            </tr>
            <tr v-else v-for="(row, idx) in tableRows" :key="row[metaData.mainTable?.tableName]?.id || idx" class="hover:bg-surface-container-lowest/50 transition-colors group">
              <!-- Render Fields dynamically based on Nested Entity -->
              <td v-for="col in columns" :key="col.key" class="px-6 py-3.5 border-r border-outline-variant/5">
                <span v-if="row[col.tableName]?.[col.fieldName] === '***'" class="px-2 py-0.5 bg-error/10 text-error text-xs rounded font-mono" title="列权限受限，数据已掩盖">
                  受限脱敏
                </span>
                <span v-else-if="col.fieldName === 'created_at' || col.fieldName === 'updated_at'" class="text-xs text-on-surface-variant font-mono">
                  {{ formatDate(row[col.tableName]?.[col.fieldName]) }}
                </span>
                <span v-else-if="typeof row[col.tableName]?.[col.fieldName] === 'number' && col.fieldName === 'amount'" class="font-semibold text-primary font-mono">
                  ￥{{ row[col.tableName]?.[col.fieldName].toFixed(2) }}
                </span>
                <span v-else class="text-on-surface">
                  {{ row[col.tableName]?.[col.fieldName] !== null && row[col.tableName]?.[col.fieldName] !== undefined ? row[col.tableName][col.fieldName] : '-' }}
                </span>
              </td>
              
              <!-- Render SUB table items -->
              <td v-for="sub in metaData.subTables" :key="sub.tableName" class="px-6 py-3.5 border-r border-outline-variant/5">
                <div class="flex flex-col gap-1 max-h-[100px] overflow-y-auto pr-1">
                  <div v-for="item in row[sub.tableName]" :key="item.id" class="text-xs bg-surface-container-high px-2 py-1 rounded border border-outline-variant/30 flex items-center justify-between gap-2">
                    <span class="font-medium text-on-surface truncate">{{ item.product_name || item.name || '明细项' }}</span>
                    <span v-if="item.qty !== undefined" class="text-[10px] text-on-surface-variant font-mono bg-surface-container-highest px-1 rounded">x{{ item.qty }}</span>
                  </div>
                  <span v-if="!row[sub.tableName] || row[sub.tableName].length === 0" class="text-xs text-outline">-</span>
                </div>
              </td>

              <!-- Render N:M RELATION items -->
              <td v-for="rel in metaData.relations" :key="rel.rightTable" class="px-6 py-3.5 border-r border-outline-variant/5">
                <div class="flex flex-wrap gap-1.5 max-w-[200px]">
                  <span v-for="tag in row[rel.rightTable]" :key="tag.id" class="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-semibold rounded border border-primary/10">
                    {{ tag.name }}
                  </span>
                  <span v-if="!row[rel.rightTable] || row[rel.rightTable].length === 0" class="text-xs text-outline">-</span>
                </div>
              </td>

              <!-- Action buttons -->
              <td class="px-6 py-3.5 text-center">
                <div class="flex justify-center items-center gap-3">
                  <button @click="$emit('edit', row[metaData.mainTable.tableName]?.id)" class="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer flex items-center gap-1 text-xs">
                    <Edit class="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <div class="w-px h-3 bg-outline-variant/50"></div>
                  <button @click="handleDelete(row[metaData.mainTable.tableName]?.id)" class="text-error hover:text-error/80 font-medium transition-colors cursor-pointer flex items-center gap-1 text-xs">
                    <Trash2 class="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-6 py-4 bg-surface flex items-center justify-between border-t border-outline-variant/35">
        <div class="text-xs text-on-surface-variant font-medium">
          显示第 {{ (pageState.page - 1) * pageState.size + 1 }} 到 {{ Math.min(pageState.page * pageState.size, totalState) }} 条，共 {{ totalState }} 条记录
        </div>
        <div class="flex items-center gap-1.5">
          <button 
            @click="changePage(pageState.page - 1)" 
            :disabled="pageState.page <= 1"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface-variant transition-all cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button 
            v-for="p in totalPages" 
            :key="p"
            @click="changePage(p)"
            class="w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all cursor-pointer"
            :class="pageState.page === p ? 'border-primary bg-primary text-on-primary shadow-sm' : 'border-outline-variant/60 text-on-surface hover:border-primary hover:bg-primary/5'"
          >
            {{ p }}
          </button>
          <button 
            @click="changePage(pageState.page + 1)" 
            :disabled="pageState.page >= totalPages"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-outline-variant/60 disabled:hover:text-on-surface-variant transition-all cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { 
  Database, RotateCw, Plus, Search, RefreshCw, X, ChevronUp, ChevronDown, 
  Trash2, Edit, ChevronLeft, ChevronRight, Inbox
} from 'lucide-vue-next';
import { dataEngineApi } from '../../api/dataEngine';

const props = defineProps({
  moduleId: {
    type: String,
    required: true
  },
  activeRole: {
    type: String,
    default: 'viewer'
  },
  modulesList: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['create', 'edit', 'delete-success', 'update:moduleId']);

const loading = ref(false);
const metaData = ref({ mainTable: null, subTables: [], joinTables: [], relations: [] });
const tableRows = ref([]);
const totalState = ref(0);

const pageState = reactive({
  page: 1,
  size: 10
});

const sortState = reactive({
  field: '',
  dir: 'DESC'
});

const filtersState = ref({});

// Field mappings dynamically compiled from getModuleMeta
const columns = computed(() => {
  if (!metaData.value.mainTable) return [];
  const list = [];
  
  // Add main table columns
  metaData.value.mainTable.fields.forEach(f => {
    list.push({
      key: `${metaData.value.mainTable.tableName}_${f.columnName}`,
      label: f.label || f.columnName,
      tableName: metaData.value.mainTable.tableName,
      fieldName: f.columnName
    });
  });

  // Add join table columns
  metaData.value.joinTables.forEach(t => {
    t.fields.forEach(f => {
      list.push({
        key: `${t.tableName}_${f.columnName}`,
        label: f.label || f.columnName,
        tableName: t.tableName,
        fieldName: f.columnName
      });
    });
  });

  return list;
});

// Searchable columns
const filterableFields = computed(() => {
  if (!metaData.value.mainTable) return [];
  // Return fields that are typical for filtering (excluding IDs, dates, amount in default simple layout)
  return metaData.value.mainTable.fields.filter(f => 
    f.columnName !== 'id' && 
    f.columnName !== 'created_at' && 
    f.columnName !== 'updated_at' && 
    f.dataType === 'STRING'
  );
});

const totalPages = computed(() => {
  return Math.ceil(totalState.value / pageState.size) || 1;
});

const loadMetadata = async () => {
  try {
    const res = await dataEngineApi.getModuleMeta(props.moduleId);
    if (res) {
      metaData.value = res;
      // Initialize filtersState
      const searchState = {};
      filterableFields.value.forEach(f => {
        searchState[f.columnName] = '';
      });
      filtersState.value = searchState;
    }
  } catch (err) {
    console.error('加载元数据失败:', err);
  }
};

const loadData = async () => {
  if (!metaData.value.mainTable) return;
  loading.value = true;
  try {
    const filters = [];
    Object.keys(filtersState.value).forEach(key => {
      const val = filtersState.value[key];
      if (val) {
        filters.push({
          tableName: metaData.value.mainTable.tableName,
          field: key,
          op: 'like',
          value: val
        });
      }
    });

    const sorts = [];
    if (sortState.field) {
      sorts.push({
        field: sortState.field,
        dir: sortState.dir
      });
    }

    const payload = {
      page: pageState.page,
      size: pageState.size,
      filters,
      sorts,
      with: []
    };

    // Auto-include all child tables in with
    metaData.value.subTables.forEach(s => {
      payload.with.push({ tableName: s.tableName });
    });
    metaData.value.relations.forEach(r => {
      payload.with.push({ tableName: r.rightTable });
    });
    metaData.value.joinTables.forEach(j => {
      payload.with.push({ tableName: j.tableName });
    });


    const res = await dataEngineApi.query(props.moduleId, payload, props.activeRole);
    if (res) {
      tableRows.value = res.rows || [];
      totalState.value = res.total || 0;
    }
  } catch (err) {
    console.error('加载业务数据失败:', err);
    tableRows.value = [];
    totalState.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageState.page = 1;
  loadData();
};

const clearFilter = (fieldName) => {
  filtersState.value[fieldName] = '';
  handleSearch();
};

const resetFilters = () => {
  Object.keys(filtersState.value).forEach(key => {
    filtersState.value[key] = '';
  });
  handleSearch();
};

const handleSort = (colKey) => {
  if (sortState.field === colKey) {
    sortState.dir = sortState.dir === 'ASC' ? 'DESC' : 'ASC';
  } else {
    sortState.field = colKey;
    sortState.dir = 'DESC';
  }
  pageState.page = 1;
  loadData();
};

const changePage = (p) => {
  if (p >= 1 && p <= totalPages.value) {
    pageState.page = p;
    loadData();
  }
};

const handleDelete = async (id) => {
  if (!id) return;
  if (!confirm('确定要级联物理删除此记录吗？关联的明细及关系将被同步删除，此操作不可恢复。')) return;
  
  try {
    setLoadingState(true);
    await dataEngineApi.delete(props.moduleId, id);
    alert('删除成功');
    emit('delete-success');
    loadData();
  } catch (err) {
    alert(err.response?.data?.message || '删除失败');
  } finally {
    setLoadingState(false);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
};

const setLoadingState = (state) => {
  // Simple loading handler if global store appState is accessible, else do nothing
  try {
    const { setLoading } = require('../../store/app');
    setLoading(state);
  } catch (e) {}
};

watch(() => props.moduleId, async () => {
  await loadMetadata();
  pageState.page = 1;
  loadData();
});

watch(() => props.activeRole, () => {
  loadData();
});

onMounted(async () => {
  await loadMetadata();
  loadData();
});
</script>
