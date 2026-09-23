import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Transform } from "class-transformer";
export class EnquiryDto {
  @IsOptional() @IsString() @MaxLength(1000) address?: string;
  @IsOptional() @IsString() @MaxLength(150) district?: string;
  @IsString()
  @Matches(/^(?:|[\s\S]{2,100})$/)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name!: string;
  @IsString() @Matches(/^(?:|[+0-9 ()-]{10,20})$/) phone!: string;
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
  @IsString() @MaxLength(100) product!: string;
  @IsString() @MaxLength(2000) message!: string;
  @IsBoolean() @Equals(true) consent!: boolean;
}
