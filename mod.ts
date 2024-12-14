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
    [K in keyof VARIANTS]:
    VARIANTS[K] extends undefined | null
    ? () => ReturnType<typeof enumFactory<VARIANTS>>
    : (args: VARIANTS[K]) => ReturnType<typeof enumFactory<VARIANTS>>;
};

/**
 * `if` logic map: If the variant is empty (undefined), callback takes no args,
 * otherwise, it takes the variant data.
 */
type ObjectToIfMap<T> = {
    [K in keyof T]:
    T[K] extends undefined | null
    ? <X = boolean>(callback?: () => X) => X | boolean
    : <X = boolean>(callback?: (arg: T[K]) => X) => X | boolean;
};

/**
 * `ifNot` logic map: Always takes a callback with no arguments.
 */
type ObjectToIfNotMap<T> = {
    [K in keyof T]: <X = boolean>(callback?: () => X) => X | boolean;
};

/**
 * Creates a tagged enum value factory. Given a `[tag, value]` tuple,
 * returns an object with utilities for pattern matching and conditional checks.
 */
const enumFactory = <VARIANTS extends { [key: string]: any }>(value: ObjectToTuple<VARIANTS>) => {
    const [tag, data] = value;

    return {
        /**
         * Unwrap to get the underlying [tag, value] tuple of this enum.
         */
        unwrap: () => value,

        /**
         * `if` proxy: Check if the current variant matches a given tag.
         * If it does, call the provided callback (if any) or return true.
         * Otherwise, return false.
         */
        if: new Proxy({} as ObjectToIfMap<VARIANTS>, {
            get: (_tgt, prop: string) => {
                return (callback?: Function) => {
                    if (prop === tag) {
                        return callback ? callback(data) : true;
                    }
                    return false;
                };
            }
        }),

        /**
         * `ifNot` proxy: Check if the current variant is NOT a given tag.
         * If it isn't that tag, call the callback (if any) or return true.
         * Otherwise, return false.
         */
        ifNot: new Proxy({} as ObjectToIfNotMap<VARIANTS>, {
            get: (_tgt, prop: string) => {
                return (callback?: Function) => {
                    if (prop !== tag) {
                        return callback ? callback() : true;
                    }
                    return false;
                };
            }
        }),

        /**
         * `match`: Pattern match against the current variant.
         * If a matching key is found, call its callback.
         * Otherwise, if `_` is defined, call it.
         */
        match: <A extends MatchFns<VARIANTS>>(callbacks: A) => {
            if (typeof callbacks == "undefined") throw new Error(`match() method requires callback functions!`);

            const maybeCall = callbacks[tag];
            if (maybeCall) {
                return (maybeCall as Function)(data);
            }
            const catchCall = callbacks._;
            if (catchCall) return catchCall(undefined as any);
            return undefined;
        },

        /**
         * `matchAsync`: Like `match`, but all callbacks are async.
         */
        matchAsync: async <A extends MatchFnsAsync<VARIANTS>>(callbacks: A) => {
            if (typeof callbacks == "undefined") throw new Error(`matchAsync() method requires callback functions!`);

            const maybeCall = callbacks[tag];
            if (maybeCall) {
                return await (maybeCall as Function)(data);
            }
            const catchCall = callbacks._;
            if (catchCall) return await catchCall(undefined as any);
            return undefined;
        }
    };
};

/**
 * `IronEnum` generator function: Creates a proxy that provides builder functions
 * for each variant. Accessing `MyEnum.Variant` returns a function that,
 * when called with arguments, returns an enum instance.
 */
export const IronEnum = <VARIANTS extends { [key: string]: any }>(): ObjectToBuilderMap<VARIANTS> & { typeOf: ReturnType<typeof enumFactory<VARIANTS>> } => {
    return new Proxy({} as ObjectToBuilderMap<VARIANTS> & { typeOf: ReturnType<typeof enumFactory<VARIANTS>> }, {
        get: (_tgt, tag: string) => {
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
