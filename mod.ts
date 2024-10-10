// mod.ts
/**
 * A module providing a function to greet people.
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
 * Greet a person.
 *
 * @param name The name of the person to greet.
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