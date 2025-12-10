import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Category name required (e.g., Disciplinary)' })
  @IsString()
  @MinLength(3, { message: 'Name at least 3 chars' })
  categoryName: string;

  @IsOptional()
  @IsString()
  description?: string; // e.g., "Discipline issues and reports"
}
