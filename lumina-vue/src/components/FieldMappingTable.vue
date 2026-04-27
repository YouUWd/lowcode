<template>
  <section class="relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
        <span class="material-symbols-outlined mr-2 text-primary">view_column</span>
        字段映射与投影 (Field Mapping)
      </h2>
      <button @click="showSqlPreview = true" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
        <span class="material-symbols-outlined text-[18px] mr-2">code</span>
        预览投影 SQL
      </button>
    </div>
    
    <div class="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.06)] overflow-hidden border border-outline-variant/10">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold">
            <th class="p-5 w-16 text-center">排序</th>
            <th class="p-5">显示名称</th>
            <th class="p-5">逻辑字段</th>
            <th class="p-5">物理字段</th>
            <th class="p-5">函数 / 转换器</th>
            <th class="p-5">渲染类型</th>
            <th class="p-5 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          
          <tr v-for="(row, index) in rows" :key="index" class="border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors group">
            <td class="p-5 text-center text-outline material-symbols-outlined text-base cursor-grab">drag_indicator</td>
            <td class="p-5 font-bold text-on-surface">{{ row.displayName }}</td>
            <td class="p-5">
              <span class="font-mono text-xs font-semibold text-primary bg-primary-fixed/30 px-2 py-1 rounded">{{ row.logicalField }}</span>
            </td>
            <td class="p-5">
              <div class="flex flex-col space-y-2">
                <span v-for="pf in row.physicalFields" :key="pf.name" class="flex items-center text-xs">
                  <span class="font-mono text-on-surface-variant">{{ pf.entity }}.{{ pf.name }}</span>
                </span>
              </div>
            </td>
            <td class="p-5">
              <div v-if="row.transformer" class="flex items-center space-x-2">
                <span class="material-symbols-outlined text-[16px]" 
                      :class="(row.transformerEnv === 'frontend' || (!row.transformerEnv && (row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK')))) ? 'text-secondary' : 'text-primary'"
                      :title="(row.transformerEnv === 'frontend' || (!row.transformerEnv && (row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK')))) ? '前端/BFF计算' : 'DB下推计算'"
                      style='font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20;'>
                  {{ (row.transformerEnv === 'frontend' || (!row.transformerEnv && (row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK')))) ? 'data_object' : 'functions' }}
                </span>
                <code class="text-xs bg-surface-container px-2 py-1 rounded text-primary font-mono border border-outline-variant/30 break-all">{{ row.transformer }}</code>
              </div>
              <span v-else class="text-xs text-outline font-mono">-</span>
            </td>
            <td class="p-5">
              <span class="px-2 py-1 bg-surface-container text-on-surface rounded text-xs border border-outline-variant/30 inline-flex items-center font-medium">
                <span class="material-symbols-outlined text-[12px] mr-1">{{ row.renderIcon }}</span>
                {{ row.renderType }}
              </span>
            </td>
            <td class="p-5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="text-primary hover:text-primary-container p-2 rounded-lg hover:bg-primary-fixed transition-colors"><span class="material-symbols-outlined text-sm">edit</span></button>
              <button @click="deleteRow(index)" class="text-error hover:text-on-error-container p-2 rounded-lg hover:bg-error-container transition-colors"><span class="material-symbols-outlined text-sm">delete</span></button>
            </td>
          </tr>

          <!-- Add New Row -->
          <tr class="bg-surface-container-lowest">
            <td class="p-0 border-t border-outline-variant/15" colspan="7">
              <button @click="showAddModal = true" class="w-full py-6 flex items-center justify-center space-x-3 text-primary hover:bg-primary-fixed/20 transition-all font-bold group border-2 border-transparent border-dashed hover:border-primary/50 m-2 rounded-xl cursor-pointer">
                <span class="material-symbols-outlined bg-primary text-on-primary rounded-full p-1 text-[18px] group-hover:scale-110 transition-transform">add</span>
                <span>添加新列 (Add New Row)</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Mapping Modal (Scoped to container) -->
    <Transition name="fade">
      <div v-if="showAddModal" class="absolute inset-0 z-[100] flex items-center justify-center bg-[#191c1d]/40 backdrop-blur-sm">
          <div class="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.12)] border border-outline-variant/20 overflow-hidden flex flex-col transform transition-all">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface">
              <h3 class="font-headline font-bold text-lg text-on-surface flex items-center">
                <span class="material-symbols-outlined mr-2 text-primary">add_circle</span>
                添加字段映射
              </h3>
              <button @click="showAddModal = false" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant/50">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <!-- Body -->
            <div class="p-6 space-y-5">
              <div class="flex space-x-4">
                <div class="flex-1 space-y-1">
                  <label class="text-xs font-bold text-on-surface-variant">显示名称</label>
                  <input v-model="newRow.displayName" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary transition-colors" placeholder="如: 邮箱" />
                </div>
                <div class="flex-1 space-y-1">
                  <label class="text-xs font-bold text-on-surface-variant">逻辑字段</label>
                  <input v-model="newRow.logicalField" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary font-mono transition-colors" placeholder="如: email" />
                </div>
              </div>
              
              <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-3">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-xs font-bold text-primary">物理字段来源 (可多个)</h4>
                  <button @click="addPhysField" type="button" class="text-xs text-primary font-bold hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center">
                    <span class="material-symbols-outlined text-[14px] mr-1">add</span>添加来源
                  </button>
                </div>
                <div v-for="(pf, idx) in newRow.physFields" :key="idx" class="flex space-x-2 items-center">
                  <div class="flex-1 space-y-1">
                    <input v-model="pf.entity" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary transition-colors" placeholder="实体名 (如: 员工)" />
                  </div>
                  <span class="material-symbols-outlined text-outline">link</span>
                  <div class="flex-[2] space-y-1">
                    <input v-model="pf.name" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary font-mono transition-colors" placeholder="表字段名 (如: email_address)" />
                  </div>
                  <button v-if="newRow.physFields.length > 1" @click="removePhysField(idx)" type="button" class="text-error hover:bg-error/10 p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>

              <div v-if="newRow.physFields.length > 1" class="space-y-4 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/20 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label class="text-xs font-bold text-on-surface-variant mb-2 block">数据处理与聚合策略</label>
                  <div class="flex bg-surface-container-high rounded-xl p-1 border border-outline-variant/20">
                    <button @click="newRow.transformerEnv = 'backend'" type="button" 
                            class="flex-1 flex items-center justify-center space-x-2 py-2 text-sm rounded-lg transition-all font-bold"
                            :class="newRow.transformerEnv === 'backend' ? 'bg-primary-container text-on-primary-container shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'">
                      <span class="material-symbols-outlined text-[18px]">database</span>
                      <span>DB 下推</span>
                    </button>
                    <button @click="newRow.transformerEnv = 'frontend'" type="button" 
                            class="flex-1 flex items-center justify-center space-x-2 py-2 text-sm rounded-lg transition-all font-bold"
                            :class="newRow.transformerEnv === 'frontend' ? 'bg-secondary-container text-on-secondary-container shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'">
                      <span class="material-symbols-outlined text-[18px]">api</span>
                      <span>BFF 上拉</span>
                    </button>
                  </div>
                </div>

                <!-- Expression input -->
                <div class="relative pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label class="text-xs font-bold mb-1.5 block" :class="newRow.transformerEnv === 'backend' ? 'text-primary' : 'text-secondary'">
                    {{ newRow.transformerEnv === 'backend' ? 'SQL 计算表达式 (如数学运算/字符串拼接)' : '运行时处理指令 (如字典转译/数据脱敏)' }}
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] opacity-70" :class="newRow.transformerEnv === 'backend' ? 'text-primary' : 'text-secondary'">{{ newRow.transformerEnv === 'backend' ? 'functions' : 'data_object' }}</span>
                    <input v-model="newRow.transformer" type="text" 
                           class="w-full pl-10 text-sm rounded-xl border-outline-variant/40 bg-surface focus:ring-2 font-mono transition-all"
                           :class="newRow.transformerEnv === 'backend' ? 'focus:ring-primary/20 focus:border-primary' : 'focus:ring-secondary/20 focus:border-secondary'"
                           :placeholder="newRow.transformerEnv === 'backend' ? 'e.g. CONCAT(${first_name}, ${last_name})' : 'e.g. DICT_MAP(\'GENDER\', ${gender})'" />
                  </div>
                  <p class="text-[10.5px] mt-2 opacity-70 flex items-start leading-snug">
                    <span class="material-symbols-outlined text-[14px] mr-1">info</span>
                    {{ newRow.transformerEnv === 'backend' ? '底层 SQL 将直接嵌入此表达式，可利用数据库索引进行排序和过滤，适合轻量级操作。' : '底层系统仅查询依赖的物理字段，数据加载到内存后由服务端引擎执行此规则。适合强业务逻辑。' }}
                  </p>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface-variant">渲染类型</label>
                <select v-model="newRow.renderType" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary transition-colors">
                  <option value="Text">Text (普通文本)</option>
                  <option value="Badge">Badge (徽标)</option>
                  <option value="Tag">Tag (标签)</option>
                  <option value="Link">Link (超链接)</option>
                  <option value="Status">Status (状态点)</option>
                </select>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-outline-variant/15 flex justify-end space-x-3 bg-surface-container-low">
              <button @click="showAddModal = false" class="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors">取消</button>
              <button @click="addRow" class="px-5 py-2 bg-primary text-on-primary text-sm font-bold rounded-xl shadow-sm hover:bg-primary/90 active:scale-95 transition-all" 
                      :disabled="!newRow.displayName || !newRow.logicalField || (newRow.physFields.length > 1 && (!newRow.transformer || newRow.transformerEnv === 'none'))" 
                      :class="{'opacity-50 cursor-not-allowed': !newRow.displayName || !newRow.logicalField || (newRow.physFields.length > 1 && (!newRow.transformer || newRow.transformerEnv === 'none'))}">
                确认添加
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- SQL Preview Modal (Scoped) -->
      <Transition name="fade">
        <div v-if="showSqlPreview" class="absolute inset-0 z-[200] flex items-center justify-center bg-[#191c1d]/60 backdrop-blur-sm">
          <div class="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-[0px_12px_32px_rgba(25,28,29,0.12)] border border-outline-variant/20 overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-outline-variant/15 flex justify-between items-center bg-surface">
              <h3 class="font-headline font-bold text-lg text-on-surface flex items-center">
                <span class="material-symbols-outlined mr-2 text-primary">terminal</span>
                投影 SQL 预览
              </h3>
              <button @click="showSqlPreview = false" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant/50">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div class="p-6 bg-[#1e1e1e] overflow-x-auto">
              <pre class="text-[#d4d4d4] font-mono text-sm leading-relaxed"><code>{{ generatedSql }}</code></pre>
            </div>

            <div class="px-6 py-4 border-t border-outline-variant/15 flex justify-end space-x-3 bg-surface-container-low">
              <button @click="copySql" class="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center">
                <span class="material-symbols-outlined text-[18px] mr-1">content_copy</span>
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
import { ref, reactive, computed } from 'vue';
import { currentConfig, addMappingToCurrentConfig, deleteMappingFromCurrentConfig } from '../store/mockStore';

const rows = computed(() => currentConfig.value.mappings || []);

const showAddModal = ref(false);
const showSqlPreview = ref(false);

const generatedSql = computed(() => {
  if (!rows.value || rows.value.length === 0) return '-- 无投影配置';
  
  let sql = 'SELECT\n';
  const sqlSelectMap = new Map();
  const frontendTransforms = [];

  rows.value.forEach(row => {
    // Hybrid Logic: Explicitly use user's choice. Fallback to heuristic for old mock data.
    let isFrontendTransform = false;
    if (row.transformer) {
      if (row.transformerEnv) {
        isFrontendTransform = row.transformerEnv === 'frontend';
      } else {
        isFrontendTransform = row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK');
      }
    }
    
    if (isFrontendTransform) {
      // Option B (Pull-up): Frontend/BFF handles logic. We only query raw physical fields.
      frontendTransforms.push(`-- [BFF / 前端计算引擎] ${row.logicalField} (${row.displayName}) -> ${row.transformer}`);
      
      row.physicalFields?.forEach(pf => {
        const expression = `${pf.entity}.${pf.name}`;
        if (!sqlSelectMap.has(expression)) sqlSelectMap.set(expression, new Set());
        sqlSelectMap.get(expression).add(`依赖: ${row.logicalField}`);
      });
    } else {
      // Option A (Push-down): Database handles logic (e.g. CONCAT, UPPER).
      let expression = '';
      if (row.transformer) {
        // Replace ${field_name} with table.field_name
        let computedExpr = row.transformer.replace(/\$\{([^}]+)\}/g, (match, p1) => {
          const physField = row.physicalFields?.find(f => f.name === p1);
          return physField ? `${physField.entity}.${physField.name}` : match;
        });
        expression = `${computedExpr} AS ${row.logicalField}`;
      } else {
        const physField = row.physicalFields?.[0];
        expression = physField ? `${physField.entity}.${physField.name} AS ${row.logicalField}` : `UNKNOWN_FIELD AS ${row.logicalField}`;
      }
      
      if (!sqlSelectMap.has(expression)) sqlSelectMap.set(expression, new Set());
      sqlSelectMap.get(expression).add(row.displayName);
    }
  });

  // Deduplicate query fields and assemble
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
  sql += '\n\n';
  
  if (frontendTransforms.length > 0) {
    sql += frontendTransforms.join('\n');
  }
  
  return sql;
});

const copySql = async () => {
  try {
    await navigator.clipboard.writeText(generatedSql.value);
  } catch (err) {
    console.error('复制失败:', err);
  }
};

const newRow = reactive({
  displayName: '',
  logicalField: '',
  physFields: [{ entity: '', name: '' }],
  transformer: '',
  transformerEnv: 'none',
  renderType: 'Text'
});

const addPhysField = () => {
  newRow.physFields.push({ entity: '', name: '' });
  if (newRow.physFields.length > 1 && newRow.transformerEnv === 'none') {
    newRow.transformerEnv = 'backend';
  }
};

const removePhysField = (idx) => {
  newRow.physFields.splice(idx, 1);
  if (newRow.physFields.length === 1) {
    newRow.transformerEnv = 'none';
    newRow.transformer = '';
  }
};

const getIconForRenderType = (type) => {
  const map = {
    Text: 'title',
    Badge: 'sell',
    Tag: 'label',
    Link: 'link',
    Status: 'fiber_manual_record'
  };
  return map[type] || 'title';
};

const getBadgeClassForEntity = (entityName) => {
  if (entityName.includes('部门') || entityName.includes('组织')) return 'bg-secondary-container/50 text-on-secondary-container';
  if (entityName.includes('岗位') || entityName.includes('角色')) return 'bg-tertiary-container/20 text-tertiary-container';
  return 'bg-primary-fixed/30 text-on-primary-fixed';
};

const addRow = () => {
  if (!newRow.displayName || !newRow.logicalField) return;

  const validPhysFields = newRow.physFields
    .filter(pf => pf.name)
    .map(pf => ({
      entity: pf.entity || '未知',
      name: pf.name,
      badgeClass: getBadgeClassForEntity(pf.entity)
    }));

  addMappingToCurrentConfig({
    displayName: newRow.displayName,
    logicalField: newRow.logicalField,
    physicalFields: validPhysFields,
    transformer: newRow.transformerEnv !== 'none' && newRow.transformer ? newRow.transformer : null,
    transformerEnv: newRow.transformerEnv !== 'none' && newRow.transformer ? newRow.transformerEnv : null,
    renderIcon: getIconForRenderType(newRow.renderType),
    renderType: newRow.renderType
  });

  // Reset form
  newRow.displayName = '';
  newRow.logicalField = '';
  newRow.physFields = [{ entity: '', name: '' }];
  newRow.transformer = '';
  newRow.transformerEnv = 'none';
  newRow.renderType = 'Text';

  showAddModal.value = false;
};

const deleteRow = (index) => {
  deleteMappingFromCurrentConfig(index);
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
