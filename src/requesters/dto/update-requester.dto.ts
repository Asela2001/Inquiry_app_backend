import { PartialType } from '@nestjs/mapped-types';
import { CreateRequesterDto } from './create-requester.dto';

export class UpdateRequesterDto extends PartialType(CreateRequesterDto) {}
