# Iron Enum

**Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.

| [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |

## Features

- **Lightweight and Zero-Dependencies:** A minimal implementation (only 700 bytes!) that leverages TypeScript’s advanced type system and the ES6 `Proxy` object.
- **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
- **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
- **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
- **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
- **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.

## Why Use This Library?

- **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
- **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
- **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
- **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
- **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.

## Basic Usage

### Defining Variants
Suppose you want an enum-like type with three variants:
- Foo contains an object with an x field.
- Bar contains a string.
- Empty contains no data.

You can define these variants as follows:

```ts
import { IronEnum } from "iron-enum";

type MyVariants = {
  Foo: { x: number };
  Bar: string;
  Empty: undefined;
};

const MyEnum = IronEnum<MyVariants>();
```

### Creating Values
To create values, simply call the variant functions:

```ts
const fooValue = MyEnum.Foo({ x: 42 });
const barValue = MyEnum.Bar("Hello");
const emptyValue = MyEnum.Empty();
```
Each call returns a tagged object with methods to inspect or match the variant.

### Pattern Matching
Use match to handle each variant:
```ts
fooValue.match({
  Foo: (val) => console.log("Foo with:", val), // val is { x: number }
  Bar: (val) => console.log("Bar with:", val),
  Empty: () => console.log("It's empty"),
  _: () => console.log("No match") // Optional fallback
});
```
The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.

### Conditional Checks
You can quickly check the current variant with if and ifNot:

```ts
// If the variant is Foo, log a message and return true; otherwise return false.
// typeof isFoo == boolean
const isFoo = fooValue.if.Foo((val) => {
  console.log("Yes, it's Foo with x =", val.x);
});

// If the variant is not Bar, log a message; if it is Bar, return false.
// typeof notBar == boolean
const notBar = fooValue.ifNot.Bar(() => {
  console.log("This is definitely not Bar!");
});

// Values can be returned through the function and will be inferred.
// typeof notBar == string
const notBar = fooValue.ifNot.Bar(() => {
  console.log("This is definitely not Bar!");
  return "not bar for sure";
});

// A second callback can be used for else conditions for both .if and .ifNot:
// Return types are inferred, without return types in the functions the default return is boolean.
// typeof isFooElse == string | number;
const isFooElse = fooValue.if.Bar((barValue) => {
  return barValue;
}, (unwrapResult) => {
  return 0;
})

// Callback is optional, useful for if statements
if(fooValue.ifNot.Bar()) {
  // not bar 
}
```
Both methods return a boolean or the callback result, making conditional logic concise and expressive.

### Asynchronous Matching
When dealing with asynchronous callbacks, use matchAsync:
```ts
const matchedResult = await barValue.matchAsync({
  Foo: async (val) => { /* ... */ },
  Bar: async (val) => { 
    const result = await fetchSomeData(val);
    return result;
  },
  Empty: async () => {
    await doSomethingAsync();
  },
  _: async () => "default value"
});

console.log("Async match result:", matchedResult);

```
The matchAsync method returns a Promise that resolves with the callback’s return value.

### Unwrapping
In the event that you need to access the data directly, you can use the unwrap method.

```ts
const simpleEnum = IronEnum<{
  foo: { text: string },
  bar: { title: string }
}>();

const testValue = simpleEnum.foo({text: "hello"});

// typeof unwrapped = {foo?: { text: string }, bar?: { title: string }}
const unwrapped = testValue.unwrap();
console.log(unwrapped) // {foo: {text: "hello"}}
```

### Serialization & Deserialization
```ts
const simpleEnum = IronEnum<{
  foo: { text: string },
  bar: { title: string }
}>();

const testValue = simpleEnum.foo({text: "hello"});

const jsonValue = testValue.unwrap();
// jsonValue can be sent across any interface that supports JSON.
const parsedvalue = simpleEnum.parse(jsonValue);
// parseValue is now an `simpleEnum` type.
```

### Classese and nesting
Enums can contain classes, objects or even other enums.
```ts
const testEnum = IronEnum<{foo: string, bar: string}>();
class SimpleClass { /* .. */ }

const complexEnum = IronEnum<{
  test: typeof testEnum.typeOf,
  aClass: typeof SimpleClass,
  nested: {
    foo: string,
    bar: string,
    test: typeof testEnum.typeOf,
    array: {someProperty: string, anotherProperty: number}[]
  }
}>();
```

## Option & Result
The library contains straightforward implmentations of Rust's `Option` and `Result` types.
```ts
import { Option, Result } from "iron-enum";

const myResult = Result<{Ok: boolean, Err: string}>();

const ok = myResult.Ok(true);
ok.match({
  Ok: (value) => {
   console.log(value) // true;
  },
  _: () => { /* .. */ }
});

const myOption = Option<number>();

const optNum = myOption.Some(22);

optNum.match({
  Some: (val) => {
    console.log(val) // 22;
  },
  None: () => { /* .. */ }
})

```

## Contributing

Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.

## License

This library is available under the MIT license. See the LICENSE file for details.