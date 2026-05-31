import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async findAll() {
    const data = await this.applicationsService.findAll();
    return { code: 0, message: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.applicationsService.findOne(+id);
    return { code: 0, message: 'success', data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.applicationsService.create(body);
    return { code: 0, message: 'success', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.applicationsService.update(+id, body);
    return { code: 0, message: 'success', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.applicationsService.remove(+id);
    return { code: 0, message: 'success', data };
  }
}