<template>
  <div class="p-8 w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
    <!-- 统一工具栏 -->
    <div class="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden mb-6">
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h3 class="text-base font-bold text-on-surface">
            {{ moduleId === 'create' ? '新建系统模块' : isEditMode ? `配置模块关联表: ${moduleId}` : `模块结构视图: ${moduleId}` }}
          </h3>
        </div>
        <div class="flex items-center gap-1.5">
          <button @click="router.back()" class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all flex items-center gap-1 cursor-pointer">
            <ArrowLeft class="w-3.5 h-3.5" />
            返回
          </button>
          <button v-if="isEditMode" @click="handleSave" :disabled="saving" class="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded shadow-sm hover:bg-primary/95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <RotateCw class="w-3.5 h-3.5 animate-spin" v-if="saving" />
            <Save class="w-3.5 h-3.5" v-else />
            保存配置
          </button>
        </div>
      </div>
    </div>

    <!-- 新建模式下的极简模块信息输入 -->
    <div v-if="moduleId === 'create'" class="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden mb-6">
      <div class="p-6 grid grid-cols-2 gap-6">
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-on-surface-variant">模块名称 <span class="text-error">*</span></label>
          <input v-model="newModule.name" type="text" class="w-full px-3 py-2 bg-surface border border-outline-variant/30 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：员工档案管理" />
        </div>
        <div class="space-y-1.5">
          <label class="text-sm font-semibold text-on-surface-variant">模块标识 (ID) <span class="text-error">*</span></label>
          <input v-model="newModule.id" type="text" class="w-full px-3 py-2 bg-surface border border-outline-variant/30 rounded-md text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow" placeholder="例如：MOD-HR-EMP" />
        </div>
      </div>
    </div>

    <!-- 字段层级结构展示 -->
    <FieldMappingTable 
      :metaData="metaData" 
      :loading="loadingMeta" 
      :isEditMode="isEditMode" 
      @remove="handleRemoveTable" 
    />

    <!-- 底部添加表区域 (主表或关联表) -->
    <div v-if="isEditMode" class="mt-8">
      <Transition name="expand-fade" mode="out-in">
        <!-- 初始态：仅显示一个带有 + 号的点击区域 -->
        <div v-if="!isSelectingTable" key="idle" @click="isSelectingTable = true" class="relative h-24 border-2 border-dashed border-outline-variant/50 rounded-2xl flex items-center justify-center bg-surface-container-lowest cursor-pointer">
          <div class="relative flex items-center gap-3 text-on-surface-variant">
            <div class="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Plus class="w-5 h-5" />
            </div>
            <span class="text-sm font-bold text-on-surface">{{ metaData.mainTable ? '添加关联表' : '添加主表' }}</span>
          </div>
        </div>

        <!-- 展开态：显示选择框和按钮 -->
        <div v-else key="active" class="border-2 border-solid border-secondary/30 rounded-2xl p-8 flex flex-col items-center justify-center bg-surface-container-lowest shadow-sm">
          <h4 class="text-sm font-bold text-on-surface mb-5">选择要添加的{{ metaData.mainTable ? '关联表' : '主表' }}</h4>
          <div class="flex gap-3 items-center w-full max-w-lg">
            <div class="relative flex-1">
              <Database class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <select v-model="selectedJoinTable" class="w-full pl-10 pr-3 py-2 bg-surface border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow appearance-none disabled:bg-surface-container-lowest">
                <option disabled value="">请选择物理表...</option>
                <option v-for="table in availableJoinTables" :key="table.name" :value="table.name">
                  {{ table.name }} ({{ table.desc }})
                </option>
              </select>
            </div>
            <button @click="handleAddTable" :disabled="!selectedJoinTable || addingTable" class="px-3 py-1 bg-secondary text-on-secondary text-xs font-semibold rounded shadow-sm hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
              <RotateCw class="w-3.5 h-3.5 animate-spin" v-if="addingTable" />
              <Check class="w-3.5 h-3.5" v-else />
              确认
            </button>
            <button @click="isSelectingTable = false; selectedJoinTable = ''" class="px-2.5 py-1 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap">
              <X class="w-3.5 h-3.5" />
              取消
            </button>
          </div>
          <p class="text-xs text-outline mt-5 text-center max-w-md">
            {{ metaData.mainTable ? '选择物理表后，系统将自动校验其与当前树状结构中各表的外键关系，验证通过后方可接入。' : '首个添加的表将自动作为该模块的主表。' }}
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Save, RotateCw, Link as LinkIcon, Plus, Database, ChevronDown, Check, ArrowLeft, X } from 'lucide-vue-next';
import FieldMappingTable from './components/FieldMappingTable.vue';
import { modulesApi } from '../../api/modules';
import { dataEngineApi } from '../../api/dataEngine';
import { tableMap } from '../../store/metadata';

const router = useRouter();
const route = useRoute();

const isEditMode = computed(() => route.query.mode === 'edit' || route.query.mode === 'create');
const moduleId = computed(() => route.params.id);

const metaData = ref({ mainTable: null, subTables: [], joinTables: [], relations: [] });
const addedTables = ref([]); // 存放手动添加/解析出的其他关联表（不含主表）
const selectedJoinTable = ref('');
const saving = ref(false);
const addingTable = ref(false);
const loadingMeta = ref(false);
const isSelectingTable = ref(false);

const availableTables = computed(() => {
  return Object.keys(tableMap.value).map(key => ({
    name: key,
    desc: tableMap.value[key].desc
  }));
});

const newModule = ref({ id: '', name: '', entity: '', desc: '' });



// 可添加的表应该是全量表中剔除掉（主表 + 已经关联的表）
const availableJoinTables = computed(() => {
  const selected = new Set([metaData.value.mainTable?.tableName, ...addedTables.value]);
  return availableTables.value.filter(t => !selected.has(t.name));
});

const handleAddTable = async () => {
  if (!selectedJoinTable.value) return;
  addingTable.value = true;
  
  try {
    // 若当前没有任何主表，则将此表设为该模块的主表
    if (!metaData.value.mainTable) {
      newModule.value.entity = selectedJoinTable.value;
      metaData.value.mainTable = { tableName: selectedJoinTable.value, fields: [] };
      selectedJoinTable.value = '';
      isSelectingTable.value = false;
      return;
    }

    let relation = null;
    let sourceTable = '';
    
    // 检查这个新表与目前已经存在于树中的任意一张表是否有外键关系
    const existingTables = [metaData.value.mainTable?.tableName, ...addedTables.value].filter(Boolean);
    for (const existing of existingTables) {
      try {
        relation = await modulesApi.inferRelation(existing, selectedJoinTable.value);
        if (relation) {
          sourceTable = existing;
          break;
        }
      } catch(e) {
        // 如果此两张表没关系，后端会报 404，被这里 catch 住，继续尝试下一张
      }
    }

    if (!relation) {
      alert('无法添加：此表与当前已选的表之间不存在直接外键关系！查询无关系，提示删除。');
      return;
    }

    // 加入扁平的维护列表，用于最终提交
    addedTables.value.push(selectedJoinTable.value);

    // 简单构造本地预览
    if (relation.relationType === '1:N') {
      metaData.value.subTables.push({
        tableName: selectedJoinTable.value,
        foreignKey: relation.right,
        fields: []
      });
    } else {
      metaData.value.joinTables.push({
        tableName: selectedJoinTable.value,
        joinOn: `${sourceTable}.${relation.left} = ${selectedJoinTable.value}.${relation.right}`,
        fields: []
      });
    }

    selectedJoinTable.value = '';
    isSelectingTable.value = false; // 返回加号初始态
  } finally {
    addingTable.value = false;
  }
};

const handleRemoveTable = (tableName) => {
  addedTables.value = addedTables.value.filter(t => t !== tableName);
  metaData.value.subTables = metaData.value.subTables.filter(t => t.tableName !== tableName);
  metaData.value.joinTables = metaData.value.joinTables.filter(t => t.tableName !== tableName);
  metaData.value.relations = metaData.value.relations.filter(t => t.rightTable !== tableName && t.junctionTable !== tableName);
};

const handleSave = async () => {
  saving.value = true;
  try {
    if (moduleId.value === 'create') {
      if (!newModule.value.name || !newModule.value.id || !metaData.value.mainTable) {
        alert('请完整填写模块名称、模块标识，并添加至少一个主表！');
        saving.value = false;
        return;
      }
      newModule.value.entity = metaData.value.mainTable.tableName;
      await modulesApi.create({
        id: newModule.value.id,
        name: newModule.value.name,
        desc: newModule.value.desc,
        entity: newModule.value.entity
      });
      
      const allEntities = [...addedTables.value].filter(Boolean);
      if (allEntities.length > 0) {
        await modulesApi.syncEntities(newModule.value.id, allEntities);
      }
      alert('模块创建并保存成功！');
      router.replace(`/modules/${newModule.value.id}/config?mode=edit`);
      return;
    }

    const allEntities = [...addedTables.value].filter(Boolean);
    // 统一同步所有的表给后端（替代以前每删一个就发一次 API）
    await modulesApi.syncEntities(moduleId.value, allEntities);

    alert('保存成功！');
    await loadModuleMeta(); // 重新加载后端组装好的完美 ER 树
  } catch (e) {
    console.error('保存失败:', e);
    alert('保存失败: ' + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
};

const loadModuleMeta = async () => {
  if (moduleId.value === 'create') return;
  loadingMeta.value = true;
  try {
    const data = await dataEngineApi.getModuleMeta(moduleId.value);
    metaData.value = {
      mainTable: data.mainTable || null,
      subTables: data.subTables || [],
      joinTables: data.joinTables || [],
      relations: data.relations || []
    };
    
    const joins = metaData.value.joinTables.map(t => t.tableName);
    const subs = metaData.value.subTables.map(t => t.tableName);
    const rels = [];
    metaData.value.relations.forEach(r => {
      if (r.rightTable) rels.push(r.rightTable);
      if (r.junctionTable) rels.push(r.junctionTable);
    });
    
    const allRelated = [...new Set([...joins, ...subs, ...rels])].filter(t => t !== metaData.value.mainTable?.tableName);
    addedTables.value = allRelated;
  } catch (error) {
    console.error('加载元数据失败:', error);
  } finally {
    loadingMeta.value = false;
  }
};

watch(
  () => route.fullPath,
  () => {
    if (moduleId.value !== 'create') {
      loadModuleMeta();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.expand-fade-enter-active,
.expand-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.expand-fade-enter-from,
.expand-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
