/**
 * A record of possible variants, each key mapping to its associated data type.
 * 
 * Example:
 * ```ts
 * type OptionVariants = { Some: string, None: undefined };
 * 
 * // "Some" has an associated string, while "None" has no associated data (undefined).
 * ```
 */
export type VariantsRecord = {
    [K in Exclude<string, "_">]: any;
};

type EnumUnion<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: ALL[K];
}[keyof ALL & string];

export type EnumFactoryUnion<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: EnumFactory<K, ALL[K], ALL>;
}[keyof ALL & string];

/**
 * Represents a single constructed enum value.
 * 
 * - `tag` is the literal name of the variant.
 * - `data` is the data associated with this variant (could be undefined).
 * - It intersects with all of the enum methods (`EnumMethods`).
 * 
 * Generics:
 * - `TAG`: the specific variant key.
 * - `PAYLOAD`: the associated data type for this key.
 * - `ALL`: the entire `VariantsRecord` for reference by the methods.
 */
export type EnumFactory<
    TAG extends keyof ALL & string,
    PAYLOD,
    ALL extends VariantsRecord
> = {
    tag: TAG;
    data: EnumUnion<ALL>;
} & EnumMethods<ALL>;

/**
 * A set of methods made available to every constructed enum value:
 * - `toJSON`: Returns a plain object with exactly one key/value corresponding to the current variant.
 * - `key`: Returns the variant key.
 * - `if` / `ifNot`: Provide conditional checks against a specific variant.
 * - `match` / `matchAsync`: Synchronously or asynchronously pattern-match on the variant key.
 */
export interface EnumMethods<ALL extends VariantsRecord> {
    /**
     * Returns a simple JavaScript object that has exactly one key, the variant name, 
     * and its associated data as the value.
     */
    toJSON: () => Partial<ALL>;
    /**
     * Returns the variant key for this enum value.
     */
    key: () => keyof ALL & string;
    /**
     * Provides an object with methods for handling a check against each variant:
     * 
     * ```ts
     * const value = MyEnum.Foo("some data");
     * 
     * value.if.Foo(
     *   (payload) => console.log("This is Foo with data:", payload),
     *   (jsonObj) => console.log("This is not Foo; got:", jsonObj)
     * );
     * ```
     */
    if: ObjectToIfMap<ALL>;
    /**
     * Provides an object with methods for handling the inverse check of a variant:
     * 
     * ```ts
     * const value = MyEnum.Foo("some data");
     * 
     * value.ifNot.Bar(
     *   (jsonObj) => console.log("Value is not Bar; got:", jsonObj),
     *   (jsonObj) => console.log("Value is Bar; got:", jsonObj)
     * );
     * ```
     */
    ifNot: ObjectToIfNotMap<ALL>;
    /**
     * Perform synchronous pattern matching on the variant. Must handle all variants or use `_` as a fallback.
     * 
     * ```ts
     * const result = MyEnum.Foo("some data").match({
     *   Foo: (payload) => `Got Foo with ${payload}`,
     *   Bar: (payload) => `Got Bar with ${payload}`,
     *   // fallback if not handled above
     *   _: () => "Unknown variant!"
     * });
     * ```
     */
    match: <A extends MatchFns<ALL>>(callbacks: A) => MatchResult<A>;
    /**
     * Similar to `match` but allows asynchronous callback functions.
     * 
     * ```ts
     * const result = await MyEnum.Foo("some data").matchAsync({
     *   Foo: async (payload) => await processFoo(payload),
     *   Bar: async (payload) => await processBar(payload),
     *   _: async () => await handleUnknown()
     * });
     * ```
     */
    matchAsync: <A extends MatchFnsAsync<ALL>>(callbacks: A) => Promise<MatchResult<A>>;
    // eq: (to: EnumFactory<keyof ALL & string, unknown, ALL>, mode: "tag" | "tag-data" ) => boolean
    // notEq: (to: EnumFactory<keyof ALL & string, unknown, ALL>, mode: "tag" | "tag-data" ) => boolean
}

type NonOptional<T> = {
    [K in keyof T]-?: T[K];
};

type ObjectToFunctionMapBase<T, R> = {
    [K in keyof T]?: T[K] extends undefined | null
    ? () => R
    : (args: T[K]) => R;
};

type ObjectToFunctionMap<T> = ObjectToFunctionMapBase<T, any>;
type ObjectToFunctionMapAsync<T> = ObjectToFunctionMapBase<T, Promise<any>>;

/**
 * Pattern matching map for each variant. Must specify all variant keys or have a "_" fallback.
 */
type MatchFns<X extends VariantsRecord> =
    | NonOptional<ObjectToFunctionMap<X>>
    | (ObjectToFunctionMap<X> & { _: () => any });

/**
 * Pattern matching map for each variant with async callbacks. Must specify all variant keys or have a "_" fallback.
 */
type MatchFnsAsync<X extends VariantsRecord> =
    | NonOptional<ObjectToFunctionMapAsync<X>>
    | (ObjectToFunctionMapAsync<X> & { _: () => Promise<any> });

/**
 * Derives the return type from the union of callback signatures in the map.
 */
type MatchResult<A> = A extends { [K: string]: (...args: any) => infer R }
    ? R
    : never;

/**
 * If the variant matches the key, call the `ifCallback`; otherwise call `elseCallback`.
 * The return type is designed so if your callbacks return `void`, 
 * it simply returns a boolean indicating the success/failure of the check.
 */
type IfFnNull<T extends Record<string, any>> = <
    RIf = void,
    RElse = void
>(
    ifCallback?: () => RIf,
    elseCallback?: (obj: Partial<T>) => RElse
) => [RIf, RElse] extends [void, void]
    ? boolean
    : RIf extends void
    ? boolean | Exclude<RElse, void>
    : RElse extends void
    ? boolean | Exclude<RIf, void>
    : Exclude<RIf, void> | Exclude<RElse, void>;

/**
 * Similar to `IfFnNull`, but for properties that are not null/undefined.
 * The `ifCallback` receives the associated data, e.g. the `payload`.
 */
type IfFnArg<TValue, T extends Record<string, any>> = <
    RIf = void,
    RElse = void
>(
    ifCallback?: (val: TValue) => RIf,
    elseCallback?: (jsonValue: Partial<T>) => RElse
) => [RIf, RElse] extends [void, void]
    ? boolean
    : RIf extends void
    ? boolean | Exclude<RElse, void>
    : RElse extends void
    ? boolean | Exclude<RIf, void>
    : Exclude<RIf, void> | Exclude<RElse, void>;

/**
 * The object type used by the `if` property on an enum instance.
 * Each key corresponds to a potential variant key, returning a function 
 * that handles the if/else logic for that variant.
 */
type ObjectToIfMap<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends null | undefined
    ? IfFnNull<T>
    : IfFnArg<T[K], T>;
};

/**
 * `ifNot` logic handles the inverse check of a given key. 
 * The callback is invoked if the variant is NOT the specified key, 
 * else the `elseCallback` is invoked.
 */
type IfNotFn<TAll> = <
    RIf = void,
    RElse = void
>(
    callback?: (jsonValue: Partial<TAll>) => RIf,
    elseCallback?: (jsonValue: Partial<TAll>) => RElse
) => [RIf, RElse] extends [void, void]
    ? boolean
    : RIf extends void
    ? boolean | Exclude<RElse, void>
    : RElse extends void
    ? boolean | Exclude<RIf, void>
    : Exclude<RIf, void> | Exclude<RElse, void>;

/**
 * The object type used by the `ifNot` property on an enum instance.
 * Each key corresponds to a potential variant key, returning a function 
 * that handles the "not that variant" logic.
 */
type ObjectToIfNotMap<T> = {
    [K in keyof T]: IfNotFn<T>;
};

/**
 * Creates a single variant object internally, with all the associated utility methods.
 * 
 * @param allVariants - The entire variants record for reference (not used directly, but typed).
 * @param tag - The variant key being constructed.
 * @param data - The associated data for this variant key.
 * @returns An object with `tag`, `data`, and all the utility methods (`if`, `ifNot`, `match`, etc.).
 */
function enumFactory<
    ALL extends VariantsRecord,
    TAG extends keyof ALL & string
>(
    allVariants: ALL,
    tag: TAG,
    data: ALL[TAG]
): EnumFactory<TAG, ALL[TAG], ALL> {

    if (tag === "_") {
        throw new Error(
            'Variant key "_" is reserved; cannot use "_" as a variant name.'
        );
    }

    return {
        tag,
        data: data,
        toJSON: () => ({ [tag]: data } as unknown as Partial<ALL>),
        key: () => tag,
        if: new Proxy({} as ObjectToIfMap<ALL>, {
            get: (_tgt, prop: string) => {
                return (callback?: Function, elseCallback?: Function) => {
                    if (prop === tag) {
                        if (callback) {
                            const result = callback(data);
                            return result === undefined ? true : result;
                        }
                        return true;
                    } else if (elseCallback) {
                        const result = elseCallback({ [tag]: data } as unknown as Partial<ALL>);
                        return result === undefined ? false : result;
                    }
                    return false;
                };
            }
        }),
        ifNot: new Proxy({} as ObjectToIfNotMap<ALL>, {
            get: (_tgt, prop: string) => {
                return (callback?: Function, elseCallback?: Function) => {
                    if (prop !== tag) {
                        if (callback) {
                            const result = callback({ [tag]: data } as unknown as Partial<ALL>);
                            return result === undefined ? true : result;
                        }
                        return true;
                    } else if (elseCallback) {
                        const result = elseCallback({ [tag]: data } as unknown as Partial<ALL>);
                        return result === undefined ? false : result;
                    }
                    return false;
                };
            }
        }),
        match: (callbacks) => {
            const maybeFn = callbacks[tag];
            if (maybeFn) {
                return maybeFn(data);
            }
            const catchAll = callbacks._ as () => any;
            if (catchAll) {
                return catchAll();
            }
            throw new Error(
                `No handler for variant "${String(tag)}" and no "_" fallback`
            );
        },
        matchAsync: async (callbacks) => {
            const maybeFn = callbacks[tag];
            if (maybeFn) {
                return await maybeFn(data);
            }
            const catchAll = callbacks._ as () => Promise<any>;
            if (catchAll) {
                return await catchAll();
            }
            throw new Error(
                `No handler for variant "${String(tag)}" and no "_" fallback`
            );
        }
    };
}

/**
 * Utility type that captures additional properties for a given Enum,
 * including parse and type-checking utilities.
 */
export type EnumProperties<ALL extends VariantsRecord, AddedProps> = {
    /**
     * The variant keys available on this enum.
     */
    typeKeys: keyof ALL,
    /**
     * The variants record used to construct this enum.
     */
    typeVariants: Partial<ALL>,
    /**
     * The type of the Enum for usage in function arguments, etc.
     * 
     * Example:
     * ```ts
     * const MyEnum = IronEnum<{ Foo: string, Bar: number }>();
     * // The type of the entire enum instance:
     * type MyEnumType = typeof MyEnum._.typeOf;
     * 
     * function doSomething(value: MyEnumType) { ... }
     * ```
     */
    typeOf: EnumFactoryUnion<ALL> & AddedProps,
    /**
     * Reconstructs a variant from a plain object that must have exactly one key.
     * 
     * Example:
     * ```ts
     * const dataObj = { Foo: "hello" };
     * const myVariant = MyEnum._.parse(dataObj); 
     * // myVariant is an enum value with tag="Foo" and data="hello"
     * ```
     */
    parse(dataObj: Partial<ALL>): EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL>;
};

/**
 * The shape of the object returned by `IronEnum`. It has one method per variant key
 * that can construct that variant. It also has a special `_` property 
 * which is an object containing additional helpers (like `parse`).
 */
export type IronEnumInstance<ALL extends VariantsRecord> = {
    /**
     * For a variant key that has associated data, call it like `MyEnum.Foo("myData")`.
     * If the variant has no data, call it like `MyEnum.None()`.
     */
    [K in keyof ALL & string]: ALL[K] extends undefined | null | void
    ? () => EnumFactory<K, ALL[K], ALL>
    : (data: ALL[K]) => EnumFactory<K, ALL[K], ALL>;
} & {
    /**
     * A special property containing meta-information and helper methods for the enum, 
     * such as `parse(...)`.
     */
    _: EnumProperties<ALL, {}>
};

/**
 * Constructs an enum "builder" object. 
 * 
 * Each key in the `ALL` record becomes a function to produce that variant value.
 * 
 * Usage Example:
 * ```ts
 * const MyEnum = IronEnum<{ Foo: string, Bar: number }>();
 * const fooValue = MyEnum.Foo("some text");
 * const barValue = MyEnum.Bar(123);
 * 
 * ```
 * 
 * Note: Do not use the "_" key in your variants — it is reserved for catch-all logic.
 */
export function IronEnum<ALL extends VariantsRecord>(): "_" extends keyof ALL ? "ERROR: Cannot use '_' as a variant key!" : IronEnumInstance<ALL> {

    // Using a Proxy to dynamically handle variant construction
    // and the special "parse" method at runtime.
    return new Proxy({}, {
        get: (_tgt, prop: string) => {
            if (prop === "_") {
                return new Proxy({}, {
                    get: (_tgt2, prop2: string) => {
                        if (prop2 == "parse") {
                            return (dataObj: Partial<ALL>) => {
                                const keys = Object.keys(dataObj);
                                if (keys.length !== 1) {
                                    throw new Error(
                                        `Expected exactly 1 variant key, got ${keys.length}`
                                    );
                                }
                                const actualKey = keys[0] as keyof ALL & string;
                                return enumFactory<ALL, typeof actualKey>(
                                    {} as ALL,
                                    actualKey,
                                    dataObj[actualKey] as ALL[typeof actualKey]
                                );
                            };
                        }
                        throw new Error(`Property '${prop2}' not availalbe at runtime!`);
                    }
                });
            }

            return (payload: any) => {
                return enumFactory<ALL, typeof prop>(
                    {} as ALL,
                    prop,
                    payload
                );
            };
        }
    }) as any;
}

/**
 * Extends the basic enum instance with Rust-like methods for retrieving or transforming data.
 * - `unwrap()`, `unwrap_or()`, `unwrap_or_else()`, `_try()`.
 */
type ExtendedRustMethods<T> = {
    /**
     * If this is a success/some variant, return the underlying data.
     * Otherwise, throw an Error.
     */
    unwrap: () => T,
    /**
     * If this is a success/some variant, return the data.
     * Otherwise, return the provided default `value`.
     */
    unwrap_or: <R>(value: R) => R | T,
    /**
     * If this is a success/some variant, return the data.
     * Otherwise, return the result of `callback()`.
     */
    unwrap_or_else: <R>(callback: () => R) => R | T,
    // _try: () => any
};

/**
 * Extends a Result type with an `ok()` method that transforms `Ok` data into a `Some` Option, 
 * or `Err` into a `None`.
 */
type ResultMethods<ALL extends { Ok: unknown, Err: unknown }> = {
    /**
     * Converts an `Ok` variant into `Some`, or an `Err` variant into `None`.
     */
    ok: () => OptionFactory<{ Some: ALL["Ok"], None: undefined }>
};

/**
 * A specific type for a `Result`-style enum, with Rust-like methods for success/error handling.
 * 
 * Example usage:
 * ```ts
 * const MyResult = Result<number, Error>();
 * const success = MyResult.Ok(42);
 * const failure = MyResult.Err(new Error("Oops"));
 * 
 * success.unwrap() // 42
 * failure.unwrap() // throws Error
 * ```
 */
export type ResultFactory<ALL extends { Ok: unknown, Err: unknown }> =
    EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL>
    & ExtendedRustMethods<ALL["Ok"]>
    & ResultMethods<ALL>;

/**
 * Returned by `Result<T, E>()`, it provides two methods for construction:
 * - `Ok(...)`
 * - `Err(...)`
 * and a `._` property for parsing, plus all the extended Rust methods in the type definition.
 */
export type ResultInstance<ALL extends { Ok: unknown, Err: unknown }> = {
    /**
     * Constructs a successful variant with the provided data.
     */
    Ok: (data: ALL["Ok"]) => ResultFactory<ALL>,
    /**
     * Constructs an error variant with the provided error data.
     */
    Err: (data: ALL["Err"]) => ResultFactory<ALL>
} & {
    /**
     * Provides the meta-information and parse function for the enum, 
     * as well as the extended Rust methods in the type signature.
     */
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>>
};

/**
 * A Result type constructor for a success or error scenario, similar to Rust's `Result<T, E>`.
 * 
 * Example usage:
 * ```ts
 * const NumResult = Result<number, string>();
 * const okVal = NumResult.Ok(42);
 * console.log(okVal.unwrap()); // 42
 * 
 * const errVal = NumResult.Err("something happened");
 * console.log(errVal.unwrap_or(0)); // 0
 * ```
 */
export const Result = <T, E>(): ResultInstance<{ Ok: T, Err: E }> => (() => {
    const resultEnum = IronEnum<{ Ok: T, Err: E }>();

    return {
        _: resultEnum._ as any,
        Ok: (value: T) => ({
            ...resultEnum.Ok(value),
            unwrap: () => value,
            unwrap_or: x => value,
            unwrap_or_else: x => value,
            ok: () => Option<T>().Some(value)
        }),
        Err: (value: E) => ({
            ...resultEnum.Err(value),
            unwrap: () => {
                if (value instanceof Error) {
                    throw value;
                } else if (typeof value == "string") {
                    throw new Error(value);
                } else if (typeof value !== "undefined" && value !== null && typeof value.toString == "function") {
                    throw new Error(value.toString());
                } else {
                    throw new Error(`Called .unwrap() on an Result.Err enum!`);
                }
            },
            unwrap_or: x => x,
            unwrap_or_else: x => x(),
            ok: () => Option<T>().None()
        })
    };
})();

/**
 * A convenience function to build a `Result.Ok` variant inline, useful when you only care about a single Ok type.
 * 
 * ```ts
 * const val = Ok(123);
 * console.log(val.unwrap()); // 123
 * ```
 */
export const Ok = <T>(value: T): ResultFactory<{ Ok: T, Err: unknown }> => Result<T, unknown>().Ok(value);

/**
 * A convenience function to build a `Result.Err` variant inline, useful when you only care about a single Err type.
 * 
 * ```ts
 * const errorVal = Err("something went wrong");
 * console.log(errorVal.match({
 *   Ok: (v) => `Got OK with value ${v}`,
 *   Err: (e) => `Got Err: ${e}`
 * }));
 * ```
 */
export const Err = <E>(error: E): ResultFactory<{ Ok: unknown, Err: E }> => Result<unknown, E>().Err(error);

/**
 * A specialized type for an Option-like enum, with Rust-like methods. 
 * Extends the base enum with `ok_or` / `ok_or_else` that transform an Option into a Result.
 */
export type OptionFactory<ALL extends { Some: unknown, None: undefined }> =
    EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL>
    & ExtendedRustMethods<ALL["Some"]>
    & OptionMethods<ALL["Some"]>;

type OptionMethods<OK> = {
    /**
     * If the variant is `Some`, return `Result.Ok(value)`. Otherwise `Result.Err(error)`.
     */
    ok_or: <E>(error: E) => ResultFactory<{ Ok: OK, Err: E }>,
    /**
     * Similar to `ok_or`, but takes a function that returns the error.
     */
    ok_or_else: <E>(error: () => E) => ResultFactory<{ Ok: OK, Err: E }>
};

/**
 * Returned by `Option<T>()`, it provides two methods for construction:
 * - `Some(...)`
 * - `None()`
 * and a `._` property for parsing, plus all the extended Rust methods in the type definition.
 */
export type OptionInstance<ALL extends { Some: unknown, None: undefined }> = {
    /**
     * Construct a `Some` variant with associated data.
     */
    Some: (data: ALL["Some"]) => OptionFactory<ALL>,
    /**
     * Construct a `None` variant with no associated data.
     */
    None: () => OptionFactory<ALL>,
} & {
    /**
     * Provides the meta-information and parse function for the enum, 
     * as well as the extended Rust methods in the type signature.
     */
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>>
};

/**
 * An Option type constructor for a possibly-undefined value, similar to Rust's `Option<T>`.
 * 
 * Example usage:
 * ```ts
 * const NumOption = Option<number>();
 * 
 * const someVal = NumOption.Some(123);
 * console.log(someVal.unwrap()); // 123
 * 
 * const noneVal = NumOption.None();
 * console.log(noneVal.unwrap_or(0)); // 0
 * ```
 */
export const Option = <T>(): OptionInstance<{ Some: T, None: undefined }> => (() => {
    const optEnum = IronEnum<{ Some: T, None: undefined }>();

    return {
        _: optEnum._ as any,
        Some: (value: T) => ({
            ...optEnum.Some(value),
            unwrap: () => value,
            unwrap_or: x => value,
            unwrap_or_else: x => value,
            ok_or: <R>(err: R) => Result<T, R>().Ok(value),
            ok_or_else: <R>(err: () => R) => Result<T, R>().Ok(value),
            _try: () => null
        }),
        None: () => ({
            ...optEnum.None(),
            unwrap: () => {
                throw new Error(`Called .unwrap() on an Option.None enum!`);
            },
            unwrap_or: x => x,
            unwrap_or_else: x => x(),
            ok_or: <R>(err: R) => Result<T, R>().Err(err),
            ok_or_else: <R>(err: () => R) => Result<T, R>().Err(err()),
            _try: () => null
        })
    };
})();

/**
 * A convenience function to construct `Option.Some` inline with a given value.
 * 
 * ```ts
 * const s = Some("Hello");
 * console.log(s.unwrap()); // "Hello"
 * ```
 */
export const Some = <T>(value: T): OptionFactory<{ Some: T, None: undefined }> => Option<T>().Some(value);

/**
 * A convenience function to construct `Option.None` inline with no associated data.
 * 
 * ```ts
 * const n = None();
 * console.log(n.unwrap_or("default")); // "default"
 * ```
 */
export const None = (): OptionFactory<{ Some: unknown, None: undefined }> => Option().None();


/**
 * A utility for wrapping function calls (both synchronous and asynchronous)
 * in a `Result` type, capturing successful outputs or caught exceptions.
 * 
 * This helps simplify error handling and improves readability by avoiding
 * `try/catch` blocks scattered throughout your code.
 * 
 * ## Example (Sync):
 * ```ts
 * const result = Try.sync(() => riskyOperation());
 * if (result.isOk()) {
 *     console.log("Success:", result.value);
 * } else {
 *     console.error("Error:", result.error);
 * }
 * ```
 * 
 * ## Example (Async):
 * ```ts
 * const result = await Try.async(() => fetchData());
 * if (result.isOk()) {
 *     console.log("Fetched:", result.value);
 * } else {
 *     console.error("Fetch failed:", result.error);
 * }
 * ```
 * 
 * @property sync - Wraps a synchronous function and returns a `ResultFactory`
 *                  with `Ok` or `Err` depending on whether an exception is thrown.
 * 
 * @property async - Wraps an asynchronous function (returning a Promise) and
 *                   returns a `Promise<ResultFactory>` containing the result or error.
 */
export const Try = {
    sync: <X>(callback: () => X): ResultFactory<{Ok: X, Err: Error}> => {
        try {
            const output = callback();
            return Result<X, Error>().Ok(output);
        } catch (e: any) {
            return Result<X, Error>().Err(e as Error)
        }
    },
    async: async <X>(callback: () => Promise<X>): Promise<ResultFactory<{Ok: X, Err: Error}>> => {
        try {
            const output = await callback();
            return Result<X, Error>().Ok(output);
        } catch (e: any) {
            return Result<X, Error>().Err(e as Error)
        }
    }
}