import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Controller('environments')
@UseGuards(JwtAuthGuard)
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  async findAll() {
    const data = await this.environmentsService.findAll();
    return { code: 0, message: 'success', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.environmentsService.findOne(+id);
    return { code: 0, message: 'success', data };
  }

  @Post()
  async create(@Body() createEnvironmentDto: CreateEnvironmentDto) {
    const data = await this.environmentsService.create(createEnvironmentDto);
    return { code: 0, message: 'success', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateEnvironmentDto: UpdateEnvironmentDto) {
    const data = await this.environmentsService.update(+id, updateEnvironmentDto);
    return { code: 0, message: 'success', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.environmentsService.remove(+id);
    return { code: 0, message: 'success', data };
  }
}