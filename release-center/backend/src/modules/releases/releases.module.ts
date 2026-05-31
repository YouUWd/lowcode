import { Module } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { MockYunxiaoProvider } from '../providers/yunxiao/yunxiao.provider';

@Module({
  controllers: [ReleasesController],
  providers: [ReleasesService, MockYunxiaoProvider],
})
export class ReleasesModule {}