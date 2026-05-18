import { reactive, computed } from 'vue';
import { metadataApi } from '../api/metadata';
import { setLoading } from './app';

export const metadataState = reactive({
  dbSchema: null,
  loaded: false,
  error: null
});

/**
 * tableMap Computed: Replaces the old dbSchemaUI adapter.
 * Generates the UI-friendly table dictionary on the fly from the raw schema.
 */
export const tableMap = computed(() => {
  const schema = metadataState.dbSchema;
  const map = {};
  
  if (schema && schema.tables) {
    schema.tables.forEach(table => {
      map[table.tableName] = {
        desc: table.tableComment || table.tableName,
        fields: table.fields.map(f => f.columnName)
      };
    });
  }
  
  return map;
});

export const loadDatabaseSchema = async () => {
  try {
    setLoading(true);
    metadataState.error = null;
    const schema = await metadataApi.getSchema();
    metadataState.dbSchema = schema;
    metadataState.loaded = true;
  } catch (error) {
    console.error('[Store:Metadata] Load failed:', error);
    metadataState.error = error.message;
  } finally {
    setLoading(false);
  }
};

export const refreshMetadataCache = async () => {
  await metadataApi.refreshCache();
  await loadDatabaseSchema();
};
