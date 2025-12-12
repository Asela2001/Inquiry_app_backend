import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateRankDto {
  @IsNotEmpty({ message: 'Rank name required (e.g., Captain)' })
  @IsString()
  @MinLength(3, { message: 'Name at least 3 chars' })
  rankName: string;

  @IsOptional()
  @IsString()
  description?: string; // e.g., "Mid-level officer"
}
