


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
         * Unwrap to get the original [tag, value] tuple.
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
 * `IronEnum` factory: Creates a proxy that provides builder functions
 * for each variant. Accessing `MyEnum.Variant` returns a function that,
 * when called with arguments, returns an enum instance (from `enumFactory`).
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
