import { IsNotEmpty, IsString } from "class-validator";

export class RegisterBoothDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
