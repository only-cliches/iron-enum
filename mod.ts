// mod.ts
/**
 * # Iron Enum
 * 
 * Finally Rust like enums in Typescript!
 * 
 * - Ergonomic AF!
 * - Fully type safe!
 * - Only 400 bytes gzipped!
 * - Includes `Option` and `Result` types!
 * 
 * | [Github](https://github.com/only-cliches/iron-enum) | [NPM](https://www.npmjs.com/package/iron-enum) | [JSR](https://jsr.io/@onlycliches/iron-enum) |
 * 
 * Typescript enums only provide simple variants:
 * ```ts
 * enum Shape {
 *     Square,
 *     Circle
 * }
 * ```
 * 
 * But what if you wanted to provide data for each variant that is context specific?  Well now you can!
 * 
 * ## Code Example
 * ```ts
 * import { IronEnum } from "iron-enum";
 * 
 * const ShapeEnum = IronEnum<{
 *     Empty: {},
 *     Square: { width: number, height: number },
 *     Circle: { radius: number }
 * }>();
 * 
 * const exampleShape = ShapeEnum.Square({width: 22, height: 50});
 * 
 * // Supports matching
 * exampleShape.match({
 *     Empty: () => {
 *         // runs if the shape is empty
 *     },
 *     Square: ({width, height}) => {
 *         // runs if the shape is square
 *     },
 *     Circle: ({radius}) => {
 *         // runs if the shape is circle
 *     }
 * });
 * 
 * // supports fallback cases
 * exampleShape.match({
 *     Square: ({width, height}) => {
 *         // runs if the shape is square
 *     },
 *     _: () => {
 *         // runs if it's anything but a square
 *     }
 * });
 * 
 * // Supports returns through match
 * const result = exampleShape.match({
 *     Empty: () => return 0;
 *     Square: ({width, height}) => width,
 *     _: () => false
 * });
 * // result type is inherited from match arm return types.
 * // typeof result == number | boolean
 * 
 * 
 * if (exampleShape.if.Square()) {
 *     // runs if the shape is a square
 * }
 * 
 * if (exampleShape.ifNot.Square()) {
 *     // runs if the shape is NOT a square
 * }
 * 
 * console.log(exampleShape.unwrap())
 * // output: ["Square", { width: 22, height: 50 }]
 * 
 * // this method will only allow ShapeEnum variants as an argument
 * const someFn = (onlyShapeEnum: typeof ShapeEnum._self.prototype) => {
 * 
 * }
 * ```
 * 
 * Just like in Rust, the `.match(...)` keys *must* contain a callback for each variant OR provide a fallback method with a `_` property.  Failing this constraint leads to a type error.
 * 
 * ## Option & Result Examples
 * ```ts
 * import { Option, Result } from "iron-enum";
 * 
 * const NumOption = Option<number>();
 * 
 * const myNum = NumOption.Some(22);
 * 
 * myNum.match({
 *     Some: (num) => {
 *         // only runs if myNum is "Some" variant
 *     },
 *     None: () => {
 *         // only runs if myNum is "None" variant
 *     }
 * })
 * 
 * const NumResult = Result<number, Error>();
 * 
 * const myNum2 = NumResult.Ok(22);
 * 
 * myNum2.match({
 *     Ok: (num) => {
 *         // only runs if myNum2 is "Ok" variant
 *     },
 *     Err: () => {
 *         // only runs if myNum2 is "Err" variant
 *     }
 * })
 * 
 * if (myNum2.if.Ok()) {
 *     // only runs if myNum2 is "Ok" variant
 * }
 * ```
 * 
 * Keywords: "enum", "algebraic data type", "tagged union", "union", "rust enums", "rust", "option", "result", "rust enum", "rust like enum"
 * 
 * 
 * @module
 */

type NonOptional<T> = {
    [K in keyof T]-?: T[K]
}

type ObjectToTuple<T> = {
    [K in keyof T]: readonly [K, keyof T[K] extends never ? undefined : T[K]];
}[keyof T];

type ObjectToFunctionMap<T> = {
    [K in keyof T]?: keyof T[K] extends never ? () => any : (args: T[K]) => any;
};

type ObjectToFunctionMapAsync<T> = {
    [K in keyof T]?: keyof T[K] extends never ? () => Promise<any> : (args: T[K]) => Promise<any>;
};

type MatchFns<X extends { [key: string]: any }> = NonOptional<ObjectToFunctionMap<X>> | (ObjectToFunctionMap<X> & { _: () => any });
type MatchFnsAsync<X extends { [key: string]: any }> = NonOptional<ObjectToFunctionMapAsync<X>> | (ObjectToFunctionMapAsync<X> & { _: () => Promise<any> });

type ObjectToBuidlerMap<VARIANTS extends { [key: string]: any }> = {
    [K in keyof VARIANTS]: keyof VARIANTS[K] extends never ? () => EnumGenerator<VARIANTS> : (args: VARIANTS[K]) => EnumGenerator<VARIANTS>;
};

type ObjectToIfMap<T> = {
    [K in keyof T]: keyof T[K] extends never ? <X = boolean>(callback?: () => X) => (X extends boolean ? X : X | void) : <X = boolean>(callback?: (arg: T[K]) => X) => (X extends boolean ? X : X | void);
};

type ObjectToIfNotMap<T> = {
    [K in keyof T]: <X = boolean>(callback?: () => X) => (X extends boolean ? X : X | void);
};

/**
 * Enum generator class
 */
class EnumGenerator<VARIANTS extends { [key: string]: any }> {

    private readonly __: ObjectToTuple<VARIANTS>;

    /**
     * 
     * @param value 
     */
    constructor(value: ObjectToTuple<VARIANTS>) {
        this.__ = value;
    }

    /**
     * 
     * @returns 
     */
    public unwrap(): ObjectToTuple<VARIANTS> {
        return this.__;
    }

    /**
     * 
     */
    public if = new Proxy({}, {
        get: (tgt, prop, rcv) => {
            return (callback: any) => {
                if (prop == this.__[0]) {
                    if (callback) {
                        return callback(this.__[1]);
                    }
                    return true;
                }
                return false;
            }
        }
    }) as ObjectToIfMap<VARIANTS>

    /**
     * 
     */
    public ifNot = new Proxy({}, {
        get: (tgt, prop, rcv) => {
            return (callback: any) => {
                if (prop != this.__[0]) {
                    if (callback) return callback()
                    return true;
                }
                return false;
            }
        }
    }) as ObjectToIfNotMap<VARIANTS>

    /**
     * 
     * @param callbacks 
     * @returns 
     */
    public match<A extends MatchFns<VARIANTS>>(callbacks: A): { [K in keyof A]: A[K] extends (...args: any) => any ? ReturnType<A[K]> : A[K] }[keyof A] | undefined {
        const maybeCall = callbacks[this.__[0]];
        if (maybeCall) return maybeCall(this.__[1] as any);
        const catchCall = callbacks._ as () => any;
        if (catchCall) return catchCall();
    }

    /**
     * 
     * @param callbacks 
     * @returns 
     */
    public async matchAsync<A extends MatchFnsAsync<VARIANTS>>(callbacks: A): Promise<{ [K in keyof A]: A[K] extends (...args: any) => Promise<any> ? Awaited<ReturnType<A[K]>> : A[K] }[keyof A] | undefined> {
        const maybeCall = callbacks[this.__[0]];
        if (maybeCall) return await maybeCall(this.__[1] as any);
        const catchCall = callbacks._ as () => Promise<any>;
        if (catchCall) return await catchCall();
    }
}




/**
 * Create a type syfe enum
 *
 */

export function IronEnum<VARIANTS extends { [key: string]: any }>(): ObjectToBuidlerMap<VARIANTS> & {_self: typeof EnumGenerator<VARIANTS> } {

    return new Proxy({}, {
        get: (tgt, prop, rcv) => {
            if (prop == "_self") return EnumGenerator<VARIANTS>;
            return (args: any) => {
                return new EnumGenerator<VARIANTS>([prop, args] as any);
            }
        }
    }) as any;
}

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
export const Option = <T>(): ReturnType<typeof IronEnum<{None: {}, Some: T}>> => IronEnum<{
    None: {},
    Some: T
}>()


/**
 * Result type, usage:
 * 
 * const NumResult = Result<number, Error>();
 * const myResult = NumResult.Result(22);
 * // or
 * const myResult = Result<number, Error>().Result(22);
 * 
 * @returns IronEnum<{Ok: T, Err: E}>
 */
export const Result = <T, E>(): ReturnType<typeof IronEnum<{Ok: T, Err: E}>> => IronEnum<{
    Ok: T,
    Err: E
}>()
