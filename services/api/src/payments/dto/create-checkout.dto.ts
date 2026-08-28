import { IsString, IsNotEmpty, IsIn } from "class-validator";

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(["pro", "lifetime"])
  plan!: string;

  @IsString()
  @IsIn(["monthly", "yearly", "one-time"])
  interval!: string;
}
