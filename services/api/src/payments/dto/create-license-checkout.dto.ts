import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class CreateLicenseCheckoutDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn(["pro", "lifetime"])
  plan!: string;

  @IsOptional()
  @IsString()
  @IsIn(["monthly", "yearly"])
  interval?: string;
}
