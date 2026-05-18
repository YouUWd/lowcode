import { Injectable } from '@nestjs/common';
import { MetadataService, DatabaseSchema } from './metadata.service';

/**
 * 元数据缓存服务
 * 缓存数据库模型信息，避免频繁查询 INFORMATION_SCHEMA
 */
@Injectable()
export class MetadataCacheService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 小时

  constructor(private readonly metadataService: MetadataService) {}

  /**
   * 获取缓存的数据库模型信息
   */
  async getDatabaseSchema(): Promise<DatabaseSchema> {
    const cacheKey = `schema:business`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log(`[元数据缓存] 命中缓存: ${cacheKey}`);
      return cached;
    }

    console.log(`[元数据缓存] 缓存未命中: ${cacheKey}，从数据库加载`);
    const schema = await this.metadataService.getDatabaseSchema();
    this.setCache(cacheKey, schema);

    return schema;
  }

  /**
   * 手动刷新缓存
   */
  async refreshCache(): Promise<void> {
    console.log(`[元数据缓存] 刷新缓存`);
    
    const cacheKeys = [
      `schema:business`,
    ];

    cacheKeys.forEach(key => this.cache.delete(key));

    // 预加载缓存
    await this.getDatabaseSchema();

    console.log(`[元数据缓存] 缓存刷新完成`);
  }

  /**
   * 清空所有缓存
   */
  clearAllCache(): void {
    console.log(`[元数据缓存] 清空所有缓存`);
    this.cache.clear();
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      console.log(`[元数据缓存] 缓存已过期: ${key}`);
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`[元数据缓存] 缓存已设置: ${key}`);
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
