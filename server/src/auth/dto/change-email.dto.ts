import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  @MaxLength(254)
  newEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;
}