/**
 * # Iron Enum
 * 
 * **Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * ## Features
 * 
 * - **Lightweight and Zero-Dependencies:** A minimal implementation (only 650 bytes!) that leverages TypeScript’s advanced type system and the ES6 `Proxy` object.
 * - **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
 * - **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
 * - **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
 * - **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
 * - **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.
 * 
 * ## Why Use This Library?
 * 
 * - **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
 * - **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
 * - **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
 * - **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
 * - **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.
 * 
 * ## Basic Usage
 * 
 * ### Defining Variants
 * Suppose you want an enum-like type with three variants:
 * - Foo contains an object with an x field.
 * - Bar contains a string.
 * - Empty contains no data.
 * 
 * You can define these variants as follows:
 * 
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * type MyVariants = {
 *   Foo: { x: number };
 *   Bar: string;
 *   Empty: undefined;
 * };
 * 
 * const MyEnum = IronEnum<MyVariants>();
 * ```
 * 
 * ### Creating Values
 * To create values, simply call the variant functions:
 * 
 * ```ts
 * const fooValue = MyEnum.Foo({ x: 42 });
 * const barValue = MyEnum.Bar("Hello");
 * const emptyValue = MyEnum.Empty();
 * ```
 * Each call returns a tagged object with methods to inspect or match the variant.
 * 
 * ### Pattern Matching
 * Use match to handle each variant:
 * ```ts
 * fooValue.match({
 *   Foo: (val) => console.log("Foo with:", val), // val is { x: number }
 *   Bar: (val) => console.log("Bar with:", val),
 *   Empty: () => console.log("It's empty"),
 *   _: () => console.log("No match") // Optional fallback
 * });
 * ```
 * The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.
 * 
 * ### Conditional Checks
 * You can quickly check the current variant with if and ifNot:
 * 
 * ```ts
 * // If the variant is Foo, log a message and return true; otherwise return false.
 * // typeof isFoo == boolean
 * const isFoo = fooValue.if.Foo((val) => {
 *   console.log("Yes, it's Foo with x =", val.x);
 * });
 * 
 * // If the variant is not Bar, log a message; if it is Bar, return false.
 * // typeof notBar == boolean
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 * });
 * 
 * // Values can be returned through the function and will be inferred.
 * // typeof notBar == string
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 *   return "not bar for sure";
 * });
 * 
 * // A second callback can be used for else conditions for both .if and .ifNot:
 * // Return types are inferred, without return types in the functions the default return is boolean.
 * // typeof isFooElse == string | number;
 * const isFooElse = fooValue.if.Bar((barValue) => {
 *   return barValue;
 * }, (unwrapResult) => {
 *   return 0;
 * })
 * 
 * // Callback is optional, useful for if statements
 * if(fooValue.ifNot.Bar()) {
 *   // not bar 
 * }
 * ```
 * Both methods return a boolean or the callback result, making conditional logic concise and expressive.
 * 
 * ### Asynchronous Matching
 * When dealing with asynchronous callbacks, use matchAsync:
 * ```ts
 * const matchedResult = await barValue.matchAsync({
 *   Foo: async (val) => { /* ... *\/ },
 *   Bar: async (val) => { 
 *     const result = await fetchSomeData(val);
 *     return result;
 *   },
 *   Empty: async () => {
 *     await doSomethingAsync();
 *   },
 *   _: async () => "default value"
 * });
 * 
 * console.log("Async match result:", matchedResult);
 * 
 * ```
 * The matchAsync method returns a Promise that resolves with the callback’s return value.
 * 
 * ### Unwrapping
 * In the event that you need to access the data directly, you can use the unwrap method.
 * 
 * ```ts
 * const simpleEnum = IronEnum<{
 *   foo: { text: string },
 *   bar: { title: string }
 * }>();
 * 
 * const testValue = simpleEnum.foo({text: "hello"});
 * 
 * // typeof unwrapped = ["foo", {text: string}] | ["bar", {title: string}]
 * const unwrapped = testValue.unwrap();
 * ```
 * 
 * ### Classese and nesting
 * Enums can contain classes, objects or even other enums.
 * ```ts
 * const testEnum = IronEnum<{foo: string, bar: string}>();
 * class SimpleClass { /* .. *\/ }
 * 
 * const complexEnum = IronEnum<{
 *   test: typeof testEnum.typeOf,
 *   aClass: typeof SimpleClass,
 *   nested: {
 *     foo: string,
 *     bar: string,
 *     test: typeof testEnum.typeOf,
 *     array: {someProperty: string, anotherProperty: number}[]
 *   }
 * }>();
 * ```
 * 
 * ## Option & Result
 * The library contains straightforward implmentations of Rust's `Option` and `Result` types.
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const myResult = Result<{Ok: boolean, Err: string}>();
 * 
 * const ok = myResult.Ok(true);
 * ok.match({
 *   Ok: (value) => {
 *    console.log(value) // true;
 *   },
 *   _: () => { /* .. *\/ }
 * });
 * 
 * const myOption = Option<number>();
 * 
 * const optNum = myOption.Some(22);
 * 
 * optNum.match({
 *   Some: (val) => {
 *     console.log(val) // 22;
 *   },
 *   None: () => { /* .. *\/ }
 * })
 * 
 * ```
 * 
 * ## Contributing
 * 
 * Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.
 * 
 * ## License
 * 
 * This library is available under the MIT license. See the LICENSE file for details.
 * */


/**
 * # Iron Enum
 * 
 * **Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * ## Features
 * 
 * - **Lightweight and Zero-Dependencies:** A minimal implementation (only 650 bytes!) that relies solely on TypeScript’s advanced type system and the ES6 `Proxy` object.
 * - **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
 * - **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
 * - **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
 * - **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
 * - **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.
 * 
 * ## Why Use This Library?
 * 
 * - **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
 * - **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
 * - **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
 * - **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
 * - **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.
 * 
 * ## Basic Usage
 * 
 * ### Defining Variants
 * Suppose you want an enum-like type with three variants:
 * - Foo contains an object with an x field.
 * - Bar contains a string.
 * - Empty contains no data.
 * 
 * You can define these variants as follows:
 * 
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * type MyVariants = {
 *   Foo: { x: number };
 *   Bar: string;
 *   Empty: undefined;
 * };
 * 
 * const MyEnum = IronEnum<MyVariants>();
 * ```
 * 
 * ### Creating Values
 * To create values, simply call the variant functions:
 * 
 * ```ts
 * const fooValue = MyEnum.Foo({ x: 42 });
 * const barValue = MyEnum.Bar("Hello");
 * const emptyValue = MyEnum.Empty();
 * ```
 * Each call returns a tagged object with methods to inspect or match the variant.
 * 
 * ### Pattern Matching
 * Use match to handle each variant:
 * ```ts
 * fooValue.match({
 *   Foo: (val) => console.log("Foo with:", val), // val is { x: number }
 *   Bar: (val) => console.log("Bar with:", val),
 *   Empty: () => console.log("It's empty"),
 *   _: () => console.log("No match") // Optional fallback
 * });
 * ```
 * The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.
 * 
 * ### Conditional Checks
 * You can quickly check the current variant with if and ifNot:
 * 
 * ```ts
 * // If the variant is Foo, log a message and return true; otherwise return false.
 * // typeof isFoo == boolean
 * const isFoo = fooValue.if.Foo((val) => {
 *   console.log("Yes, it's Foo with x =", val.x);
 * });
 * 
 * // If the variant is not Bar, log a message; if it is Bar, return false.
 * // typeof notBar == boolean
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 * });
 * 
 * // Values can be returned through the function and will be inferred.
 * // typeof notBar == string
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 *   return "not bar for sure";
 * });
 * 
 * // A second callback can be used for else conditions for both .if and .ifNot:
 * // Return types are inferred, without return types in the functions the default return is boolean.
 * // typeof isFooElse == string | number;
 * const isFooElse = fooValue.if.Bar((barValue) => {
 *   return barValue;
 * }, (unwrapResult) => {
 *   return 0;
 * })
 * 
 * // Callback is optional, useful for if statements
 * if(fooValue.ifNot.Bar()) {
 *   // not bar 
 * }
 * ```
 * Both methods return a boolean or the callback result, making conditional logic concise and expressive.
 * 
 * ### Asynchronous Matching
 * When dealing with asynchronous callbacks, use matchAsync:
 * ```ts
 * const matchedResult = await barValue.matchAsync({
 *   Foo: async (val) => { /* ... *\/ },
 *   Bar: async (val) => { 
 *     const result = await fetchSomeData(val);
 *     return result;
 *   },
 *   Empty: async () => {
 *     await doSomethingAsync();
 *   },
 *   _: async () => "default value"
 * });
 * 
 * console.log("Async match result:", matchedResult);
 * 
 * ```
 * The matchAsync method returns a Promise that resolves with the callback’s return value.
 * 
 * ### Unwrapping
 * In the event that you need to access the data directly, you can use the unwrap method.
 * 
 * ```ts
 * const simpleEnum = IronEnum<{
 *   foo: { text: string },
 *   bar: { title: string }
 * }>();
 * 
 * const testValue = simpleEnum.foo({text: "hello"});
 * 
 * // typeof unwrapped = ["foo", {text: string}] | ["bar", {title: string}]
 * const unwrapped = testValue.unwrap();
 * ```
 * 
 * ### Classese and nesting
 * Enums can contain classes, objects or even other enums.
 * ```ts
 * const testEnum = IronEnum<{foo: string, bar: string}>();
 * class SimpleClass { /* .. *\/ }
 * 
 * const complexEnum = IronEnum<{
 *   test: typeof testEnum.typeOf,
 *   aClass: typeof SimpleClass,
 *   nested: {
 *     foo: string,
 *     bar: string,
 *     test: typeof testEnum.typeOf,
 *     array: {someProperty: string, anotherProperty: number}[]
 *   }
 * }>();
 * ```
 * 
 * ## Option & Result
 * The library contains straightforward implmentations of Rust's `Option` and `Result` types.
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const myResult = Result<{Ok: boolean, Err: string}>();
 * 
 * const ok = myResult.Ok(true);
 * ok.match({
 *   Ok: (value) => {
 *    console.log(value) // true;
 *   },
 *   _: () => { /* .. *\/ }
 * });
 * 
 * const myOption = Option<number>();
 * 
 * const optNum = myOption.Some(22);
 * 
 * optNum.match({
 *   Some: (val) => {
 *     console.log(val) // 22;
 *   },
 *   None: () => { /* .. *\/ }
 * })
 * 
 * ```
 * 
 * ## Contributing
 * 
 * Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.
 * 
 * ## License
 * 
 * This library is available under the MIT license. See the LICENSE file for details.
 * */


/**
 * # Iron Enum
 * 
 * **Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * ## Features
 * 
 * - **Lightweight and Zero-Dependencies:** A minimal implementation (only 650 bytes!) that relies solely on TypeScript’s advanced type system and the ES6 `Proxy` object.
 * - **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
 * - **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
 * - **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
 * - **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
 * - **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.
 * 
 * ## Why Use This Library?
 * 
 * - **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
 * - **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
 * - **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
 * - **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
 * - **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.
 * 
 * ## Basic Usage
 * 
 * ### Defining Variants
 * Suppose you want an enum-like type with three variants:
 * - Foo contains an object with an x field.
 * - Bar contains a string.
 * - Empty contains no data.
 * 
 * You can define these variants as follows:
 * 
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * type MyVariants = {
 *   Foo: { x: number };
 *   Bar: string;
 *   Empty: undefined;
 * };
 * 
 * const MyEnum = IronEnum<MyVariants>();
 * ```
 * 
 * ### Creating Values
 * To create values, simply call the variant functions:
 * 
 * ```ts
 * const fooValue = MyEnum.Foo({ x: 42 });
 * const barValue = MyEnum.Bar("Hello");
 * const emptyValue = MyEnum.Empty();
 * ```
 * Each call returns a tagged object with methods to inspect or match the variant.
 * 
 * ### Pattern Matching
 * Use match to handle each variant:
 * ```ts
 * fooValue.match({
 *   Foo: (val) => console.log("Foo with:", val), // val is { x: number }
 *   Bar: (val) => console.log("Bar with:", val),
 *   Empty: () => console.log("It's empty"),
 *   _: () => console.log("No match") // Optional fallback
 * });
 * ```
 * The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.
 * 
 * ### Conditional Checks
 * You can quickly check the current variant with if and ifNot:
 * 
 * ```ts
 * // If the variant is Foo, log a message and return true; otherwise return false.
 * // typeof isFoo == boolean
 * const isFoo = fooValue.if.Foo((val) => {
 *   console.log("Yes, it's Foo with x =", val.x);
 * });
 * 
 * // If the variant is not Bar, log a message; if it is Bar, return false.
 * // typeof notBar == boolean
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 * });
 * 
 * // Values can be returned through the function and will be inferred.
 * // typeof notBar == string
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 *   return "not bar for sure";
 * });
 * 
 * // A second callback can be used for else conditions for both .if and .ifNot:
 * // Return types are inferred, without return types in the functions the default return is boolean.
 * // typeof isFooElse == string | number;
 * const isFooElse = fooValue.if.Bar((barValue) => {
 *   return barValue;
 * }, (unwrapResult) => {
 *   return 0;
 * })
 * 
 * // Callback is optional, useful for if statements
 * if(fooValue.ifNot.Bar()) {
 *   // not bar 
 * }
 * ```
 * Both methods return a boolean or the callback result, making conditional logic concise and expressive.
 * 
 * ### Asynchronous Matching
 * When dealing with asynchronous callbacks, use matchAsync:
 * ```ts
 * const matchedResult = await barValue.matchAsync({
 *   Foo: async (val) => { /* ... *\/ },
 *   Bar: async (val) => { 
 *     const result = await fetchSomeData(val);
 *     return result;
 *   },
 *   Empty: async () => {
 *     await doSomethingAsync();
 *   },
 *   _: async () => "default value"
 * });
 * 
 * console.log("Async match result:", matchedResult);
 * 
 * ```
 * The matchAsync method returns a Promise that resolves with the callback’s return value.
 * 
 * ### Unwrapping
 * In the event that you need to access the data directly, you can use the unwrap method.
 * 
 * ```ts
 * const simpleEnum = IronEnum<{
 *   foo: { text: string },
 *   bar: { title: string }
 * }>();
 * 
 * const testValue = simpleEnum.foo({text: "hello"});
 * 
 * // typeof unwrapped = ["foo", {text: string}] | ["bar", {title: string}]
 * const unwrapped = testValue.unwrap();
 * ```
 * 
 * ### Classese and nesting
 * Enums can contain classes, objects or even other enums.
 * ```ts
 * const testEnum = IronEnum<{foo: string, bar: string}>();
 * class SimpleClass { /* .. *\/ }
 * 
 * const complexEnum = IronEnum<{
 *   test: typeof testEnum.typeOf,
 *   aClass: typeof SimpleClass,
 *   nested: {
 *     foo: string,
 *     bar: string,
 *     test: typeof testEnum.typeOf,
 *     array: {someProperty: string, anotherProperty: number}[]
 *   }
 * }>();
 * ```
 * 
 * ## Option & Result
 * The library contains straightforward implmentations of Rust's `Option` and `Result` types.
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const myResult = Result<{Ok: boolean, Err: string}>();
 * 
 * const ok = myResult.Ok(true);
 * ok.match({
 *   Ok: (value) => {
 *    console.log(value) // true;
 *   },
 *   _: () => { /* .. *\/ }
 * });
 * 
 * const myOption = Option<number>();
 * 
 * const optNum = myOption.Some(22);
 * 
 * optNum.match({
 *   Some: (val) => {
 *     console.log(val) // 22;
 *   },
 *   None: () => { /* .. *\/ }
 * })
 * 
 * ```
 * 
 * ## Contributing
 * 
 * Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.
 * 
 * ## License
 * 
 * This library is available under the MIT license. See the LICENSE file for details.
 * */


/**
 * # Iron Enum
 * 
 * **Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * ## Features
 * 
 * - **Lightweight and Zero-Dependencies:** A minimal implementation (only 650 bytes!) that relies solely on TypeScript’s advanced type system and the ES6 `Proxy` object.
 * - **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
 * - **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
 * - **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
 * - **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
 * - **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.
 * 
 * ## Why Use This Library?
 * 
 * - **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
 * - **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
 * - **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
 * - **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
 * - **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.
 * 
 * ## Basic Usage
 * 
 * ### Defining Variants
 * Suppose you want an enum-like type with three variants:
 * - Foo contains an object with an x field.
 * - Bar contains a string.
 * - Empty contains no data.
 * 
 * You can define these variants as follows:
 * 
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * type MyVariants = {
 *   Foo: { x: number };
 *   Bar: string;
 *   Empty: undefined;
 * };
 * 
 * const MyEnum = IronEnum<MyVariants>();
 * ```
 * 
 * ### Creating Values
 * To create values, simply call the variant functions:
 * 
 * ```ts
 * const fooValue = MyEnum.Foo({ x: 42 });
 * const barValue = MyEnum.Bar("Hello");
 * const emptyValue = MyEnum.Empty();
 * ```
 * Each call returns a tagged object with methods to inspect or match the variant.
 * 
 * ### Pattern Matching
 * Use match to handle each variant:
 * ```ts
 * fooValue.match({
 *   Foo: (val) => console.log("Foo with:", val), // val is { x: number }
 *   Bar: (val) => console.log("Bar with:", val),
 *   Empty: () => console.log("It's empty"),
 *   _: () => console.log("No match") // Optional fallback
 * });
 * ```
 * The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.
 * 
 * ### Conditional Checks
 * You can quickly check the current variant with if and ifNot:
 * 
 * ```ts
 * // If the variant is Foo, log a message and return true; otherwise return false.
 * // typeof isFoo == boolean
 * const isFoo = fooValue.if.Foo((val) => {
 *   console.log("Yes, it's Foo with x =", val.x);
 * });
 * 
 * // If the variant is not Bar, log a message; if it is Bar, return false.
 * // typeof notBar == boolean
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 * });
 * 
 * // Values can be returned through the function and will be inferred.
 * // typeof notBar == string
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 *   return "not bar for sure";
 * });
 * 
 * // A second callback can be used for else conditions for both .if and .ifNot:
 * // Return types are inferred, without return types in the functions the default return is boolean.
 * // typeof isFooElse == string | number;
 * const isFooElse = fooValue.if.Bar((barValue) => {
 *   return barValue;
 * }, (unwrapResult) => {
 *   return 0;
 * })
 * 
 * // Callback is optional, useful for if statements
 * if(fooValue.ifNot.Bar()) {
 *   // not bar 
 * }
 * ```
 * Both methods return a boolean or the callback result, making conditional logic concise and expressive.
 * 
 * ### Asynchronous Matching
 * When dealing with asynchronous callbacks, use matchAsync:
 * ```ts
 * const matchedResult = await barValue.matchAsync({
 *   Foo: async (val) => { /* ... *\/ },
 *   Bar: async (val) => { 
 *     const result = await fetchSomeData(val);
 *     return result;
 *   },
 *   Empty: async () => {
 *     await doSomethingAsync();
 *   },
 *   _: async () => "default value"
 * });
 * 
 * console.log("Async match result:", matchedResult);
 * 
 * ```
 * The matchAsync method returns a Promise that resolves with the callback’s return value.
 * 
 * ### Unwrapping
 * In the event that you need to access the data directly, you can use the unwrap method.
 * 
 * ```ts
 * const simpleEnum = IronEnum<{
 *   foo: { text: string },
 *   bar: { title: string }
 * }>();
 * 
 * const testValue = simpleEnum.foo({text: "hello"});
 * 
 * // typeof unwrapped = ["foo", {text: string}] | ["bar", {title: string}]
 * const unwrapped = testValue.unwrap();
 * ```
 * 
 * ## Option & Result
 * The library contains straightforward implmentations of Rust's `Option` and `Result` types.
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const myResult = Result<{Ok: boolean, Err: string}>();
 * 
 * const ok = myResult.Ok(true);
 * ok.match({
 *   Ok: (value) => {
 *    console.log(value) // true;
 *   },
 *   _: () => { /* .. *\/ }
 * });
 * 
 * const myOption = Option<number>();
 * 
 * const optNum = myOption.Some(22);
 * 
 * optNum.match({
 *   Some: (val) => {
 *     console.log(val) // 22;
 *   },
 *   None: () => { /* .. *\/ }
 * })
 * 
 * ```
 * 
 * ## Contributing
 * 
 * Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.
 * 
 * ## License
 * 
 * This library is available under the MIT license. See the LICENSE file for details.
 * */


/**
 * # Iron Enum
 * 
 * **Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * ## Features
 * 
 * - **Lightweight and Zero-Dependencies:** A minimal implementation (only 400 bytes!) that relies solely on TypeScript’s advanced type system and the ES6 `Proxy` object.
 * - **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
 * - **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
 * - **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
 * - **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
 * - **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.
 * 
 * ## Why Use This Library?
 * 
 * - **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
 * - **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
 * - **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
 * - **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
 * - **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.
 * 
 * ## Basic Usage
 * 
 * ### Defining Variants
 * Suppose you want an enum-like type with three variants:
 * - Foo contains an object with an x field.
 * - Bar contains a string.
 * - Empty contains no data.
 * 
 * You can define these variants as follows:
 * 
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * type MyVariants = {
 *   Foo: { x: number };
 *   Bar: string;
 *   Empty: undefined;
 * };
 * 
 * const MyEnum = IronEnum<MyVariants>();
 * ```
 * 
 * ### Creating Values
 * To create values, simply call the variant functions:
 * 
 * ```ts
 * const fooValue = MyEnum.Foo({ x: 42 });
 * const barValue = MyEnum.Bar("Hello");
 * const emptyValue = MyEnum.Empty();
 * ```
 * Each call returns a tagged object with methods to inspect or match the variant.
 * 
 * ### Pattern Matching
 * Use match to handle each variant:
 * ```ts
 * fooValue.match({
 *   Foo: (val) => console.log("Foo with:", val), // val is { x: number }
 *   Bar: (val) => console.log("Bar with:", val),
 *   Empty: () => console.log("It's empty"),
 *   _: () => console.log("No match") // Optional fallback
 * });
 * ```
 * The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.
 * 
 * ### Conditional Checks
 * You can quickly check the current variant with if and ifNot:
 * 
 * ```ts
 * // If the variant is Foo, log a message and return true; otherwise return false.
 * // typeof isFoo == boolean
 * const isFoo = fooValue.if.Foo((val) => {
 *   console.log("Yes, it's Foo with x =", val.x);
 * });
 * 
 * // If the variant is not Bar, log a message; if it is Bar, return false.
 * // typeof notBar == boolean
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 * });
 * 
 * // Values can be returned through the function and will be inferred.
 * // typeof notBar == string
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 *   return "not bar for sure";
 * });
 * 
 * // A second callback can be used for else conditions for both .if and .ifNot:
 * // Return types are inferred, without return types in the functions the default return is boolean.
 * // typeof isFooElse == string | number;
 * const isFooElse = fooValue.if.Bar((barValue) => {
 *   return barValue;
 * }, (unwrapResult) => {
 *   return 0;
 * })
 * 
 * // Callback is optional, useful for if statements
 * if(fooValue.ifNot.Bar()) {
 *   // not bar 
 * }
 * ```
 * Both methods return a boolean or the callback result, making conditional logic concise and expressive.
 * 
 * ### Asynchronous Matching
 * When dealing with asynchronous callbacks, use matchAsync:
 * ```ts
 * const matchedResult = await barValue.matchAsync({
 *   Foo: async (val) => { /* ... *\/ },
 *   Bar: async (val) => { 
 *     const result = await fetchSomeData(val);
 *     return result;
 *   },
 *   Empty: async () => {
 *     await doSomethingAsync();
 *   },
 *   _: async () => "default value"
 * });
 * 
 * console.log("Async match result:", matchedResult);
 * 
 * ```
 * The matchAsync method returns a Promise that resolves with the callback’s return value.
 * 
 * ### Unwrapping
 * In the event that you need to access the data directly, you can use the unwrap method.
 * 
 * ```ts
 * const simpleEnum = IronEnum<{
 *   foo: { text: string },
 *   bar: { title: string }
 * }>();
 * 
 * const testValue = simpleEnum.foo({text: "hello"});
 * 
 * // typeof unwrapped = ["foo", {text: string}] | ["bar", {title: string}]
 * const unwrapped = testValue.unwrap();
 * ```
 * 
 * ## Option & Result
 * The library contains straightforward implmentations of Rust's `Option` and `Result` types.
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const myResult = Result<{Ok: boolean, Err: string}>();
 * 
 * const ok = myResult.Ok(true);
 * ok.match({
 *   Ok: (value) => {
 *    console.log(value) // true;
 *   },
 *   _: () => { /* .. *\/ }
 * });
 * 
 * const myOption = Option<number>();
 * 
 * const optNum = myOption.Some(22);
 * 
 * optNum.match({
 *   Some: (val) => {
 *     console.log(val) // 22;
 *   },
 *   None: () => { /* .. *\/ }
 * })
 * 
 * ```
 * 
 * ## Contributing
 * 
 * Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.
 * 
 * ## License
 * 
 * This library is available under the MIT license. See the LICENSE file for details.
 * */


/**
 * # Iron Enum
 * 
 * **Iron Enum** is a lightweight library that brings [Rust like](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html) powerful, type-safe, runtime "tagged enums" (also known as "algebraic data types" or "discriminated unions") to TypeScript. It provides a fluent, functional style for creating, inspecting, and pattern-matching on variant data structures — without needing complex pattern-matching libraries or large frameworks.
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * ## Features
 * 
 * - **Lightweight and Zero-Dependencies:** A minimal implementation (only 400 bytes!) that relies solely on TypeScript’s advanced type system and the ES6 `Proxy` object.
 * - **Type-Safe Tagged Variants:** Each variant is created with a unique tag and associated data, which TypeScript can strongly type-check at compile time.
 * - **Pattern Matching:** Convenient `match` and `matchAsync` methods allow you to handle each variant in a type-safe manner, including a default `_` fallback.
 * - **Conditional Checks:** Intuitive `if` and `ifNot` methods let you easily check which variant you’re dealing with and optionally run callbacks.
 * - **Supports "Empty" Variants:** Variants can be defined without associated data (using `undefined`), making it easy to represent states like "None" or "Empty."
 * - **Reduced Boilerplate:** No need to write large switch statements or manually check discriminant fields—simply define variants and let the library handle the rest.
 * 
 * ## Why Use This Library?
 * 
 * - **Improved Code Clarity:** Instead of multiple conditionals scattered across your code, use straightforward pattern matching to handle each variant in one place.
 * - **Type Safety:** TypeScript ensures that when you match a variant, you receive the correct data type automatically. No more manual type guards!
 * - **Maintainability:** Changes to variant definitions are easy to propagate. Add or remove variants in one place and let the type system guide necessary changes in your code.
 * - **Functional Programming Style:** Ideal for FP-oriented codebases or whenever you want to avoid `class`-based inheritance and complex hierarchies.
 * - **Better User Experience:** Faster onboarding for new team members. The tagged enum pattern is intuitive and self-documenting.
 * 
 * ## Basic Usage
 * 
 * ### Defining Variants
 * Suppose you want an enum-like type with three variants:
 * - Foo contains an object with an x field.
 * - Bar contains a string.
 * - Empty contains no data.
 * 
 * You can define these variants as follows:
 * 
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * type MyVariants = {
 *   Foo: { x: number };
 *   Bar: string;
 *   Empty: undefined;
 * };
 * 
 * const MyEnum = IronEnum<MyVariants>();
 * ```
 * 
 * ### Creating Values
 * To create values, simply call the variant functions:
 * 
 * ```ts
 * const fooValue = MyEnum.Foo({ x: 42 });
 * const barValue = MyEnum.Bar("Hello");
 * const emptyValue = MyEnum.Empty();
 * ```
 * Each call returns a tagged object with methods to inspect or match the variant.
 * 
 * ### Pattern Matching
 * Use match to handle each variant:
 * ```ts
 * fooValue.match({
 *   Foo: (val) => console.log("Foo with:", val), // val is { x: number }
 *   Bar: (val) => console.log("Bar with:", val),
 *   Empty: () => console.log("It's empty"),
 *   _: () => console.log("No match") // Optional fallback
 * });
 * ```
 * The appropriate function is called based on the variant’s tag. If none match, _ is used as a fallback if provided.
 * 
 * ### Conditional Checks
 * You can quickly check the current variant with if and ifNot:
 * 
 * ```ts
 * // If the variant is Foo, log a message and return true; otherwise return false.
 * const isFoo: boolean = fooValue.if.Foo((val) => {
 *   console.log("Yes, it's Foo with x =", val.x);
 * });
 * 
 * // If the variant is not Bar, log a message; if it is Bar, return false.
 * const notBar: boolean = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 * });
 * 
 * // Values can be returned through the function and will be inferred.
 * // The type for `notBar` will be inferred as "boolean | string".
 * const notBar = fooValue.ifNot.Bar(() => {
 *   console.log("This is definitely not Bar!");
 *   return "not bar for sure";
 * });
 * 
 * // Callback is optional, useful for if statements
 * if(fooValue.ifNot.Bar()) {
 *   // not bar 
 * }
 * ```
 * Both methods return a boolean or the callback result, making conditional logic concise and expressive.
 * 
 * ### Asynchronous Matching
 * When dealing with asynchronous callbacks, use matchAsync:
 * ```ts
 * const matchedResult = await barValue.matchAsync({
 *   Foo: async (val) => { /* ... *\/ },
 *   Bar: async (val) => { 
 *     const result = await fetchSomeData(val);
 *     return result;
 *   },
 *   Empty: async () => {
 *     await doSomethingAsync();
 *   },
 *   _: async () => "default value"
 * });
 * 
 * console.log("Async match result:", matchedResult);
 * 
 * ```
 * The matchAsync method returns a Promise that resolves with the callback’s return value.
 * 
 * ### Unwrapping
 * In the event that you need to access the data directly, you can use the unwrap method.
 * 
 * ```ts
 * const simpleEnum = IronEnum<{
 *   foo: { text: string },
 *   bar: { title: string }
 * }>();
 * 
 * const testValue = simpleEnum.foo({text: "hello"});
 * 
 * // typeof unwrapped = ["foo", {text: string}] | ["bar", {title: string}]
 * const unwrapped = testValue.unwrap();
 * ```
 * 
 * ## Option & Result
 * The library contains straightforward implmentations of Rust's `Option` and `Result` types.
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const myResult = Result<{Ok: boolean, Err: string}>();
 * 
 * const ok = myResult.Ok(true);
 * ok.match({
 *   Ok: (value) => {
 *    console.log(value) // true;
 *   },
 *   _: () => { /* .. *\/ }
 * });
 * 
 * const myOption = Option<number>();
 * 
 * const optNum = myOption.Some(22);
 * 
 * optNum.match({
 *   Some: (val) => {
 *     console.log(val) // 22;
 *   },
 *   None: () => { /* .. *\/ }
 * })
 * 
 * ```
 * 
 * ## Contributing
 * 
 * Contributions, suggestions, and feedback are welcome! Please open an issue or submit a pull request on the GitHub repository.
 * 
 * ## License
 * 
 * This library is available under the MIT license. See the LICENSE file for details.
 * */


/**
 * Removes optional modifiers from properties.
 */
type NonOptional<T> = {
    [K in keyof T]-?: T[K]
};

/**
 * Adds optional modifiers from properties.
 */
type Optional<T> = {
    [K in keyof T]?: T[K]
};

/**
 * Converts an object type into a union of `[key, value]` tuples.
 * If a variant's value type is `undefined` or `null`, we treat it as `[key, undefined]`.
 */
type ObjectToTuple<T> = {
    [K in keyof T]: T[K] extends undefined | null ? [K, undefined] : [K, T[K]]
}[keyof T];

/**
 * Base type for converting object properties into functions.
 * If the property type is `undefined` or `null`, the function takes no arguments,
 * otherwise it takes the property's type as an argument.
 */
type ObjectToFunctionMapBase<T, R> = {
    [K in keyof T]?: T[K] extends undefined | null ? () => R : (args: T[K]) => R;
};

type ObjectToFunctionMap<T> = ObjectToFunctionMapBase<T, any>;
type ObjectToFunctionMapAsync<T> = ObjectToFunctionMapBase<T, Promise<any>>;

/**
 * For pattern matching, we either have a fully specified map of functions (no optional fields)
 * or a map of functions plus a catch-all `_` function.
 */
type MatchFns<X extends { [key: string]: any }> =
    NonOptional<ObjectToFunctionMap<X>> |
    (ObjectToFunctionMap<X> & { _: () => any });

type MatchFnsAsync<X extends { [key: string]: any }> =
    NonOptional<ObjectToFunctionMapAsync<X>> |
    (ObjectToFunctionMapAsync<X> & { _: () => Promise<any> });

/**
 * Converts an object defining variants into a "builder map".
 * Each property is a function that constructs an enum value for that variant.
 */
type ObjectToBuilderMap<VARIANTS extends { [key: string]: any }> = {
    [K in keyof VARIANTS]-?:
    VARIANTS[K] extends undefined | null
    ? () => ReturnType<typeof enumFactory<VARIANTS>>
    : (args: VARIANTS[K]) => ReturnType<typeof enumFactory<VARIANTS>>;
};

type ExcludeVoid<T> = Exclude<T, void>;

/**
 * If the property may be null/undefined:
 * - `ifCallback` has **no** parameter
 * - `elseCallback` receives the entire object (`ObjectToTuple<TAll>`)
 */
type IfFnNull<T extends { [key: string]: any }> = <
    RIf = void,
    RElse = void
>(
    ifCallback?: () => RIf,
    elseCallback?: (obj: ObjectToTuple<T>) => RElse
) => [RIf, RElse] extends [void, void]
    ? boolean
    : (RIf extends void ? boolean | ExcludeVoid<RElse> : (RElse extends void ? boolean | ExcludeVoid<RIf> : ExcludeVoid<RElse> | ExcludeVoid<RIf>))

/**
 * If the property definitely has a value (not null/undefined):
 * - `ifCallback` receives `TValue`
 * - `elseCallback` receives the entire object (`ObjectToTuple<TAll>`)
 */
type IfFnArg<TValue, T extends { [key: string]: any }> = <
    RIf = void,
    RElse = void
>(
    ifCallback?: (val: TValue) => RIf,
    elseCallback?: (unwrapValue: ObjectToTuple<T>) => RElse
) => [RIf, RElse] extends [void, void]
    ? boolean
    : RIf extends void
    ? boolean | Exclude<RElse, void>
    : RElse extends void
    ? boolean | Exclude<RIf, void>
    : Exclude<RIf, void> | Exclude<RElse, void>;



type ObjectToIfMap<T extends { [key: string]: any }> = {
    [K in keyof T]:
    T[K] extends null | undefined
    ? IfFnNull<T>
    : IfFnArg<T[K], T>;
};

/**
 * "IfNot" logic:
 * - The first callback recieves unwrapped value
 * - The second callback recieves unwrapped value
 */
type IfNotFn<TAll> = <
    RIf = void,
    RElse = void
>(
    callback?: (unwrapValue: ObjectToTuple<TAll>) => RIf,
    elseCallback?: (unwrapValue: ObjectToTuple<TAll>) => RElse
) => [RIf, RElse] extends [void, void]
? boolean
: RIf extends void
? boolean | Exclude<RElse, void>
: RElse extends void
? boolean | Exclude<RIf, void>
: Exclude<RIf, void> | Exclude<RElse, void>;

type ObjectToIfNotMap<T> = {
    [K in keyof T]: IfNotFn<T>;
};


/**
 * Creates a tagged enum value factory. Given a `[tag, value]` tuple,
 * returns an object with utilities for pattern matching and conditional checks.
 */
const enumFactory = <VARIANTS extends { [key: string]: any }>(value: ObjectToTuple<VARIANTS>): {
    /**
     * Unwrap to get the underlying [tag, value] tuple of this enum.
     */
    unwrap: () => ObjectToTuple<VARIANTS>,
    /**
     * Convert the enum into a standard object that can be safely serialized and deserialized.
     * 
     * @returns { [variantKey: string]: variantValue }
     */
    toJSON: () => Partial<VARIANTS>,
    /**
     * `if` proxy: Check if the current variant matches a given tag.
     * If it does, call the provided callback (if any) or return true.
     * Otherwise, call optional second callback and return false.
     * If you return a value from either callback it will be returned instead of a boolean if that callback is exectued.
     */
    if: ObjectToIfMap<VARIANTS>,
    /**
     * `ifNot` proxy: Check if the current variant is NOT a given tag.
     * If it isn't that tag, call the callback (if any) or return true.
     * Otherwise, call optional second callback and return false.
     * If you return a value from either callback it will be returned instead of a boolean if that callback is exectued.
     */
    ifNot: ObjectToIfNotMap<VARIANTS>,
    /**
     * `match`: Pattern match against the current variant.
     * If a matching key is found, call its callback.
     * Otherwise, if `_` is defined, call it.
     * Return types for each callback flow to the top return type for this method.
     */
    match: <A extends MatchFns<VARIANTS>>(callbacks: A) => { [K in keyof A]: A[K] extends (...args: any) => any ? ReturnType<A[K]> : A[K] }[keyof A] | undefined,
    /**
     * `matchAsync`: Pattern match against the current variant with async callbacks.
     * If a matching key is found, call its callback.
     * Otherwise, if `_` is defined, call it.
     * Return types for each callback flow to the top return type for this method.
     */
    matchAsync: <A extends MatchFnsAsync<VARIANTS>>(callbacks: A) => Promise<{ [K in keyof A]: A[K] extends (...args: any) => Promise<any> ? Awaited<ReturnType<A[K]>> : A[K] }[keyof A] | undefined>
} => {
    const [tag, data] = value;

    return {
        unwrap: () => value,
        toJSON: () => ({
            [tag]: data
        } as Partial<VARIANTS>),
        if: new Proxy({} as ObjectToIfMap<VARIANTS>, {
            get: (_tgt, prop: string) => {
                return (callback?: Function, elseCallback?: Function) => {
                    if (prop === tag) {
                        if (callback) {
                            const result = callback(data);
                            return typeof result == "undefined" ? true : result;
                        }
                        return true;
                    } else if (typeof elseCallback !== "undefined") {
                        const result = elseCallback(value);
                        return typeof result == "undefined" ? false : result;
                    }
                    return false;
                };
            }
        }),
        ifNot: new Proxy({} as ObjectToIfNotMap<VARIANTS>, {
            get: (_tgt, prop: string) => {
                return (callback?: Function, elseCallback?: Function) => {
                    if (prop !== tag) {
                        if (callback) {
                            const result = callback(value);
                            return typeof result == "undefined" ? true : result;
                        }
                        return true;
                    } else if (typeof elseCallback !== "undefined") {
                        const result = elseCallback(value);
                        return typeof result == "undefined" ? false : result;
                    }
                    return false;
                };
            }
        }),
        match: (callbacks) => {
            if (typeof callbacks == "undefined") throw new Error(`No callbacks provided for match() call for variant "${String(tag)}".`);

            const maybeCall = callbacks[tag];
            if (maybeCall) {
                return (maybeCall as Function)(data);
            }
            const catchCall = callbacks._;
            if (catchCall) return catchCall(undefined as any);
            throw new Error(
                `No handler provided for variant "${String(tag)}". Either provide a function for "${String(tag)}" or a "_" fallback.`
            );
        },
        matchAsync: async (callbacks) => {
            if (typeof callbacks == "undefined") throw new Error(`No callbacks provided for matchAsync() call for variant "${String(tag)}".`);

            const maybeCall = callbacks[tag];
            if (maybeCall) {
                return await (maybeCall as Function)(data);
            }
            const catchCall = callbacks._;
            if (catchCall) return await catchCall(undefined as any);
            throw new Error(
                `No handler provided for variant "${String(tag)}". Either provide a function for "${String(tag)}" or a "_" fallback.`
            );
        }
    };
};

/**
 * Extract the variants from an IronEum type.
 * 
 */
export type ExtractIronEnum<T> = T extends { fromJSON: (data: Partial<infer R>) => any }
  ? Optional<R>
  : never;



/**
 * `IronEnum` generator function: Creates a proxy that provides builder functions
 * for each variant. Accessing `MyEnum.Variant` returns a function that,
 * when called with arguments, returns an enum instance.
 */
export const IronEnum = <VARIANTS extends { [key: string]: any }>(): ObjectToBuilderMap<VARIANTS> & { 
    /** Get the type of the Enum for declaring fn arguments and the like.  Example:
     * 
     * ```ts
     * const myEnum = IronEnum<{foo: string, bar: string}>();
     * 
     * const acceptsMyEnum = (value: typeof myEnum.typeOf) { /* .. * / }
     * ```
     */
    typeOf: ReturnType<typeof enumFactory<VARIANTS>>, 
    /**
     * Parse JSON as an enum type. Example:
     * 
     * ```ts
     * const myEnum = IronEnum<{foo: string, bar: string}>();
     * 
     * const enumValue = myEnum.foo("bazz");
     * // converts to standard JSON object
     * const jsonValue = enumValue.toJSON();
     * // converts back to enum 
     * const parsedEnum = myEnum.fromJSON(jsonValue);
     * 
     * ```
     * 
     * @param data 
     * @returns 
     */
    fromJSON: (data: Partial<VARIANTS>) => ReturnType<typeof enumFactory<VARIANTS>> 
} => {
    return new Proxy({} as any, {
        get: (_tgt, tag: string) => {
            if (tag == "fromJSON") {
                return (data: Partial<VARIANTS>) => {
                    const allKeys = Object.keys(data);
                    if (allKeys.length !== 1) {
                        throw new Error(`Expected exactly 1 variant key, got ${allKeys.length}: ${allKeys.join(", ")}`);
                    }
                    const key = allKeys.pop() as keyof VARIANTS | undefined;
                    if (!key) throw new Error(`Key not provided for "fromJSON" method of IronEnum!`);
                    return enumFactory<VARIANTS>([key, (() => {
                        if (!data || typeof data[key] === "undefined") return undefined;
                        return data[key];
                    })() as any]);
                }
            }
            return (data: any) => enumFactory<VARIANTS>([tag, data]);
        }
    });
};

/**
 * Option type, usage:
 * 
 * // create a type specific option
 * const NumOption = Option<number>();
 * const myNumber = NumOption.Some(22);
 * // or
 * const myNumber = Option<number>().Some(22);
 * 
 * @returns IronEnum<{Some: T, None}>
 */
export const Option = <T>(): ReturnType<typeof IronEnum<{ Some: T, None: undefined }>> => IronEnum<{
    Some: T,
    None: undefined
}>()


/**
 * Result type, usage:
 * 
 * const NumResult = Result<number, Error>();
 * const myResult = NumResult.Ok(22);
 * // or
 * const myResult = Result<number, Error>().Ok(22);
 * 
 * @returns IronEnum<{Ok: T, Err: E}>
 */
export const Result = <T, E>(): ReturnType<typeof IronEnum<{ Ok: T, Err: E }>> => IronEnum<{
    Ok: T,
    Err: E
}>()
