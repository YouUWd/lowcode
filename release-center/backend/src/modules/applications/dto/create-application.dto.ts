import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  owner: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  yunxiaoPipelineId?: string;

  @IsString()
  @IsOptional()
  gitRepository?: string;

  @IsString()
  @IsOptional()
  namespace?: string;
}
