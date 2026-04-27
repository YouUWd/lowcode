import { Test, TestingModule } from '@nestjs/testing';
import { EngineService } from './engine.service';
import { KnexModule } from 'nest-knexjs';

describe('EngineService', () => {
  let service: EngineService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        KnexModule.forRoot({
          config: {
            client: 'better-sqlite3',
            connection: {
              filename: ':memory:',
            },
            useNullAsDefault: true,
          },
        }),
      ],
      providers: [EngineService],
    }).compile();

    service = module.get<EngineService>(EngineService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateTransformer', () => {
    it('should evaluate CONCAT function', () => {
      const result = service['evaluateTransformer'](
        "CONCAT('John', ' ', 'Doe')",
        {},
        [],
        {},
      );
      expect(result).toBe('John Doe');
    });

    it('should evaluate DICT_MAP function', () => {
      const dictionaries = {
        EMP_STATUS: { '1': '在职', '0': '离职' },
      };
      const result = service['evaluateTransformer'](
        "DICT_MAP('EMP_STATUS', '1')",
        {},
        [],
        dictionaries,
      );
      expect(result).toBe('在职');
    });

    it('should evaluate MASK_SENSITIVE function', () => {
      const result = service['evaluateTransformer'](
        "MASK_SENSITIVE('110101199001011234', 'ALL')",
        {},
        [],
        {},
      );
      expect(result).toBe('110****1234');
    });

    it('should evaluate ASSEMBLE_FRACTION function', () => {
      const result = service['evaluateTransformer'](
        'ASSEMBLE_FRACTION(50, 100)',
        {},
        [],
        {},
      );
      expect(result).toBe('50 / 100');
    });

    it('should evaluate ASSEMBLE_PERF_SUMMARY function', () => {
      const result = service['evaluateTransformer'](
        "ASSEMBLE_PERF_SUMMARY(95, 'A')",
        {},
        [],
        {},
      );
      expect(result).toBe('95 (A)');
    });
  });
});
