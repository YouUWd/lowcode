<template>
  <div class="bg-surface rounded-2xl p-8 shadow-[0px_4px_24px_rgba(25,28,29,0.04)] border border-outline-variant/30 max-w-4xl mx-auto">
    <!-- Form Header -->
    <div class="border-b border-outline-variant/35 pb-5 mb-6 flex items-center justify-between">
      <h3 class="text-lg font-bold text-on-surface flex items-center gap-2 font-headline">
        <FileText class="text-primary w-5 h-5" />
        <span>{{ isEditMode ? '编辑' : '新建' }}{{ metaData.name || '数据' }}</span>
      </h3>
      <button @click="$emit('cancel')" class="px-4 py-1.5 border border-outline-variant text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
        取消
      </button>
    </div>

    <!-- Form Body -->
    <div v-if="loadingMeta" class="py-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
      <RotateCw class="w-6 h-6 text-primary animate-spin" />
      <span class="text-xs">加载元数据结构中...</span>
    </div>
    
    <form v-else @submit.prevent="handleSubmit" class="space-y-8">
      <!-- 1. Main Table Fields Group -->
      <div class="space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-primary border-l-2 border-primary pl-2">
          主表信息 ({{ metaData.mainTable?.tableName }})
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div v-for="field in mainTableFields" :key="field.columnName" class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-sm font-semibold text-on-surface-variant flex items-center gap-1">
                <span>{{ field.label }}</span>
                <span v-if="isFieldRequired(field.columnName)" class="text-error font-bold">*</span>
              </label>
              <span v-if="!isFieldWritable(metaData.mainTable.tableName, field.columnName)" class="text-[10px] text-outline bg-surface-container-high px-1.5 py-0.5 rounded">只读</span>
            </div>
            
            <!-- String Input -->
            <input 
              v-if="field.dataType === 'STRING' && field.columnName !== 'remark'"
              v-model="formData[metaData.mainTable?.tableName][field.columnName]"
              type="text"
              class="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50 disabled:bg-surface-container-high"
              :disabled="!isFieldWritable(metaData.mainTable.tableName, field.columnName)"
              :placeholder="`请输入${field.label}`"
            />
            
            <!-- Textarea for remark / description -->
            <textarea
              v-else-if="field.columnName === 'remark'"
              v-model="formData[metaData.mainTable?.tableName][field.columnName]"
              rows="3"
              class="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50 disabled:bg-surface-container-high resize-none"
              :disabled="!isFieldWritable(metaData.mainTable.tableName, field.columnName)"
              :placeholder="`请输入${field.label}...`"
            ></textarea>

            <!-- Number/Decimal Input -->
            <input 
              v-else-if="field.dataType === 'NUMBER' || field.dataType === 'DECIMAL'"
              v-model.number="formData[metaData.mainTable?.tableName][field.columnName]"
              type="number"
              step="any"
              class="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50 disabled:bg-surface-container-high font-mono"
              :disabled="!isFieldWritable(metaData.mainTable.tableName, field.columnName)"
              :placeholder="`请输入${field.label}`"
            />

            <!-- Datetime Input -->
            <input 
              v-else-if="field.dataType === 'DATETIME'"
              v-model="formData[metaData.mainTable?.tableName][field.columnName]"
              type="datetime-local"
              class="w-full px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow disabled:opacity-50 disabled:bg-surface-container-high font-mono"
              :disabled="!isFieldWritable(metaData.mainTable.tableName, field.columnName)"
            />
          </div>
        </div>
      </div>

      <!-- 2. JOIN Tables Group (Readonly columns reference) -->
      <div v-if="metaData.joinTables?.length > 0" class="space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-secondary border-l-2 border-secondary pl-2">
          关联参考信息 (1:1 / N:1)
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <!-- We show the fields of JOIN table, bound with joint key. Since it's N:1, they are reference columns -->
          <!-- In typical dynamic save, reference JOIN fields are readonly in this form because we only save references -->
          <div v-for="t in metaData.joinTables" :key="t.tableName" class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="field in t.fields" :key="field.columnName" class="space-y-1">
              <label class="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                <Link class="w-3.5 h-3.5 text-secondary" />
                <span>{{ t.tableName }} - {{ field.label }}</span>
              </label>
              <div class="px-3.5 py-2 bg-surface-container-high/60 border border-outline-variant/30 rounded-xl text-sm text-outline select-none font-mono">
                {{ formData[t.tableName]?.[field.columnName] || '关联生成，提交后更新' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. SUB Tables Group (1:N One-to-Many cascade items) -->
      <div v-for="sub in metaData.subTables" :key="sub.tableName" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-primary border-l-2 border-primary pl-2">
            {{ sub.tableName }} 明细列表 (1:N 一对多子表)
          </h4>
          <button 
            type="button" 
            @click="addSubRow(sub.tableName)" 
            class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/15 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>添加明细行</span>
          </button>
        </div>
        
        <div class="border border-outline-variant/35 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low text-xs font-bold text-on-surface-variant border-b border-outline-variant/35">
                <th v-for="field in getSubFields(sub)" :key="field.columnName" class="px-4 py-3 font-semibold">{{ field.label }}</th>
                <th class="px-4 py-3 text-center w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/20 text-sm">
              <tr v-if="!formData[sub.tableName] || formData[sub.tableName].length === 0">
                <td :colspan="getSubFields(sub).length + 1" class="px-4 py-8 text-center text-outline text-xs">
                  暂无明细数据，点击右上角“添加明细行”录入
                </td>
              </tr>
              <tr v-else v-for="(row, idx) in formData[sub.tableName]" :key="row.id || idx" class="hover:bg-surface-container-lowest/30">
                <td v-for="field in getSubFields(sub)" :key="field.columnName" class="px-4 py-2">
                  <input 
                    v-if="field.dataType === 'NUMBER' || field.dataType === 'DECIMAL'"
                    v-model.number="row[field.columnName]"
                    type="number"
                    step="any"
                    class="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant/50 rounded text-xs focus:outline-none focus:border-primary font-mono"
                    :disabled="!isFieldWritable(sub.tableName, field.columnName, row.id)"
                  />
                  <input 
                    v-else
                    v-model="row[field.columnName]"
                    type="text"
                    class="w-full px-2 py-1 bg-surface-container-lowest border border-outline-variant/50 rounded text-xs focus:outline-none focus:border-primary"
                    :disabled="!isFieldWritable(sub.tableName, field.columnName, row.id)"
                  />
                </td>
                <td class="px-4 py-2 text-center">
                  <button type="button" @click="removeSubRow(sub.tableName, idx)" class="text-error hover:text-error/80 p-1 rounded hover:bg-error/5 transition-colors cursor-pointer">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. N:M RELATION Group (Tags or Junction table relations) -->
      <div v-for="rel in metaData.relations" :key="rel.rightTable" class="space-y-4">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-primary border-l-2 border-primary pl-2">
          {{ rel.name }} 标签关联 (N:M 多对多)
        </h4>
        <div class="flex flex-wrap gap-3 p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
          <div v-if="loadingRelationOptions[rel.rightTable]" class="text-xs text-outline flex items-center gap-1.5 py-1">
            <RotateCw class="w-3.5 h-3.5 animate-spin" /> Loading tags...
          </div>
          <template v-else>
            <label 
              v-for="opt in relationOptions[rel.rightTable]" 
              :key="opt.id"
              class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none"
              :class="isRelationChecked(rel.rightTable, opt.id) 
                ? 'bg-primary/10 border-primary text-primary font-medium' 
                : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface hover:border-outline'"
            >
              <input 
                type="checkbox"
                class="hidden"
                :checked="isRelationChecked(rel.rightTable, opt.id)"
                @change="toggleRelation(rel.rightTable, opt)"
              />
              <span>{{ opt.name }}</span>
            </label>
          </template>
        </div>
      </div>

      <!-- Save Actions -->
      <div class="border-t border-outline-variant/35 pt-6 flex justify-end gap-3">
        <button 
          type="button" 
          @click="$emit('cancel')" 
          class="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
        >
          取消
        </button>
        <button 
          type="submit" 
          :disabled="submitting"
          class="px-8 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl hover:bg-primary/95 shadow-md active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save class="w-4 h-4" />
          <span>{{ isEditMode ? '验证并保存' : '确认创建' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { FileText, RotateCw, Plus, Trash2, Save, Link } from 'lucide-vue-next';
import { dataEngineApi } from '../../api/dataEngine';

const props = defineProps({
  moduleId: {
    type: String,
    required: true
  },
  recordId: {
    type: [Number, String],
    default: null
  },
  activeRole: {
    type: String,
    default: 'viewer'
  }
});

const emit = defineEmits(['save-success', 'cancel']);

const isEditMode = computed(() => props.recordId !== null && props.recordId !== undefined);

const loadingMeta = ref(false);
const submitting = ref(false);

const metaData = ref({ mainTable: null, subTables: [], joinTables: [], relations: [] });
const rolePermissions = ref([]); // Table fields bitmasks configured for this role

const formData = ref({});
const relationOptions = reactive({}); // Available options for N:M relations
const loadingRelationOptions = reactive({});

const mainTableFields = computed(() => {
  if (!metaData.value.mainTable) return [];
  // Exclude 'id', 'created_at', 'updated_at' from manual inputs
  return metaData.value.mainTable.fields.filter(f => 
    f.columnName !== 'id' && 
    f.columnName !== 'created_at' && 
    f.columnName !== 'updated_at'
  );
});

// Helper to filter subTable columns, excluding PK and FK
const getSubFields = (subTable) => {
  return subTable.fields.filter(f => 
    f.columnName !== 'id' && 
    f.columnName !== subTable.foreignKey &&
    f.columnName !== 'created_at' &&
    f.columnName !== 'updated_at'
  );
};

// Check if a field is required (simple heuristic, could be extended via table_meta)
const isFieldRequired = (fieldName) => {
  return fieldName === 'order_no' || fieldName === 'name';
};

// Defensive UX permission validator (Unix-style mask validation)
const isFieldWritable = (tableName, columnName, itemId = null) => {
  if (props.activeRole === 'admin') return true;
  
  // Find permission record in loaded rolePermissions
  const tablePerm = rolePermissions.value.find(t => t.tableName === tableName);
  if (!tablePerm) return false;
  
  const fieldPerm = tablePerm.fields.find(f => f.columnName === columnName);
  if (!fieldPerm) return false;

  const isRowUpdate = isEditMode.value || (itemId !== null && itemId !== undefined);
  const mask = isRowUpdate ? 1 : 2; // Bit 1 for update, Bit 2 for insert
  
  return (fieldPerm.perm & mask) !== 0;
};

const loadMetadataAndPermissions = async () => {
  loadingMeta.value = true;
  try {
    // 1. Load lowcode metadata
    const metaRes = await dataEngineApi.getModuleMeta(props.moduleId);
    if (metaRes) {
      metaData.value = metaRes;
    }

    // 2. Load role bitmask permissions from admin configurations endpoint
    const permRes = await clientGetPermissions(props.moduleId, props.activeRole);
    if (permRes) {
      rolePermissions.value = permRes;
    }

    // Initialize formData schema
    const initialForm = {};
    if (metaData.value.mainTable) {
      const mainObj = {};
      metaData.value.mainTable.fields.forEach(f => {
        mainObj[f.columnName] = f.dataType === 'NUMBER' || f.dataType === 'DECIMAL' ? null : '';
      });
      initialForm[metaData.value.mainTable.tableName] = mainObj;
    }

    // Initialize JOIN fields keys
    metaData.value.joinTables.forEach(t => {
      const joinObj = {};
      t.fields.forEach(f => {
        joinObj[f.columnName] = '';
      });
      initialForm[t.tableName] = joinObj;
    });

    // Initialize SUB Tables arrays
    metaData.value.subTables.forEach(s => {
      initialForm[s.tableName] = [];
    });

    // Initialize N:M RELATION arrays (like tags)
    metaData.value.relations.forEach(r => {
      initialForm[r.rightTable] = [];
      // Trigger lazy loading of available tag entities options
      loadRelationOptions(r.rightTable);
    });

    formData.value = initialForm;

    // 3. Load actual record details if in edit mode
    if (isEditMode.value) {
      await loadRecordDetails();
    }
  } catch (err) {
    console.error('加载表单初始化数据失败:', err);
  } finally {
    loadingMeta.value = false;
  }
};

// Helper function to call the backend permissions config endpoint
const clientGetPermissions = async (moduleId, roleCode) => {
  try {
    const res = await clientGet(`/admin/permission/${moduleId}/${roleCode}`);
    return res;
  } catch (e) {
    console.warn('获取角色权限配置失败，降级为默认无配置', e);
    return [];
  }
};

const clientGet = async (url) => {
  // Directly use frontend Axios client if accessible
  const client = (await import('../../api/client')).default;
  return client.get(url);
};

// Load details of the single record
const loadRecordDetails = async () => {
  try {
    const payload = {
      id: props.recordId,
      with: []
    };
    
    // Request child tables to be nested in response DTO
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
      // Merge values into formData
      Object.keys(res).forEach(key => {
        formData.value[key] = res[key];
      });
    }
  } catch (err) {
    console.error('加载记录详情失败:', err);
  }
};

// Lazy load master list of N:M options (e.g. tag options list)
const loadRelationOptions = async (tableName) => {
  loadingRelationOptions[tableName] = true;
  try {
    // If target table matches tags, load it from tags module/endpoint
    // For this generic component, we query tags table using default viewer query
    const res = await dataEngineApi.query(tableName === 'tags' ? 'order' : tableName, {
      page: 1,
      size: 50,
      filters: []
    }, 'viewer');
    
    if (res && res.rows) {
      // Un-prefix columns for the selection list: e.g. tags_name -> name
      relationOptions[tableName] = res.rows.map(row => {
        const cleaned = {};
        Object.keys(row).forEach(k => {
          const field = k.replace(`${tableName}_`, '');
          cleaned[field] = row[k];
        });
        return cleaned;
      });
    }
  } catch (err) {
    console.warn(`加载关系选项失败 [${tableName}]:`, err);
    relationOptions[tableName] = [];
  } finally {
    loadingRelationOptions[tableName] = false;
  }
};

// SubTables rows operations
const addSubRow = (tableName) => {
  if (!formData.value[tableName]) {
    formData.value[tableName] = [];
  }
  const sub = metaData.value.subTables.find(s => s.tableName === tableName);
  const newRow = {};
  sub.fields.forEach(f => {
    newRow[f.columnName] = f.dataType === 'NUMBER' || f.dataType === 'DECIMAL' ? null : '';
  });
  formData.value[tableName].push(newRow);
};

const removeSubRow = (tableName, index) => {
  formData.value[tableName].splice(index, 1);
};

// N:M Checkbox binding helpers
const isRelationChecked = (tableName, targetId) => {
  const list = formData.value[tableName] || [];
  return list.some(item => item.id === targetId);
};

const toggleRelation = (tableName, option) => {
  if (!formData.value[tableName]) {
    formData.value[tableName] = [];
  }
  const list = formData.value[tableName];
  const idx = list.findIndex(item => item.id === option.id);
  if (idx !== -1) {
    list.splice(idx, 1);
  } else {
    list.push(option);
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    // Cascade Save
    const res = await dataEngineApi.save(props.moduleId, formData.value, props.activeRole);
    if (res) {
      alert('保存成功');
      emit('save-success', res);
    }
  } catch (err) {
    // Show validation error returned by backend
    alert(err.response?.data?.message || '保存失败，请检查填写内容。');
  } finally {
    submitting.value = false;
  }
};

watch(() => props.moduleId, () => {
  loadMetadataAndPermissions();
});

watch(() => props.recordId, () => {
  loadMetadataAndPermissions();
});

watch(() => props.activeRole, () => {
  loadMetadataAndPermissions();
});

onMounted(() => {
  loadMetadataAndPermissions();
});
</script>
