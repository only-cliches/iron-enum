import { describe, it, expect, jest } from '@jest/globals';

import { z, ZodError } from 'zod';
import { createZodEnum } from '../mod'; // Adjust this path
import { IronEnum, Result } from 'iron-enum';

// 1. Define the test schema
const StatusPayloads = {
  Loading: z.undefined(),
  Ready: z.object({ finishedAt: z.date() }),
  Error: z.object({ message: z.string(), code: z.number().optional() }),
};

describe('createZodEnum', () => {
  
  // 2. Create the ZodEnum instance
  const Status = createZodEnum(StatusPayloads);

  it('should create an object with self, schema, parse, and safeParse', () => {
    expect(Status).toHaveProperty('self');
    expect(Status).toHaveProperty('schema');
    expect(Status).toHaveProperty('parse');
    expect(Status).toHaveProperty('safeParse');
  });

  it('should ensure the "self" property is a working IronEnum factory', () => {
    const loading = Status.self.Loading();
    const ready = Status.self.Ready({ finishedAt: new Date() });

    expect(loading.tag).toBe('Loading');
    expect(ready.tag).toBe('Ready');
    expect(ready.payload).toHaveProperty('finishedAt');
  });

  describe('.parse()', () => {
    it('should correctly parse a valid payload (Ready)', () => {
      const date = new Date();
      const input = { Ready: { finishedAt: date } };
      const parsed = Status.parse(input);

      expect(parsed.tag).toBe('Ready');
      expect((parsed.payload as any).finishedAt).toBe(date);
    });

    it('should correctly parse a valid payload (Loading)', () => {
      const input = { Loading: undefined };
      const parsed = Status.parse(input);

      expect(parsed.tag).toBe('Loading');
      expect(parsed.payload).toBeUndefined();
    });

    it('should coerce types defined in Zod (e.g., string to date)', () => {
      // Re-define with Zod coercion for this test
      const CoercingPayloads = {
        Ready: z.object({ finishedAt: z.coerce.date() }),
      };
      const CoercingStatus = createZodEnum(CoercingPayloads);
      
      const dateStr = '2025-01-01T00:00:00.000Z';
      const input = { Ready: { finishedAt: dateStr } };
      const parsed = CoercingStatus.parse(input);

      expect(parsed.tag).toBe('Ready');
      expect(parsed.payload.finishedAt).toEqual(new Date(dateStr));
    });

    it('should throw a ZodError for an invalid payload', () => {
      // 'finishedAt' is missing
      const input = { Ready: { notFinishedAt: new Date() } };
      expect(() => Status.parse(input)).toThrow(ZodError);
    });

    it('should throw a ZodError for an unknown variant tag', () => {
      const input = { Unknown: { data: 'test' } };
      expect(() => Status.parse(input)).toThrow(ZodError);
    });

    it('should throw a ZodError for multiple keys (violating refine)', () => {
      const input = {
        Loading: undefined,
        Error: { message: 'too many keys' },
      };
      expect(() => Status.parse(input)).toThrow(ZodError);
    });

    it('should throw a ZodError for an empty object', () => {
      const input = {};
      expect(() => Status.parse(input)).toThrow(ZodError);
    });
  });

  describe('.safeParse()', () => {
    it('should return an Ok result for a valid payload', () => {
      const date = new Date();
      const input = { Ready: { finishedAt: date } };
      const result = Status.safeParse(input);

      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
      expect(result.unwrap().tag).toBe('Ready');
      expect((result.unwrap().payload as any).finishedAt).toBe(date);
    });

    it('should return an Err result for an invalid payload', () => {
      const input = { Error: { message: 12345 } }; // message should be string
      const result = Status.safeParse(input);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);
      
      // Check that the error is a ZodError
      let error: ZodError | undefined;
      try {
        result.unwrap();
      } catch (e) {
        error = e as ZodError;
      }
      expect(error).toBeInstanceOf(ZodError);
      expect(error?.issues[0].code).toBe('invalid_union');
    });

    it('should return an Err result for multiple keys', () => {
      const input = { Loading: undefined, Ready: { finishedAt: new Date() } };
      const result = Status.safeParse(input);

      expect(result.isOk()).toBe(false);
      expect(result.isErr()).toBe(true);

      const error = (result.tag == "Err" ? result.payload : undefined) as any;
      expect(error).toBeInstanceOf(ZodError);
      expect(error.issues[0].code).toBe('invalid_union');
    });
  });

  describe('.schema', () => {
    it('should be usable in other Zod schemas', () => {
      const UserSchema = z.object({
        id: z.string(),
        status: Status.schema,
      });

      const date = new Date();
      const validUser = {
        id: 'user-123',
        status: { Ready: { finishedAt: date } },
      };

      const invalidUser = {
        id: 'user-456',
        status: { Error: { message: 123 } }, // invalid payload
      };
      
      const parsedUser = UserSchema.parse(validUser);
      expect(parsedUser.status).toEqual({ Ready: { finishedAt: date } });

      expect(() => UserSchema.parse(invalidUser)).toThrow(ZodError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle a single-variant enum', () => {
      const Single = createZodEnum({
        Only: z.string(),
      });

      const valid = { Only: 'hello' };
      const invalid = { Also: 'world' };

      expect(Single.parse(valid).payload).toBe('hello');
      expect(() => Single.parse(invalid)).toThrow(ZodError);
    });

    it('should handle an empty enum', () => {
      const Empty = createZodEnum({});
      
      expect(() => Empty.parse({ a: 1 })).toThrow(ZodError);
      expect(Empty.safeParse({ a: 1 }).isErr()).toBe(true);
    });
  });
});
