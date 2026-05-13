import { Module } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { MetadataController } from './metadata.controller';
import { MetadataCacheService } from './metadata-cache.service';

@Module({
  controllers: [MetadataController],
  providers: [MetadataService, MetadataCacheService],
  exports: [MetadataService, MetadataCacheService],
})
export class MetadataModule {}
