import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { MetadataService, TableInfo, DatabaseSchema } from './metadata.service';
import { MetadataCacheService } from './metadata-cache.service';

@Controller('metadata')
export class MetadataController {
  constructor(
    private readonly metadataService: MetadataService,
    private readonly cacheService: MetadataCacheService,
  ) {}

  /**
   * 获取所有表信息
   * GET /metadata/tables
   */
  @Get('tables')
  async getAllTables(
    @Query('database') database: string = 'lumina_business',
  ): Promise<TableInfo[]> {
    console.log(`[元数据控制器] 获取所有表信息, database=${database}`);
    return this.metadataService.getAllTables(database);
  }

  /**
   * 获取表的字段信息
   * GET /metadata/tables/:tableName/columns
   */
  @Get('tables/:tableName/columns')
  async getTableColumns(
    @Param('tableName') tableName: string,
    @Query('database') database: string = 'lumina_business',
  ) {
    console.log(`[元数据控制器] 获取表 ${tableName} 的字段信息`);
    return this.metadataService.getTableColumns(database, tableName);
  }

  /**
   * 获取表的外键信息
   * GET /metadata/tables/:tableName/foreign-keys
   */
  @Get('tables/:tableName/foreign-keys')
  async getTableForeignKeys(
    @Param('tableName') tableName: string,
    @Query('database') database: string = 'lumina_business',
  ) {
    console.log(`[元数据控制器] 获取表 ${tableName} 的外键信息`);
    return this.metadataService.getTableForeignKeys(database, tableName);
  }

  /**
   * 获取完整的数据库模型信息 (带缓存)
   * GET /metadata/schema
   */
  @Get('schema')
  async getDatabaseSchema(
    @Query('database') database: string = 'lumina_business',
  ): Promise<DatabaseSchema> {
    console.log(`[元数据控制器] 获取数据库 ${database} 的完整模型信息`);
    return this.cacheService.getDatabaseSchema(database);
  }

  /**
   * 获取前端格式的数据库模型 (带缓存)
   * GET /metadata/schema/ui
   */
  @Get('schema/ui')
  async getDbSchemaForUI(
    @Query('database') database: string = 'lumina_business',
  ): Promise<Record<string, any>> {
    console.log(`[元数据控制器] 获取前端格式的数据库模型`);
    return this.cacheService.getDbSchemaForUI(database);
  }

  /**
   * 获取特定表的详细信息
   * GET /metadata/tables/:tableName
   */
  @Get('tables/:tableName')
  async getTableDetail(
    @Param('tableName') tableName: string,
    @Query('database') database: string = 'lumina_business',
  ): Promise<TableInfo | null> {
    console.log(`[元数据控制器] 获取表 ${tableName} 的详细信息`);
    return this.metadataService.getTableDetail(tableName, database);
  }

  /**
   * 获取表的字段列表 (简化版)
   * GET /metadata/tables/:tableName/fields
   */
  @Get('tables/:tableName/fields')
  async getTableFieldNames(
    @Param('tableName') tableName: string,
    @Query('database') database: string = 'lumina_business',
  ): Promise<string[]> {
    console.log(`[元数据控制器] 获取表 ${tableName} 的字段列表`);
    return this.metadataService.getTableFieldNames(tableName, database);
  }

  /**
   * 检查表是否存在
   * GET /metadata/tables/:tableName/exists
   */
  @Get('tables/:tableName/exists')
  async tableExists(
    @Param('tableName') tableName: string,
    @Query('database') database: string = 'lumina_business',
  ): Promise<{ exists: boolean }> {
    console.log(`[元数据控制器] 检查表 ${tableName} 是否存在`);
    const exists = await this.metadataService.tableExists(tableName, database);
    return { exists };
  }

  /**
   * 检查字段是否存在
   * GET /metadata/tables/:tableName/columns/:columnName/exists
   */
  @Get('tables/:tableName/columns/:columnName/exists')
  async columnExists(
    @Param('tableName') tableName: string,
    @Param('columnName') columnName: string,
    @Query('database') database: string = 'lumina_business',
  ): Promise<{ exists: boolean }> {
    console.log(`[元数据控制器] 检查字段 ${tableName}.${columnName} 是否存在`);
    const exists = await this.metadataService.columnExists(
      tableName,
      columnName,
      database,
    );
    return { exists };
  }

  /**
   * 刷新元数据缓存
   * POST /metadata/cache/refresh
   */
  @Post('cache/refresh')
  async refreshCache(
    @Query('database') database: string = 'lumina_business',
  ): Promise<{ message: string }> {
    console.log(`[元数据控制器] 刷新缓存: ${database}`);
    await this.cacheService.refreshCache(database);
    return { message: `缓存已刷新: ${database}` };
  }

  /**
   * 清空所有缓存
   * POST /metadata/cache/clear
   */
  @Post('cache/clear')
  async clearCache(): Promise<{ message: string }> {
    console.log(`[元数据控制器] 清空所有缓存`);
    this.cacheService.clearAllCache();
    return { message: '所有缓存已清空' };
  }

  /**
   * 获取缓存统计信息
   * GET /metadata/cache/stats
   */
  @Get('cache/stats')
  getCacheStats(): any {
    console.log(`[元数据控制器] 获取缓存统计信息`);
    return this.cacheService.getCacheStats();
  }
}
