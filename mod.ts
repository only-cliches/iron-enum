/**
 * IronEnum – Zero‑dependency Rust‑style tagged‑union helpers for TypeScript.
 *
 * Features
 * --------
 * • Ergonomic, type‑safe constructors
 * • `match` / `matchAsync` for pattern matching
 * • Fluent guards: `if`, `ifNot`
 * • `Option`, `Result`, `Try`, `TryInto` convenience wrappers
 *
 * @example
 * ```ts
 * const Status = IronEnum<{ Loading: undefined; Ready: { finishedAt: Date } }>();
 *
 * const a = Status.Loading();
 * const b = Status.Ready({ finishedAt: new Date() });
 *
 * console.log(
 *   a.match({
 *     Loading: () => "still working…",
 *     Ready:   ({ finishedAt }) => `done at ${finishedAt}`,
 *   }),
 * );
 * ```
 */

// -----------------------------------------------------------------------------
// Core Types
// -----------------------------------------------------------------------------

/** Maps variant names to their payload types. */
export type VariantsRecord = {
  [K in Exclude<string, "_">]: any;
};

/** Union of all payload types for a given `VariantsRecord`. */
type EnumUnion<ALL extends VariantsRecord> = {
  [K in keyof ALL & string]: ALL[K];
}[keyof ALL & string];

export type EnumFactoryUnion<ALL extends VariantsRecord> = {
  [K in keyof ALL & string]: EnumFactory<K, ALL[K], ALL>;
}[keyof ALL & string];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** `true` if `T` is an object where *every* key is optional. */
type IsAllOptionalObject<T> = T extends object
  ? {} extends T
    ? true
    : false
  : false;

// Variant constructor
// – no‑data  → 0‑arg
// – optional object → 0–1 arg
// – otherwise      → 1‑arg
// (kept as separate type for readability)

type VariantConstructor<
  Default,
  K extends string,
  ALL extends VariantsRecord
> = [Default] extends [undefined | null | void]
  ? () => EnumFactory<K, Default, ALL>
  : IsAllOptionalObject<Default> extends true
  ? <P extends Default = Default>(data?: P) => EnumFactory<K, P, ALL>
  : <P extends Default>(data: P) => EnumFactory<K, P, ALL>;

type IfReturn<RIf, RElse> = [RIf, RElse] extends [void, void]
  ? boolean
  : RIf extends void
  ? boolean | Exclude<RElse, void>
  : RElse extends void
  ? boolean | Exclude<RIf, void>
  : Exclude<RIf, void> | Exclude<RElse, void>;

// -----------------------------------------------------------------------------
// Public Factories & Methods
// -----------------------------------------------------------------------------

/**
 * A single constructed enum value.
 *
 * @template TAG     Variant key
 * @template PAYLOAD Associated data for this variant
 * @template ALL     Complete `VariantsRecord`
 */
export type EnumFactory<
  TAG extends keyof ALL & string,
  PAYLOAD,
  ALL extends VariantsRecord
> = {
  /** Discriminant */
  tag: TAG;
  /** Full variant payload union (handy for type narrowing) */
  data: EnumUnion<ALL>;
  /** Payload for this variant */
  payload: PAYLOAD;
} & EnumMethods<ALL>;

/** Runtime helpers available on every constructed enum value. */
export interface EnumMethods<ALL extends VariantsRecord> {
  /** Plain `{ key: payload }` representation. */
  toJSON(): Partial<ALL>;
  /** Variant key. */
  key(): keyof ALL & string;

  /** Guard: run `success` if variant matches `key`, else `failure`. */
  if<K extends keyof ALL & string, RIf = void, RElse = void>(
    key: K,
    success?: ALL[K] extends undefined | null
      ? () => RIf
      : (payload: ALL[K]) => RIf,
    failure?: (json: Partial<ALL>) => RElse
  ): IfReturn<RIf, RElse>;

  /** Inverse of `if`. */
  ifNot<K extends keyof ALL & string, RIf = void, RElse = void>(
    key: K,
    success?: (json: Partial<ALL>) => RIf,
    failure?: (json: Partial<ALL>) => RElse
  ): IfReturn<RIf, RElse>;

  /** Pattern‑match variants (sync). Provide every key or `"_"` fallback. */
  match<A extends MatchFns<ALL>>(callbacks: A): MatchResult<A>;

  /** Async version of `match`. */
  matchAsync<A extends MatchFnsAsync<ALL>>(
    callbacks: A
  ): Promise<MatchResult<A>>;
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

type NonOptional<T> = { [K in keyof T]-?: T[K] };

type ObjectToFunctionMapBase<T, R> = {
  [K in keyof T]?: T[K] extends undefined | null ? () => R : (args: T[K]) => R;
};

type ObjectToFunctionMap<T> = ObjectToFunctionMapBase<T, any>;

type ObjectToFunctionMapAsync<T> = ObjectToFunctionMapBase<T, Promise<any>>;

/** Map of callbacks keyed by variant name (sync). */
type MatchFns<X extends VariantsRecord> =
  | NonOptional<ObjectToFunctionMap<X>>
  | (ObjectToFunctionMap<X> & { _: () => any });

/** Map of callbacks keyed by variant name (async). */
type MatchFnsAsync<X extends VariantsRecord> =
  | NonOptional<ObjectToFunctionMapAsync<X>>
  | (ObjectToFunctionMapAsync<X> & { _: () => Promise<any> });

/** Resolves the return type from a callback map. */
type MatchResult<A> = A extends { [K: string]: (...args: any) => infer R }
  ? R
  : never;

// -- helper factories (`if`, `ifNot`) ------------------------------------------------

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

// -- core variant factory -------------------------------------------------------------

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
// Enum builder (public)
// -----------------------------------------------------------------------------

export type IronEnumInstance<ALL extends VariantsRecord> = {
  [K in keyof ALL & string]: VariantConstructor<ALL[K], K, ALL>;
} & {
  /** Meta & helpers (e.g., `parse`). */
  _: EnumProperties<ALL, {}>;
};

/** Additional static helpers exposed via `MyEnum._`. */
export type EnumProperties<ALL extends VariantsRecord, AddedProps> = {
  /** Variant keys */
  typeKeys: keyof ALL;
  /** Original record */
  typeVariants: Partial<ALL>;
  /** Factory method type */
  factory: IronEnumInstance<ALL>;
  /** Union of all constructed variants */
  typeOf: EnumFactoryUnion<ALL> & AddedProps;
  /** Re‑create a variant from `{ key: payload }`. */
  parse(
    dataObj: Partial<ALL>
  ): EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL>;
};

/** Construct an enum builder from a `VariantsRecord`. */
export function IronEnum<ALL extends VariantsRecord>(args?: {
  /** Optional static keys to skip proxy creation. */
  keys?: (keyof ALL & string)[];
}): "_" extends keyof ALL ? "ERROR: '_' is reserved!" : IronEnumInstance<ALL> {
  const keys = args?.keys;

  // -- parser (shared) --------------------------------------------------------
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
    // Pre‑allocated object (no proxy)
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

  // Proxy version (lazy keys)
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
// Rust‑style Result
// -----------------------------------------------------------------------------

type ExtendedRustMethods<T> = {
  unwrap(): T;
  unwrap_or<R>(value: R): R | T;
  unwrap_or_else<R>(cb: () => R): R | T;
};

type ResultMethods<ALL extends { Ok: unknown; Err: unknown }> = {
  ok(): OptionFactory<{ Some: ALL["Ok"]; None: undefined }>;
  isOk(): boolean;
  isErr(): boolean;
};

export type ResultFactory<ALL extends { Ok: unknown; Err: unknown }> =
  EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL> &
    ExtendedRustMethods<ALL["Ok"]> &
    ResultMethods<ALL>;

export type ResultInstance<ALL extends { Ok: unknown; Err: unknown }> = {
  Ok(data: ALL["Ok"]): ResultFactory<ALL>;
  Err(data: ALL["Err"]): ResultFactory<ALL>;
  _: EnumProperties<ALL, ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>>;
};

/** Result constructor (`Ok` | `Err`). */
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

/** Convenience `Ok(...)`. */
export const Ok: <T>(value: T) => ResultFactory<{
    Ok: T;
    Err: unknown;
}> = <T>(value: T) => Result<T, unknown>().Ok(value);

/** Convenience `Err(...)`. */
export const Err: <E>(error: E) => ResultFactory<{
    Ok: unknown;
    Err: E;
}> = <E>(error: E) => Result<unknown, E>().Err(error);

// -----------------------------------------------------------------------------
// Rust‑style Option
// -----------------------------------------------------------------------------

type OptionMethods<OK> = {
  ok_or<E>(err: E): ResultFactory<{ Ok: OK; Err: E }>;
  ok_or_else<E>(err: () => E): ResultFactory<{ Ok: OK; Err: E }>;
  isSome(): boolean;
  isNone(): boolean;
};

export type OptionFactory<ALL extends { Some: unknown; None: undefined }> =
  EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL> &
    ExtendedRustMethods<ALL["Some"]> &
    OptionMethods<ALL["Some"]>;

export type OptionInstance<ALL extends { Some: unknown; None: undefined }> = {
  Some(data: ALL["Some"]): OptionFactory<ALL>;
  None(): OptionFactory<ALL>;
  _: EnumProperties<
    ALL,
    ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>
  >;
};

/** Option constructor (`Some` | `None`). */
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

/** Convenience `Some(...)`. */
export const Some: <T>(value: T) => OptionFactory<{
    Some: T;
    None: undefined;
}> = <T>(value: T) => Option<T>().Some(value);

/** Convenience `None()` (no payload). */
export const None: () => OptionFactory<{
    Some: unknown;
    None: undefined;
}> = () => Option().None();

// -----------------------------------------------------------------------------
// Try / TryInto helpers
// -----------------------------------------------------------------------------

export const Try: {
    sync<X>(cb: () => X): ResultFactory<{
        Ok: X;
        Err: unknown;
    }>;
    async<X>(cb: () => Promise<X>): Promise<ResultFactory<{
        Ok: X;
        Err: unknown;
    }>>;
} = {
  /** Wrap a synchronous callback, returning `Result`. */
  sync<X>(cb: () => X): ResultFactory<{ Ok: X; Err: unknown }> {
    try {
      return Result<X, unknown>().Ok(cb());
    } catch (e) {
      return Result<X, unknown>().Err(e);
    }
  },
  /** Wrap an async callback, returning `Promise<Result>`. */
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

export const TryInto: {
    sync<X, Y extends any[]>(cb: (...args: Y) => X): (...args: Y) => ResultFactory<{
        Ok: X;
        Err: unknown;
    }>;
    async<X, Y extends any[]>(cb: (...args: Y) => Promise<X>): (...args: Y) => Promise<ResultFactory<{
        Ok: X;
        Err: unknown;
    }>>;
} = {
  /** Lift a sync function into one returning `Result`. */
  sync<X, Y extends any[]>(cb: (...args: Y) => X) {
    return (...args: Y) => Try.sync(() => cb(...args));
  },
  /** Lift an async function into one returning `Promise<Result>`. */
  async<X, Y extends any[]>(cb: (...args: Y) => Promise<X>) {
    return async (...args: Y) => Try.async(() => cb(...args));
  },
};
