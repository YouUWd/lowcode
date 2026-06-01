import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  approvalRequired?: boolean;

  @IsString()
  @IsOptional()
  releaseWindow?: string;
}
