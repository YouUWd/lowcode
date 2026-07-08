import { Module } from '@nestjs/common';
import { ErSchemaController } from './er-schema.controller';
import { ErSchemaService } from './er-schema.service';

@Module({
  controllers: [ErSchemaController],
  providers: [ErSchemaService],
  exports: [ErSchemaService],
})
export class ErSchemaModule {}
