/**
 * A record of possible variants, each key mapping to its associated data type.
 * Example: { Some: T, None: undefined } or { Foo: string, Bar: number }.
 */
export type VariantsRecord = {
    [K in Exclude<string, "_">]: any;
};


type EnumUnion<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: ALL[K];
}[keyof ALL & string];

type EnumFactoryUnion<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: EnumFactory<K, ALL[K], ALL>;
}[keyof ALL & string];

/**
 * Represents a single constructed enum value.
 * 
 * - `tag` is the literal name of the variant.
 * - `payload` is the data associated with this variant (could be undefined).
 * - It intersects with all of the enum methods (`EnumMethods`).
 * 
 * Generics:
 * - TAG: the specific variant key.
 * - PAYLOAD: the associated data type for this key.
 * - ALL: the entire VariantsRecord for reference by the methods.
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
 * - `if` and `ifNot`: Provide conditional checks against a specific variant.
 * - `match`: Synchronously pattern-match on the variant key.
 * - `matchAsync`: Asynchronously pattern-match on the variant key.
 */
export interface EnumMethods<ALL extends VariantsRecord> {
    toJSON: () => Partial<ALL>;
    key: () => keyof ALL & string;
    if: ObjectToIfMap<ALL>;
    ifNot: ObjectToIfNotMap<ALL>;
    match: <A extends MatchFns<ALL>>(
        callbacks: A
    ) => MatchResult<A>;
    matchAsync: <A extends MatchFnsAsync<ALL>>(
        callbacks: A
    ) => Promise<MatchResult<A>>;
}

/**
 * Removes optional modifiers from properties of an object type.
 */
type NonOptional<T> = {
    [K in keyof T]-?: T[K];
};

/**
 * Base type for converting an object's properties into functions that return a generic result type (R).
 * If the property type is null/undefined, the function takes no arguments; otherwise it takes that type as an argument.
 */
type ObjectToFunctionMapBase<T, R> = {
    [K in keyof T]?: T[K] extends undefined | null
    ? () => R
    : (args: T[K]) => R;
};

/**
 * Converts an object's properties into functions returning any.
 */
type ObjectToFunctionMap<T> = ObjectToFunctionMapBase<T, any>;

/**
 * Converts an object's properties into functions returning promises.
 */
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
 * Conditional type functions for the `if` property on the constructed enum objects.
 * These allow specifying an optional callback if the variant matches, and another if it does not.
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
 * Similar to IfFnNull, but for properties that cannot be null/undefined.
 * The `ifCallback` receives the json value.
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
 * Each key corresponds to a potential variant key.
 */
type ObjectToIfMap<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends null | undefined
    ? IfFnNull<T>
    : IfFnArg<T[K], T>;
};

/**
 * `ifNot` logic for handling the inverse of a given key. 
 * The callback is invoked if the variant is NOT the specified key, else the elseCallback is invoked.
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
 */
type ObjectToIfNotMap<T> = {
    [K in keyof T]: IfNotFn<T>;
};

/**
 * Creates a single variant object.
 * 
 * @param allVariants   The entire variants record for reference.
 * @param tag           The variant key being constructed.
 * @param data          The associated data for this variant key.
 * @returns An object with `tag`, `payload`, and all the utility methods (if, match, etc.).
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
            'Variant key "_" is reserved for catch-all usage in `match`; cannot use "_" as a variant name.'
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



export type EnumProperties<ALL extends VariantsRecord, AddedProps> = {
    /**
     * Get the avialable variant keys
     */
    typeKeys: keyof ALL,
    /**
     * Get the variants object used to construct this enum.
     */
    typeVariants: Partial<ALL>,
    /** Get the type of the Enum for declaring fn arguments and the like.  Example:
     * 
     * ```ts
     * const myEnum = IronEnum<{foo: string, bar: string}>();
     * 
     * const acceptsMyEnum = (value: typeof myEnum.typeOf) { /* .. * / }
     * ```
     */
    typeOf: EnumFactoryUnion<ALL> & AddedProps, 
    /**
     * Reconstructs a variant from a plain object that must have exactly one key.
     */
    parse(dataObj: Partial<ALL>): EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL>;
};

export type IronEnumInstance<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]: ALL[K] extends undefined | null | void ? () => EnumFactory<K, ALL[K], ALL> : (data: ALL[K]) => EnumFactory<K, ALL[K],ALL>;
} & {
    _: EnumProperties<ALL, {}>
}

/**
 * Constructs an enum "builder" object. Each key in the `ALL` record
 * can be used as a function to produce a variant value via `enumFactory`.
 * 
 * The returned object also includes a `parse(...)` method that
 * accepts a plain object with exactly one key and re-creates
 * the corresponding variant object.
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
                            }
                        }
                        throw new Error(`Property '${prop2}' not availalbe at runtime!`);
                    }
                })
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


type ExtendedRustMethods<T> = {
    unwrap: () => T,
    unwrap_or: <R>(value: R) => R | T,
    unwrap_or_else: <R>(callback: () => R) => R | T,
}

type ResultMethods<ALL extends {Ok: unknown, Err: unknown}> = {
    ok: () => OptionFactory<{Some: ALL["Ok"], None: undefined}>
}

export type ResultFactory<ALL extends {Ok: unknown, Err: unknown}> = 
    EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL> 
    & ExtendedRustMethods<ALL["Ok"]> 
    & ResultMethods<ALL>

export type ResultInstance<ALL extends {Ok: unknown, Err: unknown}> = {
    Ok: (data: ALL["Ok"]) => ResultFactory<ALL>,
    Err: (data: ALL["Err"]) => ResultFactory<ALL>
} & {
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>>
}

/**
 * A Result type constructor for a success or error scenario.
 * Example usage:
 * 
 * const NumResult = Result<number, Error>();
 * const okVal = NumResult.Ok(42);
 * const errVal = NumResult.Err(new Error("something happened"));
 */
export const Result = <T, E>(): ResultInstance<{Ok: T, Err: E}> => (() => {
    const resultEnum = IronEnum<{Ok: T, Err: E}>();

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
            unwrap: () => { throw value },
            unwrap_or: x => x,
            unwrap_or_else: x => x(),
            ok: () => Option<T>().None()
        })
    }
})();



export type OptionFactory<ALL extends {Some: unknown, None: undefined}> = 
    EnumFactory<keyof ALL & string, EnumUnion<ALL>, ALL> 
    & ExtendedRustMethods<ALL["Some"]> 
    & OptionMethods<ALL["Some"]>;

type OptionMethods<OK> = {
    ok_or: <E>(error: E) => ResultFactory<{Ok: OK, Err: E}>,
    ok_or_else: <E>(error: () => E) => ResultFactory<{Ok: OK, Err: E}>
}

export type OptionInstance<ALL extends {Some: unknown, None: undefined}> = {
    Some: (data: ALL["Some"]) => OptionFactory<ALL>
    None: () => OptionFactory<ALL>,
} & {
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>>
}

/**
 * An Option type constructor for a nullable value.
 * Example usage:
 * 
 * const NumOption = Option<number>();
 * const someVal = NumOption.Some(123);
 * const noneVal = NumOption.None();
 */
export const Option = <T>(): OptionInstance<{Some: T, None: undefined}> => (() => {
    const optEnum = IronEnum<{ Some: T, None: undefined }>();

    return {
        _: optEnum._ as any,
        Some: (value: T) => ({
            ...optEnum.Some(value),
            unwrap: () => value,
            unwrap_or: x => value,
            unwrap_or_else: x => value,
            ok_or: <R>(err: R) => Result<T, R>().Ok(value),
            ok_or_else: <R>(err: () => R) => Result<T, R>().Ok(value)
        }),
        None: () => ({
            ...optEnum.None(),
            unwrap: () => {throw new Error(`Called .unwrap() on an Option.None enum!`)},
            unwrap_or: x => x,
            unwrap_or_else: x => x(),
            ok_or: <R>(err: R) => Result<T, R>().Err(err),
            ok_or_else: <R>(err: () => R) => Result<T, R>().Err(err())
        })
    }
})();
