/**
 * IronEnum – Zero-dependency Rust-style tagged-union helpers for TypeScript.
 *
 * @packageDocumentation
 *
 * A lightweight library for creating type-safe discriminated unions (tagged unions)
 * with pattern matching, inspired by Rust's enum system. IronEnum provides a
 * runtime representation for TypeScript union types with zero dependencies.
 *
 * @example Basic usage
 * ```ts
 * // Define an enum with three variants
 * const Status = IronEnum<{
 * Loading: undefined;
 * Ready: { finishedAt: Date };
 * Error: { message: string; code: number };
 * }>();
 *
 * // Create instances
 * const loading = Status.Loading();
 * const ready = Status.Ready({ finishedAt: new Date() });
 *
 * // Pattern match to handle all cases
 * const message = ready.match({
 * Loading: () => "Still working…",
 * Ready: ({ finishedAt }) => `Done at ${finishedAt.toISOString()}`,
 * Error: ({ message }) => `Failed: ${message}`
 * });
 * ```
 *
 * @example Using Result and Option types
 * ```ts
 * // Result type for error handling
 * function divide(a: number, b: number): Result<number, string> {
 * return b === 0 ? Err("Division by zero") : Ok(a / b);
 * }
 *
 * // Option type for nullable values
 * function findUser(id: string): Option<User> {
 * const user = users.find(u => u.id === id);
 * return user ? Some(user) : None();
 * }
 * ```
 *
 * @module
 */

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

/**
 * Defines the structure of enum variants.
 *
 * Each key represents a variant name, and its value type represents
 * the payload that variant carries. Use `undefined` for variants
 * without associated data.
 *
 * @example
 * ```ts
 * type MyVariants = {
 * Success: { data: string };  // Variant with payload
 * Loading: undefined;         // Variant without payload
 * Error: { code: number };    // Another variant with payload
 * }
 * ```
 */
export type VariantsRecord = {
    [K in Exclude<string, "_">]: any;
};

/**
 * Helper type that creates a union of all possible payloadTypes
 * from a VariantsRecord. This represents any value that could be
 * stored in a variant's payload.
 *
 * @internal
 */
type EnumUnion<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: ALL[K];
}[keyof ALL & string];

/**
 * Union type of all possible enum instances for a given VariantsRecord.
 * This type represents any variant that can be created from the enum.
 *
 * @template ALL - The VariantsRecord defining all variants
 */
export type EnumFactoryUnion<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: EnumFactory<K, ALL[K], ALL>;
}[keyof ALL & string];

// -----------------------------------------------------------------------------
// Type Helpers
// -----------------------------------------------------------------------------

/**
 * Determines the appropriate constructor signature for a variant based
 * on its payload type.
 *
 * @internal
 */
type VariantConstructor<
    Default,
    K extends string,
    ALL extends VariantsRecord
> = [Default] extends [undefined | null | void]
    ? (data?: Default) => EnumFactory<K, Default, ALL> // Case 1: No payload (optional arg)
    : <P extends Default>(data: P) => EnumFactory<K, P, ALL>; // Case 2: Required payload

/**
 * Determines the return type for `if` and `ifNot` methods based on
 * the callback return types. Ensures proper type inference for both
 * boolean checks and value-returning callbacks.
 *
 * @internal
 */
type IfReturn<RIf, RElse> = [RIf, RElse] extends [void, void]
    ? boolean
    : RIf extends void
    ? boolean | Exclude<RElse, void>
    : RElse extends void
    ? boolean | Exclude<RIf, void>
    : Exclude<RIf, void> | Exclude<RElse, void>;

// -----------------------------------------------------------------------------
// Public Enum Instance Type
// -----------------------------------------------------------------------------

/**
 * Represents a single constructed enum value with its tag, payload, and methods.
 *
 * This is the main type returned when creating enum instances. It provides
 * access to the variant's data and all available methods for pattern matching
 * and manipulation.
 *
 * @template TAG - The specific variant name (discriminant)
 * @template PAYLOAD - The data type associated with this variant
 * @template ALL - The complete VariantsRecord for type context
 *
 * @example
 * ```ts
 * const status: EnumFactory<"Loading", undefined, StatusVariants> = Status.Loading();
 * console.log(status.tag);     // "Loading"
 * console.log(status.payload); // undefined
 * ```
 */
export type EnumFactory<
    TAG extends keyof ALL & string,
    PAYLOAD,
    ALL extends VariantsRecord
> = {
    /**
     * The variant name (discriminant). Use this for type narrowing in switch statements.
     *
     * @example
     * ```ts
     * switch (value.tag) {
     * case "Success":
     * console.log(value.payload); // TypeScript knows the payload type
     * break;
     * }
     * ```
     */
    tag: TAG;

    /**
     * Union of all possible payloads.
     * @internal
     */
    data: EnumUnion<ALL>;

    /**
     * The actual payload data for this specific variant.
     * Type-safe access to the variant's associated data.
     */
    payload: PAYLOAD;

    /**
     * The factory instance this variant was created from.
     * Useful for accessing other variants or utilities.
     *
     * @example
     * ```ts
     * const loading = Status.Loading();
     * // Create a new variant from the instance
     * const ready = loading.instance.Ready({ finishedAt: new Date() });
     * // Access utilities
     * const parsed = loading.instance._.parse({ Error: { message: "..." } });
     * ```
     */
    instance: IronEnumInstance<ALL>
} & EnumMethods<ALL>;

/**
 * Methods available on every enum instance for pattern matching,
 * guards, and data manipulation.
 *
 * @template ALL - The complete VariantsRecord
 */
export interface EnumMethods<ALL extends VariantsRecord> {
    /**
     * Converts the enum instance to a plain JavaScript object.
     * Useful for serialization or debugging.
     *
     * @returns Object with single key (variant name) and its payload
     *
     * @example
     * ```ts
     * const status = Status.Ready({ id: 123 });
     * console.log(status.toJSON()); // { Ready: { id: 123 } }
     * ```
     */
    toJSON(): Partial<ALL>;

    /**
     * Gets the variant name as a string.
     *
     * @returns The variant key
     *
     * @example
     * ```ts
     * const status = Status.Loading();
     * console.log(status.key()); // "Loading"
     * ```
     */
    key(): keyof ALL & string;

    /**
     * Conditional execution based on variant type. Acts as a type guard.
     *
     * @param key - The variant name to check against
     * @param success - Callback executed if variant matches (receives payload)
     * @param failure - Callback executed if variant doesn't match (receives instance)
     * @returns Boolean if no callbacks provided, otherwise callback result
     *
     * @example
     * ```ts
     * // Simple boolean check
     * if (result.if("Ok")) {
     * console.log("Operation succeeded");
     * }
     *
     * // With callbacks
     * const message = result.if(
     * "Ok",
     * (value) => `Success: ${value}`,
     * (self) => `Failed with: ${self.key()}` // 'self' is the 'Err' instance
     * );
     * ```
     */
if<K extends keyof ALL & string, RIf = void, RElse = void>(
        key: K,
        success?: ALL[K] extends undefined | null
            ? (payload: ALL[K], self: EnumFactory<K, ALL[K], ALL>) => RIf
            : (payload: ALL[K], self: EnumFactory<K, ALL[K], ALL>) => RIf,
        failure?: (self: EnumFactoryUnion<ALL>) => RElse
    ): IfReturn<RIf, RElse>;

    /**
     * Inverse conditional execution. Executes success callback when
     * variant does NOT match the specified key.
     *
     * @param key - The variant name to check against
     * @param success - Callback executed if variant doesn't match (receives instance)
     * @param failure - Callback executed if variant matches (receives payload)
     * @returns Boolean if no callbacks provided, otherwise callback result
     *
     * @example
     * ```ts
     * result.ifNot(
     * "Error",
     * (self) => console.log(`No error, state is: ${self.key()}`), // 'self' is the 'Ok' instance
     * (error) => console.log(`Error state detected: ${error}`)
     * );
     * ```
     */
ifNot<K extends keyof ALL & string, RIf = void, RElse = void>(
        key: K,
        success?: (self: EnumFactoryUnion<ALL>) => RIf,
        failure?: ALL[K] extends undefined | null
            ? (payload: ALL[K], self: EnumFactory<K, ALL[K], ALL>) => RElse
            : (payload: ALL[K], self: EnumFactory<K, ALL[K], ALL>) => RElse
    ): IfReturn<RIf, RElse>;

    /**
     * Pattern matching - the heart of enum usage. Ensures exhaustive
     * handling of all variants or requires a fallback.
     *
     * @param callbacks - Object mapping variant names to handler functions
     * @returns The return value of the matched handler
     *
     * @example
     * ```ts
     * const result = status.match({
     * Loading: () => "Please wait...",
     * Ready: ({ data }) => `Data: ${data}`,
     * Error: ({ message }) => `Error: ${message}`
     * });
     *
     * // With fallback using '_'
     * const simplified = status.match({
     * Ready: ({ data }) => data,
     * _: (self) => `Unhandled state: ${self.key()}` // 'self' is the instance
     * });
     * ```
     */
    match<A extends MatchFns<ALL>>(callbacks: A): MatchResult<A>;

    /**
     * Asynchronous pattern matching. Like `match` but supports
     * async handlers and returns a Promise.
     *
     * @param callbacks - Object mapping variant names to async handler functions
     * @returns Promise resolving to the matched handler's result
     *
     * @example
     * ```ts
     * const result = await status.matchAsync({
     * Ready: async ({ data }) => process(data),
     * _: async (self) => {
     * await logWarning(`Unhandled state: ${self.key()}`);
     * return null;
     * }
     * });
     * ```
     */
    matchAsync<A extends MatchFnsAsync<ALL>>(
        callbacks: A
    ): Promise<MatchResult<A>>;
}

// -----------------------------------------------------------------------------
// Internal Type Helpers
// -----------------------------------------------------------------------------

/**
 * Utility type that removes optional modifiers from all properties.
 * Used to ensure exhaustive pattern matching.
 *
 * @internal
 */
type NonOptional<T> = { [K in keyof T]-?: T[K] };

/**
 * Base type for converting variant payloads to handler functions.
 * All handlers receive `payload` as the first arg and `self` as the second.
 * @internal
 */
type ObjectToFunctionMapBase<T extends VariantsRecord, R> = {
    [K in keyof T]?: T[K] extends undefined | null 
        ? (payload: T[K], self: EnumFactory<K & string, T[K], T>) => R 
        : (payload: T[K], self: EnumFactory<K & string, T[K], T>) => R;
};

/**
 * Maps variant names to synchronous handler functions.
 *
 * @internal
 */
type ObjectToFunctionMap<T extends VariantsRecord> = ObjectToFunctionMapBase<T, any>;

/**
 * Maps variant names to asynchronous handler functions.
 *
 * @internal
 */
type ObjectToFunctionMapAsync<T extends VariantsRecord> = ObjectToFunctionMapBase<T, Promise<any>>;

/**
 * Valid handler configurations for pattern matching.
 * Either all variants must be handled, or a '_' fallback must be provided.
 *
 * @internal
 */
type MatchFns<X extends VariantsRecord> =
    | NonOptional<ObjectToFunctionMap<X>>
    | (ObjectToFunctionMap<X> & { _: (self: EnumFactoryUnion<X>) => any });

/**
 * Valid async handler configurations for pattern matching.
 *
 * @internal
 */
type MatchFnsAsync<X extends VariantsRecord> =
    | NonOptional<ObjectToFunctionMapAsync<X>>
    | (ObjectToFunctionMapAsync<X> & { _: (self: EnumFactoryUnion<X>) => Promise<any> });

/**
 * Extracts the return type from a pattern matching handler configuration.
 *
 * @internal
 */
type MatchResult<A> = A extends { [K: string]: (...args: any) => infer R }
    ? R
    : never;

// -----------------------------------------------------------------------------
// Factory Implementation Helpers
// -----------------------------------------------------------------------------

/**
 * Core factory function that creates enum instances with all methods attached.
 *
 * @internal
 */
function enumFactory<
    ALL extends VariantsRecord,
    TAG extends keyof ALL & string
>(allVariants: ALL, tag: TAG, data: ALL[TAG], instance: IronEnumInstance<ALL>): EnumFactory<TAG, ALL[TAG], ALL> {
    if (tag === "_") throw new Error("'_' is reserved as a fallback key.");

    // Create a placeholder for `self` to enable circular reference
    const self = {} as EnumFactory<TAG, ALL[TAG], ALL>;

    // Define methods that need access to `self`
    const _if = <K extends keyof ALL & string, RIf = void, RElse = void>(
        key: K,
        success?: (payload: ALL[K], self: EnumFactory<K, ALL[K], ALL>) => RIf,
        failure?: (self: EnumFactoryUnion<ALL>) => RElse
    ): IfReturn<RIf, RElse> => {
        const isHit = key === (tag as unknown as K);

        if (isHit) {
            if (success) {
                // Pass payload AND self
                const r = (success as any)(data, self) as RIf;
                return (r === undefined ? true : r) as IfReturn<RIf, RElse>;
            }
            return true as IfReturn<RIf, RElse>;
        }

        if (failure) {
            const r = failure(self) as RElse;
            return (r === undefined ? false : r) as IfReturn<RIf, RElse>;
        }
        return false as IfReturn<RIf, RElse>;
    };

    const _ifNot = <K extends keyof ALL & string, RIf = void, RElse = void>(
        key: K,
        success?: (self: EnumFactoryUnion<ALL>) => RIf,
        failure?: (payload: ALL[K], self: EnumFactory<K, ALL[K], ALL>) => RElse
    ): IfReturn<RIf, RElse> => {
        const isMiss = key !== (tag as unknown as K);

        if (isMiss) {
            if (success) {
                const r = success(self) as RIf;
                return (r === undefined ? true : r) as IfReturn<RIf, RElse>;
            }
            return true as IfReturn<RIf, RElse>;
        }

        if (failure) {
            // Pass payload AND self
            const r = (failure as any)(data, self) as RElse;
            return (r === undefined ? false : r) as IfReturn<RIf, RElse>;
        }
        return false as IfReturn<RIf, RElse>;
    };

    const match = (callbacks: MatchFns<ALL>) => {
        const cb = callbacks[tag] ?? callbacks._;
        if (!cb)
            throw new Error(
                `No handler for variant '${String(tag)}' and no '_' fallback`
            );
        
        // Pass (payload, self) to specific arms, or (self) to fallback
        return callbacks[tag] ? (cb as any)(data, self) : (cb as any)(self);
    };

    const matchAsync = async (callbacks: MatchFnsAsync<ALL>) => {
        const cb = callbacks[tag] ?? callbacks._;
        if (!cb)
            throw new Error(
                `No handler for variant '${String(tag)}' and no '_' fallback`
            );
        
        // Pass (payload, self) to specific arms, or (self) to fallback
        return callbacks[tag] ? (cb as any)(data, self) : (cb as any)(self);
    };

    // Assign all properties to `self`
    Object.assign(self, {
        tag,
        data,
        payload: data,
        toJSON: () => ({ [tag]: data } as unknown as Partial<ALL>),
        key: () => tag,
        instance,
        if: _if,
        ifNot: _ifNot,
        match,
        matchAsync,
    });

    return self;
}

// -----------------------------------------------------------------------------
// Main Enum Builder
// -----------------------------------------------------------------------------

/**
 * An IronEnum instance provides variant constructors and utility methods.
 * Each variant name becomes a method that creates instances of that variant.
 *
 * @template ALL - The VariantsRecord defining all variants
 *
 * @example
 * ```ts
 * const Status = IronEnum<{
 * Idle: undefined;
 * Working: { taskId: string };
 * Done: { result: any };
 * }>();
 *
 * // Each variant is a constructor method
 * const idle = Status.Idle();
 * const working = Status.Working({ taskId: "task-123" });
 * const done = Status.Done({ result: { success: true } });
 * ```
 */
export type IronEnumInstance<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: VariantConstructor<ALL[K], K, ALL>;
} & {
    /**
     * Utility methods and type information accessible via the `_` property.
     * Includes parsing, type access, and other metadata.
     */
    _: EnumProperties<ALL, {}>;
};

/**
 * Metadata and utility methods available on enum instances via the `_` property.
 * Provides type information and parsing capabilities.
 *
 * @template ALL - The VariantsRecord for this enum
 * @template AddedProps - Additional properties (used by Result/Option)
 */
export type EnumProperties<ALL extends VariantsRecord, AddedProps> = {
    /**
     * Union type of all variant names.
     * @example `"Loading" | "Ready" | "Error"`
     */
    typeKeys: keyof ALL;

    /**
     * The original VariantsRecord type definition.
     */
    typeVariants: Partial<ALL>;

    /**
     * Union type of all possible enum instances.
     * Useful for function parameters that accept any variant.
     *
     * @example
     * ```ts
     * function processStatus(status: typeof Status._["typeOf"]) {
     * // Can handle any Status variant
     * }
     * ```
     */
    typeOf: EnumFactoryUnion<ALL> & AddedProps;

    /**
     * Parses a plain object into an enum instance.
     * Useful for deserialization from JSON.
     *
     * @param dataObj - Object with single key (variant name) and payload
     * @returns Constructed enum instance
     * @throws Error if object doesn't have exactly one key
     *
     * @example
     * ```ts
     * const data = { Ready: { id: 123 } };
     * const status = Status._.parse(data);
     * console.log(status.tag); // "Ready"
     * ```
     */
    parse(
        dataObj: Partial<ALL>
    ): EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL>;
};

/**
 * Creates a new enum type with the specified variants.
 *
 * This is the main entry point for creating enums. It returns an object
 * where each variant name is a constructor function.
 *
 * @template ALL - The VariantsRecord defining all variants
 * @param args - Optional configuration
 * @param args.keys - Pre-define variant keys for better performance (avoids Proxy)
 * @returns Enum instance with variant constructors
 */
export function IronEnum<ALL extends VariantsRecord>(args?: {
    keys?: (keyof ALL & string)[];
}): "_" extends keyof ALL ? "ERROR: '_' is reserved!" : IronEnumInstance<ALL> {
    const keys = args?.keys;

    // `result` is declared here so it can be captured in the closure
    // by `parse` and the variant constructors.
    let result: IronEnumInstance<ALL> = {} as any;

    // Shared parse implementation
    const parse = (dataObj: Partial<ALL>) => {
        const objKeys = Object.keys(dataObj);
        if (objKeys.length !== 1)
            throw new Error(`Expected exactly 1 variant key, got ${objKeys.length}`);
        const actualKey = objKeys[0] as keyof ALL & string;
        if (keys?.length && !keys.includes(actualKey))
            throw new Error(`Unexpected variant '${actualKey}'`);
        return enumFactory<ALL, typeof actualKey>(
            {} as ALL,
            actualKey,
            dataObj[actualKey] as ALL[typeof actualKey],
            result
        );
    };

    if (keys?.length) {
        // Pre-allocated object version (better performance, no Proxy)
        result = { _: { parse } } as IronEnumInstance<ALL>;
        for (const key of keys) {
            result[key] = ((...args: [any?]) =>
                enumFactory<ALL, typeof key>(
                    {} as ALL,
                    key,
                    args[0] as ALL[typeof key],
                    result
                )) as any;
        }
        return result as any;
    }

    // Proxy version (dynamic property access)
    result = new Proxy(
        {},
        {
            get: (_tgt, prop: string) => {
                if (prop === "_") return { parse };
                return (...args: [any?]) => {
                    const data = args[0] as ALL[typeof prop];
                    return enumFactory<ALL, typeof prop>({} as ALL, prop, data, result);
                };
            },
        }
    ) as any;

    return result as any;
}

// -----------------------------------------------------------------------------
// Result Type (Rust-style Error Handling)
// -----------------------------------------------------------------------------

/**
 * Additional methods available on Result instances for Rust-style error handling.
 *
 * @template T - The success value type
 */
type ExtendedRustMethods<T> = {
    /**
     * Extracts the success value or throws the error.
     *
     * @returns The success value
     * @throws The error if Result is Err
     */
    unwrap(): T;

    /**
     * Returns the success value or the provided default.
     *
     * @param value - Default value to return if Result is Err
     * @returns Success value or default
     */
    unwrap_or<R>(value: R): R | T;

    /**
     * Returns the success value or computes a default.
     *
     * @param cb - Function to compute default value
     * @returns Success value or computed default
     */
    unwrap_or_else<R>(cb: () => R): R | T;
};

/**
 * Result-specific methods for error handling patterns.
 *
 * @template ALL - Must have Ok and Err variants
 */
type ResultMethods<ALL extends { Ok: unknown; Err: unknown }> = {
    /**
     * Converts Result to Option, discarding the error.
     *
     * @returns Some with value if Ok, None if Err
     */
    ok(): OptionFactory<{ Some: ALL["Ok"]; None: undefined }>;

    /**
     * Checks if Result is Ok variant.
     *
     * @returns true if Ok, false if Err
     */
    isOk(): boolean;

    /**
     * Checks if Result is Err variant.
     *
     * @returns true if Err, false if Ok
     */
    isErr(): boolean;
};

/**
 * A Result enum instance with Ok/Err variants and additional methods.
 * Combines standard enum methods with Result-specific utilities.
 *
 * @template ALL - Must contain Ok and Err variants
 */
export type ResultFactory<ALL extends { Ok: unknown; Err: unknown }> =
    EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL> &
    ExtendedRustMethods<ALL["Ok"]> &
    ResultMethods<ALL>;

/**
 * Result enum constructor type with Ok and Err variant creators.
 *
 * @template ALL - Must contain Ok and Err variants
 */
export type ResultInstance<ALL extends { Ok: unknown; Err: unknown }> = {
    /**
     * Creates a successful Result.
     */
    Ok(data: ALL["Ok"]): ResultFactory<ALL>;

    /**
     * Creates a failed Result.
     */
    Err(data: ALL["Err"]): ResultFactory<ALL>;

    /**
     * Metadata and utilities.
     */
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>>;
};

/**
 * Creates a Result type for Rust-style error handling.
 *
 * Result represents either success (Ok) or failure (Err), forcing
 * explicit error handling through pattern matching.
 *
 * @template T - The success value type
 * @template E - The error value type
 * @returns Result enum constructor
 */
const ResultInternal: <T, E>() => ResultInstance<{
    Ok: T;
    Err: E;
}> = <T, E>(): ResultInstance<{ Ok: T; Err: E }> => {
    const R = IronEnum<{ Ok: T; Err: E }>({keys: ["Err", "Ok"]});
    return {
        _: R._ as any,
        Ok: (value) => ({
            ...R.Ok(value),
            unwrap: () => value,
            unwrap_or: () => value,
            unwrap_or_else: () => value,
            isOk: () => true,
            isErr: () => false,
            ok: () => _OPTION_SINGLETON.Some(value),
        }),
        Err: (error) => ({
            ...R.Err(error),
            unwrap: () => {
                throw error instanceof Error
                    ? error
                    : new Error(String(error ?? "Err"));
            },
            unwrap_or: (x) => x,
            unwrap_or_else: (cb) => cb(),
            isOk: () => false,
            isErr: () => true,
            ok: () => _OPTION_SINGLETON.None(),
        }),
    };
};

// Create a single, reusable instance
const _RESULT_SINGLETON = ResultInternal<any, any>();

/**
 * Creates a Result type for Rust-style error handling.
 *
 * Result represents either success (Ok) or failure (Err), forcing
 * explicit error handling through pattern matching.
 *
 * @template T - The success value type
 * @template E - The error value type
 * @returns Result enum constructor
 */
export const Result: <T, E>() => ResultInstance<{
    Ok: T;
    Err: E;
}> = <T, E>(): ResultInstance<{ Ok: T; Err: E }> => _RESULT_SINGLETON as any;


/**
 * Convenience function to create a successful Result.
 *
 * @template T - The success value type
 * @param value - The success value
 * @returns Result in Ok state
 */
export const Ok: <T>(value: T) => ResultFactory<{
    Ok: T;
    Err: unknown;
}> = <T>(value: T) => Result<T, unknown>().Ok(value);

/**
 * Convenience function to create a failed Result.
 *
 * @template E - The error value type
 * @param error - The error value
 * @returns Result in Err state
 */
export const Err: <E>(error: E) => ResultFactory<{
    Ok: unknown;
    Err: E;
}> = <E>(error: E) => Result<unknown, E>().Err(error);

// -----------------------------------------------------------------------------
// Option Type (Rust-style Nullable Values)
// -----------------------------------------------------------------------------

/**
 * Additional methods available on Option instances for nullable value handling.
 *
 * @template OK - The Some value type
 */
type OptionMethods<OK> = {
    /**
     * Converts Option to Result with the provided error.
     *
     * @param err - Error value for None case
     * @returns Ok if Some, Err if None
     */
    ok_or<E>(err: E): ResultFactory<{ Ok: OK; Err: E }>;

    /**
     * Converts Option to Result with a computed error.
     *
     * @param err - Function to compute error value
     * @returns Ok if Some, Err if None
     */
    ok_or_else<E>(err: () => E): ResultFactory<{ Ok: OK; Err: E }>;

    /**
     * Checks if Option contains a value.
     *
     * @returns true if Some, false if None
     */
    isSome(): boolean;

    /**
     * Checks if Option is empty.
     *
     * @returns true if None, false if Some
     */
    isNone(): boolean;
};

/**
 * An Option enum instance with Some/None variants and additional methods.
 * Combines standard enum methods with Option-specific utilities.
 *
 * @template ALL - Must contain Some and None variants
 */
export type OptionFactory<ALL extends { Some: unknown; None: undefined }> =
    EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL> &
    ExtendedRustMethods<ALL["Some"]> &
    OptionMethods<ALL["Some"]>;

/**
 * Option enum constructor type with Some and None variant creators.
 *
 * @template ALL - Must contain Some and None variants
 */
export type OptionInstance<ALL extends { Some: unknown; None: undefined }> = {
    /**
     * Creates an Option with a value.
     */
    Some(data: ALL["Some"]): OptionFactory<ALL>;

    /**
     * Creates an empty Option.
     */
    None(): OptionFactory<ALL>;

    /**
     * Metadata and utilities.
     */
    _: EnumProperties<
        ALL,
        ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>
    >;
};

/**
 * Internal factory for creating the Option singleton.
 * @internal
 */
const OptionInternal: <T>() => OptionInstance<{
    Some: T;
    None: undefined;
}> = <T>(): OptionInstance<{ Some: T; None: undefined }> => {
    const O = IronEnum<{ Some: T; None: undefined }>({keys: ["None", "Some"]});
    return {
        _: O._ as any,
        Some: (value) => ({
            ...O.Some(value),
            isSome: () => true,
            isNone: () => false,
            unwrap: () => value,
            unwrap_or: () => value,
            unwrap_or_else: () => value,
            ok_or: (err) => _RESULT_SINGLETON.Ok(value),
            ok_or_else: (errFn) => _RESULT_SINGLETON.Ok(value),
        }),
        None: () => ({
            ...O.None(),
            isSome: () => false,
            isNone: () => true,
            unwrap: () => {
                throw new Error("Called unwrap() on Option.None");
            },
            unwrap_or: (x) => x,
            unwrap_or_else: (cb) => cb(),
            ok_or: (err) => _RESULT_SINGLETON.Err(err),
            ok_or_else: (errFn) => _RESULT_SINGLETON.Err(errFn()),
        }),
    };
};

// Create a single, reusable instance
const _OPTION_SINGLETON = OptionInternal<any>();

/**
 * Creates an Option type for Rust-style nullable value handling.
 *
 * Option represents either a value (Some) or no value (None),
 * providing a type-safe alternative to null/undefined.
 *
 * @template T - The value type when present
 * @returns Option enum constructor
 */
export const Option: <T>() => OptionInstance<{
    Some: T;
    None: undefined;
}> = <T>(): OptionInstance<{ Some: T; None: undefined }> => _OPTION_SINGLETON as any;

/**
 * Convenience function to create an Option with a value.
 *
 * @template T - The value type
 * @param value - The value to wrap
 * @returns Option in Some state
 */
export const Some: <T>(value: T) => OptionFactory<{
    Some: T;
    None: undefined;
}> = <T>(value: T) => Option<T>().Some(value);

/**
 * Convenience function to create an empty Option.
 *
 * @returns Option in None state
 */
export const None: () => OptionFactory<{
    Some: unknown;
    None: undefined;
}> = () => Option().None();

// -----------------------------------------------------------------------------
// Try/TryInto Utilities (Exception Handling)
// -----------------------------------------------------------------------------

/**
 * Utilities for converting exception-throwing code into Result-returning code.
 * Provides both immediate execution (Try) and function wrapping (TryInto).
 */
export const Try: {
    /**
     * Executes a synchronous function and wraps the result in a Result.
     *
     * @template X - The return type of the callback
     * @param cb - Function to execute
     * @returns Ok with result if successful, Err with exception if thrown
     */
    sync<X>(cb: () => X): ResultFactory<{
        Ok: X;
        Err: unknown;
    }>;

    /**
     * Executes an asynchronous function and wraps the result in a Result.
     *
     * @template X - The resolved type of the Promise
     * @param cb - Async function to execute
     * @returns Promise of Result - Ok if resolved, Err if rejected
     */
    async<X>(cb: () => Promise<X>): Promise<
        ResultFactory<{
            Ok: X;
            Err: unknown;
        }>
    >;
} = {
    sync<X>(cb: () => X): ResultFactory<{ Ok: X; Err: unknown }> {
        try {
            return _RESULT_SINGLETON.Ok(cb()) as ResultFactory<{ Ok: X; Err: unknown }>;
        } catch (e) {
            return _RESULT_SINGLETON.Err(e) as ResultFactory<{ Ok: X; Err: unknown }>;
        }
    },

    async async<X>(
        cb: () => Promise<X>
    ): Promise<ResultFactory<{ Ok: X; Err: unknown }>> {
        try {
            return _RESULT_SINGLETON.Ok(await cb()) as ResultFactory<{ Ok: X; Err: unknown }>;
        } catch (e) {
            return _RESULT_SINGLETON.Err(e) as ResultFactory<{ Ok: X; Err: unknown }>;
        }
    },
};

/**
 * Transforms exception-throwing functions into Result-returning functions.
 * Useful for safely wrapping existing APIs that might throw.
 */
export const TryInto: {
    /**
     * Wraps a synchronous function to return Result instead of throwing.
     *
     * @template X - The return type
     * @template Y - The parameter types
     * @param cb - Function to wrap
     * @returns Wrapped function that returns Result
     */
    sync<X, Y extends any[]>(
        cb: (...args: Y) => X
    ): (...args: Y) => ResultFactory<{
        Ok: X;
        Err: unknown;
    }>;

    /**
     * Wraps an asynchronous function to return Result instead of throwing.
     *
     * @template X - The resolved type
     * @template Y - The parameter types
     * @param cb - Async function to wrap
     * @returns Wrapped function that returns Promise<Result>
     */
    async<X, Y extends any[]>(
        cb: (...args: Y) => Promise<X>
    ): (...args: Y) => Promise<
        ResultFactory<{
            Ok: X;
            Err: unknown;
        }>
    >;
} = {
    sync<X, Y extends any[]>(cb: (...args: Y) => X) {
        return (...args: Y) => Try.sync(() => cb(...args));
    },

    async<X, Y extends any[]>(cb: (...args: Y) => Promise<X>) {
        return async (...args: Y) => Try.async(() => cb(...args));
    },
};