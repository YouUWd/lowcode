<template>
  <div class="p-8 space-y-12 w-full">
    <!-- Header Action Section (标题与按钮对齐) -->
    <div class="flex justify-between items-center mb-6 mt-[-1rem]">
      <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
        <Settings class="mr-2 text-primary w-5 h-5" />
        实体聚合配置 (Aggregation Setup)
      </h2>

      <div class="flex space-x-3">
        <button @click="goToPermissions" class="px-4 py-2 border border-tertiary text-tertiary text-sm font-medium rounded-xl hover:bg-tertiary/5 transition-colors flex items-center">
          <Shield class="w-4 h-4 mr-2" />
          权限定义
        </button>
        <div class="w-px h-6 bg-outline-variant/40 mx-1 my-auto"></div>
        <button @click="showSqlPreview = true" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
          <Code class="w-4 h-4 mr-2" />
          预览 SQL
        </button>
        <button class="px-4 py-2 bg-surface-container-highest text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors">
          导入模板
        </button>
        <button class="px-5 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center">
          <CheckCheck class="w-4 h-4 mr-2" />
          验证并保存
        </button>
      </div>
    </div>
    
    <AggregationSetup />
    <FieldMappingTable />

    <!-- SQL Preview Modal -->
    <Transition name="fade">
      <div v-if="showSqlPreview" class="fixed inset-0 z-[200] flex items-center justify-center bg-[#191c1d]/60 backdrop-blur-sm">
        <div class="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.12)] border border-outline-variant/20 overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface">
            <h3 class="font-headline font-bold text-lg text-on-surface flex items-center">
              <Terminal class="mr-2 text-primary w-5 h-5" />
              SQL 预览
            </h3>
            <button @click="showSqlPreview = false" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant/50">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="p-6 bg-[#1e1e1e] overflow-x-auto">
            <pre class="text-[#d4d4d4] font-mono text-sm leading-relaxed"><code>{{ generatedSql }}</code></pre>
          </div>

          <div class="px-6 py-4 border-t border-outline-variant/15 flex justify-end space-x-3 bg-surface-container-low">
            <button @click="copySql" class="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center">
              <Copy class="w-4 h-4 mr-1" />
              复制 SQL
            </button>
            <button @click="showSqlPreview = false" class="px-5 py-2 bg-primary text-on-primary text-sm font-bold rounded-xl shadow-sm hover:bg-primary/90 active:scale-95 transition-all">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Settings, Shield, Code, CheckCheck, Terminal, X, Copy } from 'lucide-vue-next';
import AggregationSetup from './parts/AggregationSetup.vue';
import FieldMappingTable from './parts/FieldMappingTable.vue';
import { modulesState, currentConfig } from '../../store/modules';

const showSqlPreview = ref(false);

const generatedSql = computed(() => {
  const config = currentConfig.value;
  if (!config || !config.primaryEntity) return '-- 无聚合配置';
  
  const primary = config.primaryEntity;
  const entities = config.entities || [];
  
  let selectClause = `SELECT\n  t0.*`;
  let fromClause = `FROM\n  ${primary.name} AS t0\n`;
  
  if (entities.length > 0) {
    entities.forEach((ent, idx) => {
      const alias = `t${idx + 1}`;
      selectClause += `,\n  ${alias}.*`;
      fromClause += `LEFT JOIN ${ent.name} AS ${alias} \n  ON t0.${ent.joinCondition.left} = ${alias}.${ent.joinCondition.right}\n`;
    });
  }
  
  return selectClause + '\n' + fromClause;
});

const copySql = async () => {
  try {
    await navigator.clipboard.writeText(generatedSql.value);
    // Simple visual feedback could be added here
  } catch (err) {
    console.error('复制失败:', err);
  }
};

import { useRouter } from 'vue-router';

const router = useRouter();

const goToPermissions = () => {
  if (modulesState.activeModule) {
    router.push(`/modules/${modulesState.activeModule.id}/permissions`);
  }
};

const goBack = () => {
  router.push('/modules');
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
