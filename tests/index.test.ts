import { IronEnum } from '../mod'; // Adjust path as needed

// Define a sample set of variants
type MyVariants = {
  Foo: { x: number };
  Bar: string;
  Empty: undefined;
};

const MyEnum = IronEnum<MyVariants>();

describe('IronEnum', () => {
  test('creates variants with correct tags and values', () => {
    const fooValue = MyEnum.Foo({ x: 42 });
    expect(fooValue.unwrap()).toEqual(['Foo', { x: 42 }]);

    const barValue = MyEnum.Bar('hello');
    expect(barValue.unwrap()).toEqual(['Bar', 'hello']);

    const emptyValue = MyEnum.Empty();
    expect(emptyValue.unwrap()).toEqual(['Empty', undefined]);
  });

  test('match calls the correct callback for a variant', () => {
    const fooValue = MyEnum.Foo({ x: 42 });
    const result = fooValue.match({
      Foo: (val) => `Foo x = ${val.x}`,
      Bar: () => 'this should not be called',
      Empty: () => 'this should not be called',
      _: () => 'fallback'
    });
    expect(result).toBe('Foo x = 42');
  });

  test('match calls _ callback if no variant matches', () => {
    const barValue = MyEnum.Bar('test');
    const result = barValue.match({
      Foo: () => 'nope',
      Empty: () => 'nope',
      _: () => 'fallback called'
    });
    expect(result).toBe('fallback called');
  });

  test('if returns true and calls callback if variant matches', () => {
    const barValue = MyEnum.Bar('test string');
    const isBar = barValue.if.Bar((val) => {
      expect(val).toBe('test string');
      return 'Bar matched';
    });
    expect(isBar).toBe('Bar matched');
  });

  test('if returns false if variant does not match', () => {
    const fooValue = MyEnum.Foo({ x: 100 });
    const isBar = fooValue.if.Bar();
    expect(isBar).toBe(false);
  });

  test('ifNot returns true if variant does not match', () => {
    const emptyValue = MyEnum.Empty();
    const notFoo = emptyValue.ifNot.Foo(() => 'Not Foo!');
    expect(notFoo).toBe('Not Foo!');
  });

  test('ifNot returns false if variant matches', () => {
    const fooValue = MyEnum.Foo({ x: 100 });
    const notFoo = fooValue.ifNot.Foo();
    expect(notFoo).toBe(false);
  });

  test('matchAsync awaits the matched callback', async () => {
    const barValue = MyEnum.Bar('async test');
    const result = await barValue.matchAsync({
      Foo: async () => 'nope',
      Bar: async (val) => {
        expect(val).toBe('async test');
        return 'async bar result';
      },
      Empty: async () => 'nope',
      _: async () => 'fallback'
    });
    expect(result).toBe('async bar result');
  });

  test('matchAsync calls _ if no match found', async () => {
    const fooValue = MyEnum.Foo({ x: 99 });
    const result = await fooValue.matchAsync({
      Bar: async () => 'nope',
      Empty: async () => 'nope',
      _: async () => 'async fallback'
    });
    expect(result).toBe('async fallback');
  });
});