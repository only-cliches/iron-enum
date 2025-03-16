
/**
 * Removes optional modifiers from properties.
 */
type NonOptional<T> = {
    [K in keyof T]-?: T[K]
};

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
    elseCallback?: (obj: Partial<T>) => RElse
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
    elseCallback?: (unwrapValue: Partial<T>) => RElse
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
    callback?: (unwrapValue: Partial<TAll>) => RIf,
    elseCallback?: (unwrapValue: Partial<TAll>) => RElse
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

type ObjectKeys<T> = {
    [K in keyof T]: K;
}[keyof T];


export type EnumFactory<VARIANTS extends { [varaintKey: string]: any }> = {
    /**
     * Unwrap to get the underlying value of the tuple
     */
    unwrap: () => Partial<VARIANTS>,
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
};


/**
 * Creates a tagged enum value factory. Given a `[tag, value]` tuple,
 * returns an object with utilities for pattern matching and conditional checks.
 */
const enumFactory = <VARIANTS extends { [varaintKey: string]: any }>(value: Partial<VARIANTS>): EnumFactory<VARIANTS>  => {
    const tag = Object.keys(value).pop() || "";
    const data = value[tag];

    return {
        unwrap: () => ({[tag]: data} as any),
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
 * `IronEnum` generator function: Creates a proxy that provides builder functions
 * for each variant. Accessing `MyEnum.Variant` returns a function that,
 * when called with arguments, returns an enum instance.
 */
export const IronEnum = <VARIANTS extends { [key: string]: any }>(): ObjectToBuilderMap<VARIANTS> & { 
    /**
     * Get the avialable variant keys
     */
    readonly typeKeys: ObjectKeys<VARIANTS>,
    /**
     * Get the variants object used to construct this enum.
     */
    readonly typeVariants: Partial<VARIANTS>,
    /** Get the type of the Enum for declaring fn arguments and the like.  Example:
     * 
     * ```ts
     * const myEnum = IronEnum<{foo: string, bar: string}>();
     * 
     * const acceptsMyEnum = (value: typeof myEnum.typeOf) { /* .. * / }
     * ```
     */
    readonly typeOf: ReturnType<typeof enumFactory<VARIANTS>>, 
    /**
     * Parse JSON as an enum type. Example:
     * 
     * ```ts
     * const myEnum = IronEnum<{foo: string, bar: string}>();
     * 
     * const enumValue = myEnum.foo("bazz");
     * // converts to standard JSON object
     * const jsonValue = enumValue.unwrap();
     * // converts back to enum 
     * const parsedEnum = myEnum.parse(jsonValue);
     * 
     * ```
     * 
     * @param data 
     * @returns 
     */
    readonly parse: (data: Partial<VARIANTS>) => ReturnType<typeof enumFactory<VARIANTS>> 
} => {
    return new Proxy({} as any, {
        get: (_tgt, tag: string) => {
            if (["typeOf", "typeKeys", "typeVariants"].indexOf(tag) !== -1) {
                throw new Error(`Property "${tag}" of IronEnum cannot be used at runtime, only for types!`);
            }
            if (tag == "parse") {
                return (data: Partial<VARIANTS>) => {
                    const allKeys = Object.keys(data);
                    if (allKeys.length !== 1) {
                        throw new Error(`Expected exactly 1 variant key, got ${allKeys.length}: ${allKeys.join(", ")}`);
                    }
                    const key = allKeys.pop() as keyof VARIANTS | undefined;
                    if (!key) throw new Error(`Key not provided for "parse" method of IronEnum!`);
                    return enumFactory<VARIANTS>(data);
                }
            }
            return (data: any) => enumFactory<VARIANTS>({[tag]: data} as Partial<VARIANTS>);
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

