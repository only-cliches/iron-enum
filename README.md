# Iron Enum for TypeScript

**Iron Enum** is a lightweight library that brings powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures—without needing complex pattern-matching libraries or large frameworks.

| [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |

## Features

- **Lightweight and Zero-Dependencies:** A minimal implementation (only 400 bytes!) that relies solely on TypeScript’s advanced type system and the ES6 `Proxy` object.
- **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
- **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
- **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
- **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
- **Asynchronous Patterns:** The `matchAsync` method lets you handle async operations within pattern matches, integrating seamlessly with `async/await`.
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
- Empty contains no data (use undefined).

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
  Foo: (val) => console.log("Foo with:", val.x), // val is { x: number }
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
const isFoo = fooValue.if.Foo((val) => {
  console.log("Yes, it's Foo with x =", val.x);
});

// If the variant is not Bar, log a message; if it is Bar, return false.
const notBar = fooValue.ifNot.Bar(() => {
  console.log("This is definitely not Bar!");
});
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

## Contributing

Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.

## License

This library is available under the MIT license. See the LICENSE file for details.