import { Test, TestingModule } from '@nestjs/testing';
import { RequestersController } from './requesters.controller';

describe('RequestersController', () => {
  let controller: RequestersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestersController],
    }).compile();

    controller = module.get<RequestersController>(RequestersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
