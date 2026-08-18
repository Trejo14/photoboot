import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

const PHOTO_TYPES = ["single", "strip", "gif", "boomerang", "video"] as const;
const AI_STYLES = ["none", "cartoon", "neon", "vintage", "custom"] as const;

export type PhotoType = (typeof PHOTO_TYPES)[number];
export type AiStyle = (typeof AI_STYLES)[number];

export class PresignPhotoDto {
  @IsEnum(PHOTO_TYPES)
  type!: PhotoType;

  @IsOptional()
  @IsEnum(AI_STYLES)
  aiStyle?: AiStyle;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsNumber()
  @Min(1)
  size!: number;
}
