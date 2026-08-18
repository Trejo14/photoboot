import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsObject()
  themeConfig?: Record<string, unknown>;
}
