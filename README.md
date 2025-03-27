# Iron Enum

[![GitHub Repo stars](https://img.shields.io/github/stars/only-cliches/iron-enum)](https://github.com/only-cliches/iron-enum)
[![NPM Version](https://img.shields.io/npm/v/iron-enum)](https://www.npmjs.com/package/iron-enum)
[![JSR Version](https://img.shields.io/jsr/v/%40onlycliches/iron-enum)](https://jsr.io/@onlycliches/iron-enum)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/iron-enum)](https://pkg-size.dev/iron-enum)

**Iron Enum** is a lightweight library that brings [Rust-like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) tagged enums (also called algebraic data types or discriminated unions) to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — all with TypeScript’s strong type-checking at compile time.

[Try Iron Enum Now - Free StackBlitz Sandbox](https://stackblitz.com/edit/iron-enum-sandbox?file=src%2Fmain.ts)

## Table of Contents
- [Iron Enum](#iron-enum)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Why Use This Library?](#why-use-this-library)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
    - [Defining Variants](#defining-variants)
    - [Creating Values](#creating-values)
    - [Pattern Matching](#pattern-matching)
    - [Conditional Checks (`if` / `ifNot`)](#conditional-checks-if--ifnot)
    - [Async Pattern Matching](#async-pattern-matching)
    - [Serialization \& Deserialization](#serialization--deserialization)
  - [Advanced Examples](#advanced-examples)
    - [Using Classes and Complex Objects](#using-classes-and-complex-objects)
    - [Passing Enums as Arguments](#passing-enums-as-arguments)
    - [Inferring Data Types](#inferring-data-types)
  - [Option \& Result](#option--result)
    - [Option](#option)
      - [Creating Options](#creating-options)
      - [Unwrap](#unwrap)
      - [Unwrap with fallback](#unwrap-with-fallback)
      - [Convert to Result](#convert-to-result)
      - [Matching](#matching)
    - [Result](#result)
      - [Creating Results](#creating-results)
      - [Unwrap](#unwrap-1)
      - [Unwrap with fallback](#unwrap-with-fallback-1)
      - [Convert to Option](#convert-to-option)
      - [Matching](#matching-1)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- **Lightweight & Zero Dependencies:** A minimal, dependency-free implementation (>1k bytes) leveraging TypeScript’s advanced type system and Proxies.
- **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, enforced at compile time by TypeScript.
- **Powerful Pattern Matching:** Intuitive `match` / `matchAsync` methods eliminate the need for brittle switch statements or nested conditionals.
- **Conditional Checks:** Minimal overhead for checking variants (via `if` / `ifNot`) in a readable style.
- **Supports "Empty" Variants:** Easily represent states like `None` or `Empty` by defining a variant with `undefined`.
- **Reduced Boilerplate:** The library handles the “discriminant” under the hood, cutting down on repetitive code.

## Why Use This Library?

- **Improved Code Clarity:** Handle your logic in one place using pattern matching, reducing scattered if-else blocks and clarifying your app’s possible states.
- **Type Safety:** No more unverified type casts. TypeScript ensures that once you branch on a variant, you get the correct data type without extra checks.
- **Maintainability & Scalability:** Adding or removing variants is simple—update your variant definitions, and TypeScript will highlight where changes are needed.
- **Functional Style:** Iron Enum fits perfectly in FP-oriented codebases, or wherever you want to avoid `class`-based hierarchies and large frameworks.
- **Great for Error Handling & State Management:** Pattern matching simplifies code that handles many possible outcomes.

## Installation

Install via npm or yarn:

```bash
npm install iron-enum
# or
yarn add iron-enum
```

Then import and start defining your enums:

```ts
import { IronEnum } from "iron-enum";
```

## Basic Usage

### Defining Variants

Suppose you want an enum-like type with three variants:
- **Foo** contains an object `{ x: number }`
- **Bar** contains a string
- **Empty** contains no data (i.e., `undefined`)

```ts
import { IronEnum } from "iron-enum";

// 1. Define a record of variant keys to their associated data types
type MyVariants = {
  Foo: { x: number };
  Bar: string;
  Empty: undefined;
};

// 2. Construct an enum builder using IronEnum
const MyEnum = IronEnum<MyVariants>();
```

### Creating Values

You can create new enum values by calling the builder’s variant methods:

```ts
const fooValue = MyEnum.Foo({ x: 42 });
const barValue = MyEnum.Bar("Hello");
const emptyValue = MyEnum.Empty();
```

Each call returns a tagged object with helpful methods (e.g., `match`, `if`, `ifNot`, etc.).

### Pattern Matching

Handle each variant cleanly with `match`. You can also provide a fallback (`_`) if you wish:

```ts
fooValue.match({
  Foo: (val) => {
    // val is { x: number }
    console.log("Foo with:", val.x);
  },
  Bar: (val) => {
    console.log("Bar with:", val);
  },
  Empty: () => {
    console.log("It's empty!");
  },
  _: () => {
    // Optional fallback if you didn't specify all variants
    console.log("No match found!");
  }
});
```

### Conditional Checks (`if` / `ifNot`)

`if` and `ifNot` let you quickly test if a variant matches (or doesn’t match) a specific key, and optionally run callbacks.

```ts
// 1. Returns true/false by default
const isFoo = fooValue.if.Foo(); 
// isFoo === true if fooValue.tag === 'Foo', otherwise false

// 2. Optional callbacks
fooValue.if.Foo(
  (val) => { // called if enum is "Foo" variant.
    console.log("Yes, it's Foo:", val.x);
    return "someReturnValue";
  }, // else:
  (json) => {
    // json is { Bar?: string, Empty?: undefined, Foo?: { x: number } }
    return "elseReturnValue";
  }
);
// The return value is inferred. If you provide returns, you'll get that union type back.

fooValue.ifNot.Bar(() => {
  console.log("Definitely not a Bar variant!");
});
```

### Async Pattern Matching

When working with async logic, use `matchAsync`. Each branch callback should return a `Promise` (or use `async`):

```ts
const result = await barValue.matchAsync({
  Foo: async (val) => {
    // Handle Foo asynchronously
    return await fetchSomeData(val);
  },
  Bar: async (val) => {
    // Handle Bar asynchronously
    return "barValue resolved";
  },
  Empty: async () => {
    await doSomethingAsync();
    return "Handled Empty";
  },
  _: async () => "Default fallback"
});
 // return type is inferred from match arm functions
console.log("Async match result:", result);
```

### Serialization & Deserialization

Iron Enum values can be easily serialized to JSON (or sent across the network) by using `toJSON()`. To get them back into an Iron Enum value, you can call `parse` on the builder’s `_` property.

```ts
const simpleEnum = IronEnum<{
  foo: { text: string };
  bar: { title: string };
}>();

const originalValue = simpleEnum.foo({ text: "hello" });
const jsonValue = originalValue.toJSON(); 
// jsonValue is now { foo: { text: "hello" } }

const parsedValue = simpleEnum._.parse(jsonValue);
// parsedValue is again a fully featured Iron Enum variant 
parsedValue.match({
  foo: (val) => console.log("Parsed back successfully:", val),
  _: () => {}
});
```

## Advanced Examples

### Using Classes and Complex Objects

Iron Enum variants can contain anything: classes, nested objects, arrays, or even other Iron Enums.

```ts
class SimpleClass {
  constructor(public name: string) {}
}

const nestedEnum = IronEnum<{ alpha: number; beta: string }>();

const complexEnum = IronEnum<{
  test: typeof nestedEnum._.typeOf;
  aClass: SimpleClass;
  nestedData: {
    foo: string;
    bar: string;
    array: { someProperty: string; anotherProperty: number }[];
  };
}>();

const myInstance = complexEnum.aClass(new SimpleClass("TestName"));
const myNested = complexEnum.test(nestedEnum.alpha(42));
```

### Passing Enums as Arguments

One of the biggest perks is that you can pass these enums around, and the type system will protect you from invalid usage:

```ts
const testEnum = IronEnum<{ foo: string; bar: string }>();

function handleTestEnum(value: typeof testEnum._.typeOf) {
  // Now we can pattern-match safely
  return value.match({
    foo: (val) => `Got foo: ${val}`,
    bar: (val) => `Got bar: ${val}`,
  });
}

const result = handleTestEnum(testEnum.foo("Hello!"));
console.log(result); // "Got foo: Hello!"
```

### Inferring Data Types

TypeScript automatically infers the data type for each branch when you match on an Iron Enum. You can also create custom types to extract payload information:

```ts
const myEnum = IronEnum<{ Foo: { x: number }; Bar: string }>();
const fooValue = myEnum.Foo({ x: 42 });

type InferFooDataType<X extends typeof myEnum._.typeOf> =
  X extends { tag: "Foo"; data: infer Payload }
    ? Payload
    : never;

type Inferred = InferFooDataType<typeof fooValue>;
// Inferred = { x: number } 
```

## Option & Result

Iron Enum includes convenient implementations for two common patterns: `Option` and `Result`.
Absolutely! Here’s a set of clear and practical usage examples for the `Option` and `Result` types that you can include in your README to help users understand how to use your library effectively.

---

### Option

The `Option` type is useful for representing values that may or may not exist.

#### Creating Options

```ts
const NumberOption = Option<number>();

const some = NumberOption.Some(42);
const none = NumberOption.None();
```

#### Unwrap

```ts
some.unwrap(); // 42
none.unwrap(); // ❌ throws: Called .unwrap() on an Option.None enum!
```

#### Unwrap with fallback

```ts
some.unwrap_or(100);       // 42
none.unwrap_or(100);       // 100

some.unwrap_or_else(() => 999); // 42
none.unwrap_or_else(() => 999); // 999
```

#### Convert to Result

```ts
const OkOrErr = some.ok_or("Not found");   // Ok(42)
const ErrRes = none.ok_or("Not found");    // Err("Not found")

const OkOrErrLazy = some.ok_or_else(() => "fail"); // Ok(42)
const ErrResLazy = none.ok_or_else(() => "fail");  // Err("fail")
```

#### Matching

```ts
some.match({
    Some: (val) => `Value is ${val}`,
    None: () => "No value"
}); // "Value is 42"

none.match({
    Some: (val) => `Value is ${val}`,
    None: () => "No value"
}); // "No value"
```

---

### Result

The `Result` type is useful for returning either a success value (`Ok`) or an error (`Err`).

#### Creating Results

```ts
const NumResult = Result<number, string>();

const ok = NumResult.Ok(123);
const err = NumResult.Err("Something went wrong");
```

#### Unwrap

```ts
ok.unwrap(); // 123
err.unwrap(); // ❌ throws: Called .unwrap() on a Result.Err enum!
```

#### Unwrap with fallback

```ts
ok.unwrap_or(0);        // 123
err.unwrap_or(0);       // 0

ok.unwrap_or_else(() => 999);   // 123
err.unwrap_or_else(() => 999);  // 999
```

#### Convert to Option

```ts
const SomeOpt = ok.ok();   // Some(123)
const NoneOpt = err.ok();  // None()
```

#### Matching

```ts
ok.match({
    Ok: (val) => `Success: ${val}`,
    Err: (e) => `Failure: ${e}`
}); // "Success: 123"

err.match({
    Ok: (val) => `Success: ${val}`,
    Err: (e) => `Failure: ${e}`
}); // "Failure: Something went wrong"
```

## Contributing

Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/only-cliches/iron-enum).

## License

This library is available under the [MIT license](./LICENSE). See the LICENSE file for details.