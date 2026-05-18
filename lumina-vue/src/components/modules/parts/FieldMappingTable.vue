<template>
  <section class="relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-headline text-lg font-bold text-on-surface flex items-center">
        <Columns class="mr-2 text-primary w-5 h-5" />
        字段映射与投影 (Field Mapping)
      </h2>
      <button @click="showSqlPreview = true" class="px-4 py-2 border border-outline-variant text-on-surface text-sm font-medium rounded-xl hover:bg-surface-variant transition-colors flex items-center">
        <Code class="w-4 h-4 mr-2" />
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
            <td class="p-5 text-center text-outline cursor-grab">
              <GripVertical class="w-4 h-4 mx-auto" />
            </td>
            <td class="p-5 font-bold text-on-surface">{{ row.displayName }}</td>
            <td class="p-5">
              <span class="font-mono text-xs font-semibold text-primary bg-primary-fixed/30 px-2 py-1 rounded">{{ row.logicalField }}</span>
            </td>
            <td class="p-5">
              <div class="flex flex-col space-y-2">
                <span v-for="pf in row.physicalFields" :key="pf.field" class="flex items-center text-xs">
                  <span class="font-mono text-on-surface-variant">{{ pf.entity }}.{{ pf.field }}</span>
                </span>
              </div>
            </td>
            <td class="p-5">
              <div v-if="row.transformer" class="flex items-center space-x-2">
                <component :is="(row.transformerEnv === 'frontend' || (!row.transformerEnv && (row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK')))) ? Cpu : SquareFunction" 
                          class="w-4 h-4"
                          :class="(row.transformerEnv === 'frontend' || (!row.transformerEnv && (row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK')))) ? 'text-secondary' : 'text-primary'"
                          :title="(row.transformerEnv === 'frontend' || (!row.transformerEnv && (row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK')))) ? '前端/BFF计算' : 'DB下推计算'" />
                <code class="text-xs bg-surface-container px-2 py-1 rounded text-primary font-mono border border-outline-variant/30 break-all">{{ row.transformer }}</code>
              </div>
              <span v-else class="text-xs text-outline font-mono">-</span>
            </td>
            <td class="p-5">
              <span class="px-2 py-1 bg-surface-container text-on-surface rounded text-xs border border-outline-variant/30 inline-flex items-center font-medium">
                <component :is="resolveRenderIcon(row.renderIcon)" v-if="row.renderIcon" class="w-3 h-3 mr-1.5" />
                {{ row.renderType }}
              </span>
            </td>
            <td class="p-5 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="text-primary hover:text-primary-container p-2 rounded-lg hover:bg-primary-fixed transition-colors">
                <Edit2 class="w-4 h-4" />
              </button>
              <button @click="deleteRow(row.logicalField)" class="text-error hover:text-on-error-container p-2 rounded-lg hover:bg-error-container transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>

          <!-- Add New Row -->
          <tr class="bg-surface-container-lowest">
            <td class="p-0 border-t border-outline-variant/15" colspan="7">
              <button @click="showAddModal = true" class="w-full py-6 flex items-center justify-center space-x-3 text-primary hover:bg-primary-fixed/20 transition-all font-bold group border-2 border-transparent border-dashed hover:border-primary/50 m-2 rounded-xl cursor-pointer">
                <div class="bg-primary text-on-primary rounded-full p-1 group-hover:scale-110 transition-transform">
                  <Plus class="w-4 h-4" />
                </div>
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
                <PlusCircle class="mr-2 text-primary w-5 h-5" />
                添加字段映射
              </h3>
              <button @click="showAddModal = false" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant/50">
                <X class="w-5 h-5" />
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
                    <Plus class="w-3 h-3 mr-1" />添加来源
                  </button>
                </div>
                <div v-for="(pf, idx) in newRow.physFields" :key="idx" class="flex space-x-2 items-center">
                  <div class="flex-1 space-y-1">
                    <input v-model="pf.entity" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary transition-colors" placeholder="实体名 (如: 员工)" />
                  </div>
                  <LinkIcon class="w-4 h-4 text-outline" />
                  <div class="flex-[2] space-y-1">
                    <input v-model="pf.field" type="text" class="w-full text-sm rounded-lg border-outline-variant/40 bg-surface focus:ring-primary focus:border-primary font-mono transition-colors" placeholder="表字段名 (如: email_address)" />
                  </div>
                  <button v-if="newRow.physFields.length > 1" @click="removePhysField(idx)" type="button" class="text-error hover:bg-error/10 p-1 rounded-full transition-colors flex items-center justify-center">
                    <X class="w-4 h-4" />
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
                      <Database class="w-4 h-4" />
                      <span>DB 下推</span>
                    </button>
                    <button @click="newRow.transformerEnv = 'frontend'" type="button" 
                            class="flex-1 flex items-center justify-center space-x-2 py-2 text-sm rounded-lg transition-all font-bold"
                            :class="newRow.transformerEnv === 'frontend' ? 'bg-secondary-container text-on-secondary-container shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'">
                      <Cpu class="w-4 h-4" />
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
                    <component :is="newRow.transformerEnv === 'backend' ? SquareFunction : Cpu" 
                              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-70"
                              :class="newRow.transformerEnv === 'backend' ? 'text-primary' : 'text-secondary'" />
                    <input v-model="newRow.transformer" type="text" 
                           class="w-full pl-10 text-sm rounded-xl border-outline-variant/40 bg-surface focus:ring-2 font-mono transition-all"
                           :class="newRow.transformerEnv === 'backend' ? 'focus:ring-primary/20 focus:border-primary' : 'focus:ring-secondary/20 focus:border-secondary'"
                           :placeholder="newRow.transformerEnv === 'backend' ? 'e.g. CONCAT(${first_name}, ${last_name})' : 'e.g. DICT_MAP(\'GENDER\', ${gender})'" />
                  </div>
                  <p class="text-[10.5px] mt-2 opacity-70 flex items-start leading-snug">
                    <Info class="w-3.5 h-3.5 mr-1 shrink-0" />
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
              <Terminal class="mr-2 text-primary w-5 h-5" />
              投影 SQL 预览
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
import { ref, reactive, computed, markRaw } from 'vue';
import { 
  Columns, Code, GripVertical, Cpu, SquareFunction, 
  Edit2, Trash2, Plus, PlusCircle, X, Link as LinkIcon, 
  Database, Info, Terminal, Copy, Type, Tag, Hash, Circle,
  Fingerprint, GraduationCap, Users, BookOpen, Calendar, 
  Mail, Phone, MapPin, ShieldCheck, User, School, Star
} from 'lucide-vue-next';

/**
 * 解析渲染图标
 * 将后端返回的字符串标识符映射为 Lucide 组件
 */
const resolveRenderIcon = (iconName) => {
  if (!iconName) return Type;
  if (typeof iconName !== 'string') return iconName; // 如果已经是组件引用，直接返回

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
import { currentConfig, addMappingToCurrentConfig, deleteMappingFromCurrentConfig } from '../../../store/modules';

const rows = computed(() => currentConfig.value.mappings || []);

const showAddModal = ref(false);
const showSqlPreview = ref(false);

const generatedSql = computed(() => {
  if (!rows.value || rows.value.length === 0) return '-- 无投影配置';
  
  let sql = 'SELECT\n';
  const sqlSelectMap = new Map();
  const frontendTransforms = [];

  rows.value.forEach(row => {
    let isFrontendTransform = false;
    if (row.transformer) {
      if (row.transformerEnv) {
        isFrontendTransform = row.transformerEnv === 'frontend';
      } else {
        isFrontendTransform = row.transformer.startsWith('DICT_MAP') || row.transformer.startsWith('MASK');
      }
    }
    
    if (isFrontendTransform) {
      frontendTransforms.push(`-- [BFF / 前端计算引擎] ${row.logicalField} (${row.displayName}) -> ${row.transformer}`);
      
      row.physicalFields?.forEach(pf => {
        const expression = `${pf.entity}.${pf.field}`;
        if (!sqlSelectMap.has(expression)) sqlSelectMap.set(expression, new Set());
        sqlSelectMap.get(expression).add(`依赖: ${row.logicalField}`);
      });
    } else {
      let expression = '';
      if (row.transformer) {
        let computedExpr = row.transformer.replace(/\$\{([^}]+)\}/g, (match, p1) => {
          const physField = row.physicalFields?.find(f => f.field === p1);
          return physField ? `${physField.entity}.${physField.field}` : match;
        });
        expression = `${computedExpr} AS ${row.logicalField}`;
      } else {
        const physField = row.physicalFields?.[0];
        expression = physField ? `${physField.entity}.${physField.field} AS ${row.logicalField}` : `UNKNOWN_FIELD AS ${row.logicalField}`;
      }
      
      if (!sqlSelectMap.has(expression)) sqlSelectMap.set(expression, new Set());
      sqlSelectMap.get(expression).add(row.displayName);
    }
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
  physFields: [{ entity: '', field: '' }],
  transformer: '',
  transformerEnv: 'none',
  renderType: 'Text'
});

const addPhysField = () => {
  newRow.physFields.push({ entity: '', field: '' });
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
    Text: Type,
    Badge: Tag,
    Tag: Hash,
    Link: LinkIcon,
    Status: Circle
  };
  return map[type] || Type;
};

const getBadgeClassForEntity = (entityName) => {
  const name = entityName.toLowerCase();
  if (name.includes('部门') || name.includes('组织') || name.includes('org') || name.includes('dept')) 
    return 'bg-secondary-container/50 text-on-secondary-container';
  if (name.includes('岗位') || name.includes('角色') || name.includes('pos') || name.includes('role')) 
    return 'bg-tertiary-container/20 text-tertiary-container border border-tertiary-container/30';
  if (name.includes('user') || name.includes('emp'))
    return 'bg-primary-container/40 text-on-primary-container';
  return 'bg-primary-fixed/30 text-on-primary-fixed';
};

const addRow = async () => {
  if (!newRow.displayName || !newRow.logicalField) return;

  const validPhysFields = newRow.physFields
    .filter(pf => pf.field)
    .map(pf => ({
      entity: pf.entity || '未知',
      field: pf.field
    }));

  await addMappingToCurrentConfig({
    displayName: newRow.displayName,
    logicalField: newRow.logicalField,
    physicalFields: validPhysFields,
    transformer: newRow.transformerEnv !== 'none' && newRow.transformer ? newRow.transformer : null,
    transformerEnv: newRow.transformerEnv !== 'none' && newRow.transformer ? newRow.transformerEnv : null,
    renderIcon: 'icon-text', // 默认图标标识符
    renderType: newRow.renderType
  });

  newRow.displayName = '';
  newRow.logicalField = '';
  newRow.physFields = [{ entity: '', field: '' }];
  newRow.transformer = '';
  newRow.transformerEnv = 'none';
  newRow.renderType = 'Text';

  showAddModal.value = false;
};

const deleteRow = async (logicalField) => {
  await deleteMappingFromCurrentConfig(logicalField);
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
