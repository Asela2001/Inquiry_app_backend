import { Test, TestingModule } from '@nestjs/testing';
import { RequestersService } from './requesters.service';

describe('RequestersService', () => {
  let service: RequestersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestersService],
    }).compile();

    service = module.get<RequestersService>(RequestersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
