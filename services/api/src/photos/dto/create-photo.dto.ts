import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

const PHOTO_TYPES = ["single", "strip", "gif", "boomerang", "video"] as const;
const AI_STYLES = ["none", "cartoon", "neon", "vintage", "custom"] as const;
const PHOTO_STATUS = ["pending", "processing", "ready", "failed"] as const;

export type PhotoType = (typeof PHOTO_TYPES)[number];
export type AiStyle = (typeof AI_STYLES)[number];
export type PhotoStatus = (typeof PHOTO_STATUS)[number];

export class CreatePhotoDto {
  @IsEnum(PHOTO_TYPES)
  type!: PhotoType;

  @IsOptional()
  @IsEnum(AI_STYLES)
  aiStyle?: AiStyle;

  @IsString()
  @IsNotEmpty()
  objectKey!: string;

  @IsOptional()
  @IsEnum(PHOTO_STATUS)
  status?: PhotoStatus;
}
