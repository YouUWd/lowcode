<template>
  <section class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h3 class="text-sm font-bold text-on-surface flex items-center">
          <Columns class="w-4 h-4 mr-2 text-primary" />
          字段投影 (Field Mappings)
        </h3>
        <p class="text-xs text-on-surface-variant mt-1 opacity-70">本列表为系统根据表结构自动推断生成的全量字段（只读模式）</p>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="showSqlPreview = true"
          class="px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-variant hover:text-on-surface transition-all flex items-center shadow-sm"
        >
          <Code class="w-3.5 h-3.5 mr-1.5" />
          SQL 预览
        </button>
      </div>
    </div>

    <!-- 字段映射表格 -->
    <div class="bg-surface-container-low rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-on-surface-variant bg-surface-container uppercase font-bold border-b border-outline-variant/30">
            <tr>
              <th scope="col" class="px-6 py-4 w-12 text-center"></th>
              <th scope="col" class="px-6 py-4">展示名称 / 逻辑字段</th>
              <th scope="col" class="px-6 py-4">物理映射来源</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="rows && rows.length > 0">
              <tr 
                v-for="(row, index) in rows" 
                :key="index"
                class="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors group"
              >
                <td class="px-6 py-4 text-center">
                  <GripVertical class="w-4 h-4 mx-auto text-on-surface-variant opacity-30 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <component :is="resolveRenderIcon(row.renderIcon)" class="w-4 h-4 mr-3 text-primary/70" />
                    <div>
                      <div class="font-bold text-on-surface flex items-center">
                        {{ row.displayName }}
                      </div>
                      <div class="text-xs text-on-surface-variant opacity-70 mt-1 font-mono">{{ row.logicalField }}</div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="(pf, idx) in row.physicalFields" 
                      :key="idx"
                      class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary-fixed/30 text-on-primary-fixed"
                    >
                      <Database class="w-3 h-3 mr-1.5 opacity-70" />
                      {{ pf.entity }}.{{ pf.field }}
                    </span>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="3" class="px-6 py-12 text-center text-on-surface-variant">
                <div class="flex flex-col items-center justify-center opacity-60">
                  <Columns class="w-8 h-8 mb-3" />
                  <p class="font-bold">暂无字段映射</p>
                  <p class="text-xs mt-1">请先添加实体表，字段将会自动生成</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SQL Preview Modal -->
    <Transition name="fade">
      <div v-if="showSqlPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
        <div class="bg-surface-container-high rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-outline-variant/20">
          <div class="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low">
            <h3 class="text-lg font-bold text-on-surface flex items-center">
              <Terminal class="w-5 h-5 mr-2 text-primary" />
              底层 SQL 预览
            </h3>
            <button @click="showSqlPreview = false" class="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="flex-1 overflow-auto p-6 bg-[#1e1e1e]">
            <pre class="text-[#d4d4d4] font-mono text-sm leading-relaxed"><code>{{ generatedSql }}</code></pre>
          </div>

          <div class="px-6 py-4 border-t border-outline-variant/15 flex justify-end space-x-3 bg-surface-container-low">
            <button @click="copySql" class="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center">
              <Copy class="w-4 h-4 mr-2" />
              复制 SQL
            </button>
            <button @click="showSqlPreview = false" class="px-5 py-2 bg-primary text-on-primary text-sm font-bold rounded-xl shadow-sm hover:bg-primary/90 active:scale-95 transition-all">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  Columns, Code, GripVertical, 
  X, Link as LinkIcon, 
  Database, Terminal, Copy, Type, Tag, Hash, Circle,
  Fingerprint, GraduationCap, Users, BookOpen, Calendar, 
  Mail, Phone, MapPin, ShieldCheck, User, School, Star
} from 'lucide-vue-next';

const resolveRenderIcon = (iconName) => {
  if (!iconName) return Type;
  if (typeof iconName !== 'string') return iconName; 

  const iconMap = {
    'icon-id': Fingerprint,
    'icon-user': User,
    'icon-users': Users,
    'icon-class': School,
    'icon-grade': GraduationCap,
    'icon-star': Star,
    'icon-book': BookOpen,
    'icon-calendar': Calendar,
    'icon-mail': Mail,
    'icon-phone': Phone,
    'icon-location': MapPin,
    'icon-shield': ShieldCheck,
    'icon-tag': Tag,
    'icon-hash': Hash,
    'icon-link': LinkIcon,
    'icon-text': Type,
    'icon-circle': Circle
  };

  return iconMap[iconName] || Type;
};

import { currentConfig } from '../../../store/modules';

const rows = computed(() => currentConfig.value.mappings || []);
const showSqlPreview = ref(false);

const generatedSql = computed(() => {
  if (!rows.value || rows.value.length === 0) return '-- 无投影配置';
  
  let sql = 'SELECT\n';
  const sqlSelectMap = new Map();

  rows.value.forEach(row => {
    let expression = '';
    const physField = row.physicalFields?.[0];
    expression = physField ? `${physField.entity}.${physField.field} AS ${row.logicalField}` : `UNKNOWN_FIELD AS ${row.logicalField}`;
    
    if (!sqlSelectMap.has(expression)) sqlSelectMap.set(expression, new Set());
    sqlSelectMap.get(expression).add(row.displayName);
  });

  const uniqueParts = [];
  sqlSelectMap.forEach((commentsSet, expr) => {
    uniqueParts.push(`  ${expr} /* ${Array.from(commentsSet).join(', ')} */`);
  });
  
  sql += uniqueParts.join(',\n');
  
  const usedEntities = new Set();
  rows.value.forEach(row => {
    row.physicalFields?.forEach(pf => {
      usedEntities.add(pf.entity);
    });
  });

  const primaryEntityName = currentConfig.value.primaryEntity?.name || 'unknown_table';
  sql += `\nFROM ${primaryEntityName}`;
  
  if (currentConfig.value.entities) {
    currentConfig.value.entities.forEach(entity => {
      if (usedEntities.has(entity.name)) {
        const joinCond = entity.joinCondition;
        if (joinCond) {
          sql += `\nLEFT JOIN ${entity.name} ON ${entity.name}.${joinCond.left} = ${primaryEntityName}.${joinCond.right}`;
        }
      }
    });
  }
  sql += '\n';
  
  return sql;
});

const copySql = async () => {
  try {
    await navigator.clipboard.writeText(generatedSql.value);
  } catch (err) {
    console.error('复制失败:', err);
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
