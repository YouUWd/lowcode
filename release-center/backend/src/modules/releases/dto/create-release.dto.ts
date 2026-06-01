import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReleaseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsNotEmpty()
  applicationId: number;

  @IsInt()
  @IsNotEmpty()
  environmentId: number;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsInt()
  @IsOptional()
  workflowInstanceId?: number;
}
