<template>
  <section class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
    <!-- Metadata loading state -->
    <div v-if="loading" class="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
      <RotateCw class="w-6 h-6 text-primary animate-spin" />
      <span class="text-xs">解析模块层次结构中...</span>
    </div>

    <!-- Hierarchical Structure Renderer -->
    <div v-else class="space-y-6 font-inter">
      <!-- 1. MAIN Table Section -->
      <div v-if="metaData.mainTable" class="bg-surface-container-low rounded-2xl border-l-4 border-l-primary border border-outline-variant/30 overflow-hidden shadow-sm">
        <div class="px-6 py-4 bg-surface-container/60 flex items-center justify-between border-b border-outline-variant/20">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database class="w-4 h-4 text-primary" />
            </div>
            <div>
              <div class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">主表 (MAIN ENTITY DTO)</div>
              <h4 class="text-sm font-extrabold text-on-surface mt-0.5">
                "{{ metaData.mainTable.tableName }}" : { ... }
              </h4>
            </div>
          </div>
          <span class="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono font-bold">主实体</span>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="f in metaData.mainTable.fields" :key="f.id" class="p-3 bg-surface rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
              <Type class="w-4 h-4 text-primary/70 shrink-0" />
              <div class="truncate">
                <div class="text-xs font-bold text-on-surface truncate">{{ f.label }}</div>
                <div class="text-[10px] text-outline font-mono mt-0.5 truncate">{{ f.columnName }} ({{ f.dataType }})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. JOIN Tables Section (1:1 / N:1 Nested Objects) -->
      <div v-if="metaData.joinTables?.length > 0" class="space-y-4">
        <h5 class="text-xs font-extrabold text-secondary uppercase tracking-widest flex items-center gap-1.5">
          <LinkIcon class="w-3.5 h-3.5" />
          <span>关联参考实体 (JOIN TABLES - 1:1/N:1 NESTED OBJECTS)</span>
        </h5>
        
        <div v-for="joinTable in metaData.joinTables" :key="joinTable.tableName" class="bg-surface-container-low rounded-2xl border-l-4 border-l-secondary border border-outline-variant/30 overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-surface-container/60 flex items-center justify-between border-b border-outline-variant/20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <LinkIcon class="w-4 h-4 text-secondary" />
              </div>
              <div>
                <div class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">关联对象 (NESTED OBJECT)</div>
                <h4 class="text-sm font-extrabold text-on-surface mt-0.5">
                  "{{ joinTable.tableName }}" : { ... }
                </h4>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[9px] bg-secondary/15 text-secondary px-2 py-0.5 rounded font-mono font-bold">JOIN ON: {{ joinTable.joinOn }}</span>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="f in joinTable.fields" :key="f.id" class="p-3 bg-surface rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
                <Type class="w-4 h-4 text-secondary/70 shrink-0" />
                <div class="truncate">
                  <div class="text-xs font-bold text-on-surface truncate">{{ f.label }}</div>
                  <div class="text-[10px] text-outline font-mono mt-0.5 truncate">{{ f.columnName }} ({{ f.dataType }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. SUB Tables Section (1:N Nested Arrays) -->
      <div v-if="metaData.subTables?.length > 0" class="space-y-4">
        <h5 class="text-xs font-extrabold text-tertiary uppercase tracking-widest flex items-center gap-1.5">
          <GitMerge class="w-3.5 h-3.5" />
          <span>级联子表明细 (SUB TABLES - 1:N NESTED ARRAYS)</span>
        </h5>
        
        <div v-for="subTable in metaData.subTables" :key="subTable.tableName" class="bg-surface-container-low rounded-2xl border-l-4 border-l-tertiary border border-outline-variant/30 overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-surface-container/60 flex items-center justify-between border-b border-outline-variant/20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <GitMerge class="w-4 h-4 text-tertiary" />
              </div>
              <div>
                <div class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">子表明细数组 (NESTED ARRAY)</div>
                <h4 class="text-sm font-extrabold text-on-surface mt-0.5">
                  "{{ subTable.tableName }}" : [ { ... } ]
                </h4>
              </div>
            </div>
            <span class="text-[9px] bg-tertiary/15 text-tertiary px-2 py-0.5 rounded font-mono font-bold">FK: {{ subTable.foreignKey }}</span>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="f in subTable.fields" :key="f.id" class="p-3 bg-surface rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
                <Type class="w-4 h-4 text-tertiary/70 shrink-0" />
                <div class="truncate">
                  <div class="text-xs font-bold text-on-surface truncate">{{ f.label }}</div>
                  <div class="text-[10px] text-outline font-mono mt-0.5 truncate">{{ f.columnName }} ({{ f.dataType }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. N:M RELATIONS Section (Nested Arrays of Association table) -->
      <div v-if="metaData.relations?.length > 0" class="space-y-4">
        <h5 class="text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-1.5">
          <GitPullRequest class="w-3.5 h-3.5" />
          <span>多对多关系实体 (RELATIONS - N:M NESTED ARRAYS)</span>
        </h5>
        
        <div v-for="rel in metaData.relations" :key="rel.rightTable" class="bg-surface-container-low rounded-2xl border-l-4 border-l-primary/70 border border-outline-variant/30 overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-surface-container/60 flex items-center justify-between border-b border-outline-variant/20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GitPullRequest class="w-4 h-4 text-primary" />
              </div>
              <div>
                <div class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">关系实体数组 (RELATION ARRAY)</div>
                <h4 class="text-sm font-extrabold text-on-surface mt-0.5">
                  "{{ rel.rightTable }}" : [ { ... } ]
                </h4>
              </div>
            </div>
            <div class="flex flex-col items-end gap-0.5">
              <span class="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded font-mono font-bold">中间表: {{ rel.junctionTable }}</span>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="f in rel.fields" :key="f.id" class="p-3 bg-surface rounded-xl border border-outline-variant/40 flex items-center gap-2.5">
                <Type class="w-4 h-4 text-primary/70 shrink-0" />
                <div class="truncate">
                  <div class="text-xs font-bold text-on-surface truncate">{{ f.label }}</div>
                  <div class="text-[10px] text-outline font-mono mt-0.5 truncate">{{ f.columnName }} ({{ f.dataType }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Database, Type,
  GitMerge, GitPullRequest, Link as LinkIcon, RotateCw
} from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { dataEngineApi } from '../../../api/dataEngine';

const route = useRoute();
const moduleId = computed(() => route.params.id);

const loading = ref(false);
const metaData = ref({ mainTable: null, subTables: [], joinTables: [], relations: [] });

const loadMeta = async () => {
  if (!moduleId.value) return;
  loading.value = true;
  try {
    const res = await dataEngineApi.getModuleMeta(moduleId.value);
    if (res) {
      metaData.value = res;
    }
  } catch (e) {
    console.error('加载结构元数据树失败:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadMeta();
});

watch(moduleId, () => {
  loadMeta();
});
</script>

<style scoped>
</style>
