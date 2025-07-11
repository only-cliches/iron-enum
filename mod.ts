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
 *   Loading: undefined;
 *   Ready: { finishedAt: Date };
 *   Error: { message: string; code: number };
 * }>();
 *
 * // Create instances
 * const loading = Status.Loading();
 * const ready = Status.Ready({ finishedAt: new Date() });
 *
 * // Pattern match to handle all cases
 * const message = ready.match({
 *   Loading: () => "Still working…",
 *   Ready: ({ finishedAt }) => `Done at ${finishedAt.toISOString()}`,
 *   Error: ({ message }) => `Failed: ${message}`
 * });
 * ```
 *
 * @example Using Result and Option types
 * ```ts
 * // Result type for error handling
 * function divide(a: number, b: number): Result<number, string> {
 *   return b === 0 ? Err("Division by zero") : Ok(a / b);
 * }
 *
 * // Option type for nullable values
 * function findUser(id: string): Option<User> {
 *   const user = users.find(u => u.id === id);
 *   return user ? Some(user) : None();
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
 *   Success: { data: string };  // Variant with payload
 *   Loading: undefined;         // Variant without payload
 *   Error: { code: number };    // Another variant with payload
 * }
 * ```
 */
export type VariantsRecord = {
  [K in Exclude<string, "_">]: any;
};

/**
 * Helper type that creates a union of all possible payload types
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
 * Type predicate that checks if a type T is an object where every
 * property is optional. Used to determine constructor signatures.
 *
 * @internal
 */
type IsAllOptionalObject<T> = T extends object
  ? {} extends T
    ? true
    : false
  : false;

/**
 * Determines the appropriate constructor signature for a variant based
 * on its payload type:
 * - `undefined/null/void` → No arguments required
 * - All-optional object → Optional argument
 * - Otherwise → Required argument
 *
 * @internal
 */
type VariantConstructor<
  Default,
  K extends string,
  ALL extends VariantsRecord
> = [Default] extends [undefined | null | void]
  ? () => EnumFactory<K, Default, ALL>
  : IsAllOptionalObject<Default> extends true
  ? <P extends Default = Default>(data?: P) => EnumFactory<K, P, ALL>
  : <P extends Default>(data: P) => EnumFactory<K, P, ALL>;

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
   *   case "Success":
   *     console.log(value.payload); // TypeScript knows the payload type
   *     break;
   * }
   * ```
   */
  tag: TAG;

  /**
   * Union of all possible payloads. Useful for TypeScript type narrowing
   * but typically you'll use `payload` instead.
   *
   * @internal
   */
  data: EnumUnion<ALL>;

  /**
   * The actual payload data for this specific variant.
   * Type-safe access to the variant's associated data.
   */
  payload: PAYLOAD;
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
   * @param failure - Callback executed if variant doesn't match
   * @returns Boolean if no callbacks provided, otherwise callback result
   *
   * @example
   * ```ts
   * // Simple boolean check
   * if (result.if("Ok")) {
   *   console.log("Operation succeeded");
   * }
   *
   * // With callbacks
   * const message = result.if(
   *   "Ok",
   *   (value) => `Success: ${value}`,
   *   () => "Operation failed"
   * );
   * ```
   */
  if<K extends keyof ALL & string, RIf = void, RElse = void>(
    key: K,
    success?: ALL[K] extends undefined | null
      ? () => RIf
      : (payload: ALL[K]) => RIf,
    failure?: (json: Partial<ALL>) => RElse
  ): IfReturn<RIf, RElse>;

  /**
   * Inverse conditional execution. Executes success callback when
   * variant does NOT match the specified key.
   *
   * @param key - The variant name to check against
   * @param success - Callback executed if variant doesn't match
   * @param failure - Callback executed if variant matches
   * @returns Boolean if no callbacks provided, otherwise callback result
   *
   * @example
   * ```ts
   * result.ifNot(
   *   "Error",
   *   () => console.log("No error occurred"),
   *   () => console.log("Error state detected")
   * );
   * ```
   */
  ifNot<K extends keyof ALL & string, RIf = void, RElse = void>(
    key: K,
    success?: (json: Partial<ALL>) => RIf,
    failure?: (json: Partial<ALL>) => RElse
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
   *   Loading: () => "Please wait...",
   *   Ready: ({ data }) => `Data: ${data}`,
   *   Error: ({ message }) => `Error: ${message}`
   * });
   *
   * // With fallback using '_'
   * const simplified = status.match({
   *   Ready: ({ data }) => data,
   *   _: () => null  // Handles Loading and Error
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
   *   Loading: async () => "Please wait...",
   *   Ready: async ({ data }) => {
   *     const processed = await processData(data);
   *     return processed;
   *   },
   *   Error: async ({ message }) => {
   *     await logError(message);
   *     return null;
   *   }
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
 *
 * @internal
 */
type ObjectToFunctionMapBase<T, R> = {
  [K in keyof T]?: T[K] extends undefined | null ? () => R : (args: T[K]) => R;
};

/**
 * Maps variant names to synchronous handler functions.
 *
 * @internal
 */
type ObjectToFunctionMap<T> = ObjectToFunctionMapBase<T, any>;

/**
 * Maps variant names to asynchronous handler functions.
 *
 * @internal
 */
type ObjectToFunctionMapAsync<T> = ObjectToFunctionMapBase<T, Promise<any>>;

/**
 * Valid handler configurations for pattern matching.
 * Either all variants must be handled, or a '_' fallback must be provided.
 *
 * @internal
 */
type MatchFns<X extends VariantsRecord> =
  | NonOptional<ObjectToFunctionMap<X>>
  | (ObjectToFunctionMap<X> & { _: () => any });

/**
 * Valid async handler configurations for pattern matching.
 *
 * @internal
 */
type MatchFnsAsync<X extends VariantsRecord> =
  | NonOptional<ObjectToFunctionMapAsync<X>>
  | (ObjectToFunctionMapAsync<X> & { _: () => Promise<any> });

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
 * Creates the `if` method for enum instances.
 *
 * @internal
 */
function makeIf<ALL extends VariantsRecord, TAG extends keyof ALL & string>(
  tag: TAG,
  data: ALL[TAG]
) {
  return function _if<K extends keyof ALL & string, RIf = void, RElse = void>(
    key: K,
    success?: ALL[K] extends undefined | null
      ? () => RIf
      : (payload: ALL[K]) => RIf,
    failure?: (json: Partial<ALL>) => RElse
  ): IfReturn<RIf, RElse> {
    const isHit = key === (tag as unknown as K);

    if (isHit) {
      if (success) {
        const r = (
          data == null
            ? (success as () => RIf)()
            : (success as (payload: ALL[K]) => RIf)(data)
        ) as RIf;
        return (r === undefined ? true : r) as IfReturn<RIf, RElse>;
      }
      return true as IfReturn<RIf, RElse>;
    }

    if (failure) {
      const r = failure({ [tag]: data } as unknown as Partial<ALL>) as RElse;
      return (r === undefined ? false : r) as IfReturn<RIf, RElse>;
    }
    return false as IfReturn<RIf, RElse>;
  };
}

/**
 * Creates the `ifNot` method for enum instances.
 *
 * @internal
 */
function makeIfNot<ALL extends VariantsRecord, TAG extends keyof ALL & string>(
  tag: TAG,
  data: ALL[TAG]
) {
  return function _ifNot<
    K extends keyof ALL & string,
    RIf = void,
    RElse = void
  >(
    key: K,
    success?: (json: Partial<ALL>) => RIf,
    failure?: (json: Partial<ALL>) => RElse
  ): IfReturn<RIf, RElse> {
    const isMiss = key !== (tag as unknown as K);

    if (isMiss) {
      if (success) {
        const r = success({ [tag]: data } as unknown as Partial<ALL>) as RIf;
        return (r === undefined ? true : r) as IfReturn<RIf, RElse>;
      }
      return true as IfReturn<RIf, RElse>;
    }

    if (failure) {
      const r = failure({ [tag]: data } as unknown as Partial<ALL>) as RElse;
      return (r === undefined ? false : r) as IfReturn<RIf, RElse>;
    }
    return false as IfReturn<RIf, RElse>;
  };
}

/**
 * Core factory function that creates enum instances with all methods attached.
 *
 * @internal
 */
function enumFactory<
  ALL extends VariantsRecord,
  TAG extends keyof ALL & string
>(allVariants: ALL, tag: TAG, data: ALL[TAG]): EnumFactory<TAG, ALL[TAG], ALL> {
  if (tag === "_") throw new Error("'_' is reserved as a fallback key.");

  return {
    tag,
    data,
    payload: data,
    toJSON: () => ({ [tag]: data } as unknown as Partial<ALL>),
    key: () => tag,
    if: makeIf<ALL, TAG>(tag, data),
    ifNot: makeIfNot<ALL, TAG>(tag, data),
    match: (callbacks) => {
      const cb = callbacks[tag] ?? callbacks._;
      if (!cb)
        throw new Error(
          `No handler for variant '${String(tag)}' and no '_' fallback`
        );
      return (cb as any)(data);
    },
    matchAsync: async (callbacks) => {
      const cb = callbacks[tag] ?? callbacks._;
      if (!cb)
        throw new Error(
          `No handler for variant '${String(tag)}' and no '_' fallback`
        );
      return (cb as any)(data);
    },
  };
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
 *   Idle: undefined;
 *   Working: { taskId: string };
 *   Done: { result: any };
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
   * Reference to the enum factory instance.
   */
  factory: IronEnumInstance<ALL>;

  /**
   * Union type of all possible enum instances.
   * Useful for function parameters that accept any variant.
   *
   * @example
   * ```ts
   * function processStatus(status: typeof Status._["typeOf"]) {
   *   // Can handle any Status variant
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
 *
 * @example Basic enum
 * ```ts
 * const Direction = IronEnum<{
 *   North: undefined;
 *   South: undefined;
 *   East: undefined;
 *   West: undefined;
 * }>();
 *
 * const heading = Direction.North();
 * ```
 *
 * @example Enum with payloads
 * ```ts
 * const Result = IronEnum<{
 *   Success: { value: number };
 *   Failure: { error: string };
 * }>();
 *
 * const ok = Result.Success({ value: 42 });
 * const err = Result.Failure({ error: "Invalid input" });
 * ```
 *
 * @example Performance optimization with pre-defined keys
 * ```ts
 * const Status = IronEnum<{
 *   Idle: undefined;
 *   Running: { pid: number };
 *   Stopped: { code: number };
 * }>({
 *   keys: ["Idle", "Running", "Stopped"]
 * });
 * ```
 */
export function IronEnum<ALL extends VariantsRecord>(args?: {
  keys?: (keyof ALL & string)[];
}): "_" extends keyof ALL ? "ERROR: '_' is reserved!" : IronEnumInstance<ALL> {
  const keys = args?.keys;

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
      dataObj[actualKey] as ALL[typeof actualKey]
    );
  };

  if (keys?.length) {
    // Pre-allocated object version (better performance, no Proxy)
    const out = { _: { parse } } as IronEnumInstance<ALL>;
    for (const key of keys) {
      out[key] = ((data?: ALL[typeof key]) =>
        enumFactory<ALL, typeof key>(
          {} as ALL,
          key,
          data as ALL[typeof key]
        )) as any;
    }
    return out as any;
  }

  // Proxy version (dynamic property access)
  return new Proxy(
    {},
    {
      get: (_tgt, prop: string) => {
        if (prop === "_") return { parse };
        return (...args: [any?]) => {
          const data =
            args.length === 0
              ? ({} as ALL[typeof prop])
              : (args[0] as ALL[typeof prop]);
          return enumFactory<ALL, typeof prop>({} as ALL, prop, data);
        };
      },
    }
  ) as any;
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
   *
   * @example
   * ```ts
   * const result = Ok(42);
   * console.log(result.unwrap()); // 42
   *
   * const error = Err("Failed");
   * error.unwrap(); // Throws error
   * ```
   */
  unwrap(): T;

  /**
   * Returns the success value or the provided default.
   *
   * @param value - Default value to return if Result is Err
   * @returns Success value or default
   *
   * @example
   * ```ts
   * Ok(42).unwrap_or(0);  // 42
   * Err("Failed").unwrap_or(0);  // 0
   * ```
   */
  unwrap_or<R>(value: R): R | T;

  /**
   * Returns the success value or computes a default.
   *
   * @param cb - Function to compute default value
   * @returns Success value or computed default
   *
   * @example
   * ```ts
   * Ok(42).unwrap_or_else(() => 0);  // 42
   * Err("Failed").unwrap_or_else(() => 0);  // 0
   * ```
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
   *
   * @example
   * ```ts
   * Ok(42).ok();        // Some(42)
   * Err("Failed").ok(); // None()
   * ```
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
   *
   * @param data - The success value
   * @returns Result in Ok state
   */
  Ok(data: ALL["Ok"]): ResultFactory<ALL>;

  /**
   * Creates a failed Result.
   *
   * @param data - The error value
   * @returns Result in Err state
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
 *
 * @example
 * ```ts
 * // Define a Result type
 * type DivResult = Result<number, string>;
 * const DivResult = Result<number, string>();
 *
 * function divide(a: number, b: number): DivResult {
 *   if (b === 0) {
 *     return DivResult.Err("Division by zero");
 *   }
 *   return DivResult.Ok(a / b);
 * }
 *
 * // Use the Result
 * const result = divide(10, 2);
 * result.match({
 *   Ok: (value) => console.log(`Result: ${value}`),
 *   Err: (error) => console.error(`Error: ${error}`)
 * });
 * ```
 */
export const Result: <T, E>() => ResultInstance<{
  Ok: T;
  Err: E;
}> = <T, E>(): ResultInstance<{ Ok: T; Err: E }> => {
  const R = IronEnum<{ Ok: T; Err: E }>();
  return {
    _: R._ as any,
    Ok: (value) => ({
      ...R.Ok(value),
      _: { new: R },
      unwrap: () => value,
      unwrap_or: () => value,
      unwrap_or_else: () => value,
      isOk: () => true,
      isErr: () => false,
      ok: () => Option<T>().Some(value),
    }),
    Err: (error) => ({
      ...R.Err(error),
      _: { new: R },
      unwrap: () => {
        throw error instanceof Error
          ? error
          : new Error(String(error ?? "Err"));
      },
      unwrap_or: (x) => x,
      unwrap_or_else: (cb) => cb(),
      isOk: () => false,
      isErr: () => true,
      ok: () => Option<T>().None(),
    }),
  };
};

/**
 * Convenience function to create a successful Result.
 *
 * @template T - The success value type
 * @param value - The success value
 * @returns Result in Ok state
 *
 * @example
 * ```ts
 * const result = Ok(42);
 * console.log(result.isOk()); // true
 * ```
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
 *
 * @example
 * ```ts
 * const result = Err("Something went wrong");
 * console.log(result.isErr()); // true
 * ```
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
   *
   * @example
   * ```ts
   * Some(42).ok_or("Missing");     // Ok(42)
   * None().ok_or("Missing");        // Err("Missing")
   * ```
   */
  ok_or<E>(err: E): ResultFactory<{ Ok: OK; Err: E }>;

  /**
   * Converts Option to Result with a computed error.
   *
   * @param err - Function to compute error value
   * @returns Ok if Some, Err if None
   *
   * @example
   * ```ts
   * Some(42).ok_or_else(() => new Error("Missing")); // Ok(42)
   * None().ok_or_else(() => new Error("Missing"));   // Err(Error)
   * ```
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
   *
   * @param data - The contained value
   * @returns Option in Some state
   */
  Some(data: ALL["Some"]): OptionFactory<ALL>;

  /**
   * Creates an empty Option.
   *
   * @returns Option in None state
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
 * Creates an Option type for Rust-style nullable value handling.
 *
 * Option represents either a value (Some) or no value (None),
 * providing a type-safe alternative to null/undefined.
 *
 * @template T - The value type when present
 * @returns Option enum constructor
 *
 * @example
 * ```ts
 * // Define an Option type
 * type MaybeUser = Option<User>;
 * const MaybeUser = Option<User>();
 *
 * function findUser(id: string): MaybeUser {
 *   const user = database.find(u => u.id === id);
 *   return user ? MaybeUser.Some(user) : MaybeUser.None();
 * }
 *
 * // Use the Option
 * const maybeUser = findUser("123");
 * maybeUser.match({
 *   Some: (user) => console.log(`Found: ${user.name}`),
 *   None: () => console.log("User not found")
 * });
 *
 * // Convert to Result
 * const userResult = maybeUser.ok_or("User not found");
 * ```
 */
export const Option: <T>() => OptionInstance<{
  Some: T;
  None: undefined;
}> = <T>(): OptionInstance<{ Some: T; None: undefined }> => {
  const O = IronEnum<{ Some: T; None: undefined }>();
  return {
    _: O._ as any,
    Some: (value) => ({
      ...O.Some(value),
      _: { new: O },
      isSome: () => true,
      isNone: () => false,
      unwrap: () => value,
      unwrap_or: () => value,
      unwrap_or_else: () => value,
      ok_or: (err) => Result<T, typeof err>().Ok(value),
      ok_or_else: (errFn) => Result<T, ReturnType<typeof errFn>>().Ok(value),
    }),
    None: () => ({
      ...O.None(),
      _: { new: O },
      isSome: () => false,
      isNone: () => true,
      unwrap: () => {
        throw new Error("Called unwrap() on Option.None");
      },
      unwrap_or: (x) => x,
      unwrap_or_else: (cb) => cb(),
      ok_or: (err) => Result<T, typeof err>().Err(err),
      ok_or_else: (errFn) => Result<T, ReturnType<typeof errFn>>().Err(errFn()),
    }),
  };
};

/**
 * Convenience function to create an Option with a value.
 *
 * @template T - The value type
 * @param value - The value to wrap
 * @returns Option in Some state
 *
 * @example
 * ```ts
 * const maybeNumber = Some(42);
 * console.log(maybeNumber.isSome()); // true
 * console.log(maybeNumber.unwrap()); // 42
 * ```
 */
export const Some: <T>(value: T) => OptionFactory<{
  Some: T;
  None: undefined;
}> = <T>(value: T) => Option<T>().Some(value);

/**
 * Convenience function to create an empty Option.
 *
 * @returns Option in None state
 *
 * @example
 * ```ts
 * const empty = None();
 * console.log(empty.isNone()); // true
 * empty.unwrap(); // Throws error
 * ```
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
 *
 * @example
 * ```ts
 * // Immediate execution
 * const result = Try.sync(() => JSON.parse('{"valid": true}'));
 *
 * // Async execution
 * const asyncResult = await Try.async(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 *
 * // Function wrapping
 * const safeParse = TryInto.sync(JSON.parse);
 * const safeResult = safeParse('{"valid": true}');
 * ```
 */
export const Try: {
  /**
   * Executes a synchronous function and wraps the result in a Result.
   *
   * @template X - The return type of the callback
   * @param cb - Function to execute
   * @returns Ok with result if successful, Err with exception if thrown
   *
   * @example
   * ```ts
   * const result = Try.sync(() => {
   *   if (Math.random() > 0.5) throw new Error("Bad luck");
   *   return "Success!";
   * });
   *
   * result.match({
   *   Ok: (value) => console.log(value),
   *   Err: (error) => console.error("Failed:", error)
   * });
   * ```
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
   *
   * @example
   * ```ts
   * const result = await Try.async(async () => {
   *   const response = await fetch('/api/data');
   *   if (!response.ok) throw new Error('Request failed');
   *   return response.json();
   * });
   *
   * if (result.isOk()) {
   *   console.log("Data:", result.unwrap());
   * }
   * ```
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
      return Result<X, unknown>().Ok(cb());
    } catch (e) {
      return Result<X, unknown>().Err(e);
    }
  },

  async async<X>(
    cb: () => Promise<X>
  ): Promise<ResultFactory<{ Ok: X; Err: unknown }>> {
    try {
      return Result<X, unknown>().Ok(await cb());
    } catch (e) {
      return Result<X, unknown>().Err(e);
    }
  },
};

/**
 * Transforms exception-throwing functions into Result-returning functions.
 * Useful for safely wrapping existing APIs that might throw.
 *
 * @example
 * ```ts
 * // Wrap a potentially throwing function
 * const safeParse = TryInto.sync(JSON.parse);
 *
 * // Now it returns a Result instead of throwing
 * const result = safeParse('{"valid": true}');
 * if (result.isOk()) {
 *   console.log("Parsed:", result.unwrap());
 * }
 *
 * // Works with async functions too
 * const safeReadFile = TryInto.async(fs.promises.readFile);
 * const fileResult = await safeReadFile('./data.json', 'utf8');
 * ```
 */
export const TryInto: {
  /**
   * Wraps a synchronous function to return Result instead of throwing.
   *
   * @template X - The return type
   * @template Y - The parameter types
   * @param cb - Function to wrap
   * @returns Wrapped function that returns Result
   *
   * @example
   * ```ts
   * const divide = (a: number, b: number): number => {
   *   if (b === 0) throw new Error("Division by zero");
   *   return a / b;
   * };
   *
   * const safeDivide = TryInto.sync(divide);
   * const result = safeDivide(10, 0); // Returns Err instead of throwing
   * ```
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
   *
   * @example
   * ```ts
   * const fetchUser = async (id: string): Promise<User> => {
   *   const response = await fetch(`/api/users/${id}`);
   *   if (!response.ok) throw new Error('User not found');
   *   return response.json();
   * };
   *
   * const safeFetchUser = TryInto.async(fetchUser);
   * const result = await safeFetchUser("123"); // Returns Result
   * ```
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
