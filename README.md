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
    - [Unwrapping](#unwrapping)
    - [Serialization \& Deserialization](#serialization--deserialization)
  - [Advanced Examples](#advanced-examples)
    - [Using Classes and Complex Objects](#using-classes-and-complex-objects)
    - [Passing Enums as Arguments](#passing-enums-as-arguments)
    - [Inferring Data Types](#inferring-data-types)
  - [Option \& Result](#option--result)
    - [Option](#option)
    - [Result](#result)
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
  (unwrapped) => {
    // unwrapped is { Bar?: string, Empty?: undefined, Foo?: { x: number } }
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

### Unwrapping

To convert back to a simpler structure, you can call `unwrap()`. This returns an object with a single key matching the current variant.

```ts
const simpleEnum = IronEnum<{
  foo: { text: string };
  bar: { title: string };
}>();

const testValue = simpleEnum.foo({ text: "hello" });
const unwrapped = testValue.unwrap(); 
// unwrapped = { foo: { text: "hello" } }
```

### Serialization & Deserialization

Iron Enum values can be easily serialized to JSON (or sent across the network) by using `unwrap()`. To get them back into an Iron Enum value, you can call `parse` on the builder’s `_` property.

```ts
const simpleEnum = IronEnum<{
  foo: { text: string };
  bar: { title: string };
}>();

const originalValue = simpleEnum.foo({ text: "hello" });
const jsonValue = originalValue.unwrap(); 
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

### Option

Represents either a value (`Some`) or no value (`None`):

```ts
import { Option } from "iron-enum";

const NumberOption = Option<number>();
const someValue = NumberOption.Some(123);
const noneValue = NumberOption.None();

someValue.match({
  Some: (val) => console.log("Has value:", val), // 123
  None: () => console.log("No value")
});
```

### Result

Represents a successful outcome (`Ok`) or an error (`Err`):

```ts
import { Result } from "iron-enum";

const MyResult = Result<number, Error>();
const success = MyResult.Ok(42);
const failure = MyResult.Err(new Error("Something went wrong"));

success.match({
  Ok: (val) => console.log("Success with:", val),
  Err: (err) => console.error("Error:", err)
});
```

## Contributing

Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/only-cliches/iron-enum).

## License

This library is available under the [MIT license](./LICENSE). See the LICENSE file for details.