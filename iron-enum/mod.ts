/**
 * IronEnum – Zero-dependency Rust-style tagged-union helpers for TypeScript.
 *
 * A small utility to build runtime representations of discriminated unions,
 * with type-safe pattern matching and ergonomic Result/Option types.
 *
 * @example
 * // Define an enum
 * const Status = IronEnum<{
 * 		Loading: undefined;
 * 		Ready: { finishedAt: Date };
 * 		Error: { message: string; code: number };
 * }>();
 *
 * // Create instances
 * const s1 = Status.Loading();
 * const s2 = Status.Ready({ finishedAt: new Date() });
 *
 * // Narrow using .is()
 * if (s2.is("Ready")) {
 * 		s2.data.finishedAt.toISOString();
 * }
 *
 * // Match with fallback
 * const msg = s2.match({
 * 		Loading: () => "Working",
 * 		Ready: ({ finishedAt }) => finishedAt.toISOString(),
 * 		_: () => "Unknown"
 * });
 *
 * // Exhaustive match (no fallback allowed)
 * const iso = s2.matchExhaustive({
 * 		Loading: () => "n/a",
 * 		Ready: ({ finishedAt }) => finishedAt.toISOString(),
 * 		Error: () => "n/a",
 * });
 *
 * @example
 * // Result and Option usage
 * const R = Result<number, string>();
 * const r1 = R.Ok(42);
 * const r2 = R.Err("nope");
 * const val = r1.unwrap_or(0); // 42
 *
 * const O = Option<number>();
 * const some = O.Some(7);
 * const none = O.None();
 * const out = some.map(x => x * 2).unwrap(); // 14
 */

/* =============================================================================
 * Core Types
 * ============================================================================= */

/**
 * Structure of enum variants.
 *
 * Each key is a variant name and its value is the payload for that variant.
 * Use `undefined` for variants without associated data.
 *
 * @example
 * type MyVariants = {
 * 		Unit: undefined;
 * 		Tuple: [string, number];
 * 		Record: { id: string };
 * }
 */
export type VariantsRecord = {
	readonly [K in Exclude<string, "_">]: unknown;
};

/**
 * Union of all possible enum variant instances for a given `VariantsRecord`.
 *
 * This is useful for function parameters that accept any variant instance.
 * This type is typically accessed via the `_.typeOf` property on a factory.
 *
 * @example
 * const Status = IronEnum<{ Ok: string; Err: Error }>();
 *
 * // The `_.typeOf` property provides this union type.
 * function logStatus(s: typeof Status._.typeOf) {
 * 		// s is: IronEnumVariantUnion<{ Ok: string; Err: Error }>
 * 		console.log(s.tag);
 * }
 */
export type IronEnumVariantUnion<ALL extends VariantsRecord> = {
	[K in keyof ALL & string]: IronEnumVariant<K, ALL[K], ALL>;
}[keyof ALL & string];


/* =============================================================================
 * Constructor and Return Type Helpers
 * ============================================================================= */

/**
 * Constructor signature for a variant based on its payload type.
 *
 * - If the payload type is `undefined`, the constructor is nullary.
 * - Otherwise, the constructor requires the payload.
 */
type VariantConstructor<Default, K extends string, ALL extends VariantsRecord> =
	[Default] extends [undefined]
	? () => IronEnumVariant<K, Default, ALL>
	: (data: Default) => IronEnumVariant<K, Default, ALL>;

/**
 * Return type calculation used by `if` and `ifNot`.
 *
 * Produces a boolean when both callbacks return `void`.
 * Otherwise, returns the union of defined callback return types plus boolean.
 */
type IfReturn<RIf, RElse> = [RIf, RElse] extends [void, void]
	? boolean
	: RIf extends void
	? boolean | Exclude<RElse, void>
	: RElse extends void
	? boolean | Exclude<RIf, void>
	: Exclude<RIf, void> | Exclude<RElse, void>;

/* =============================================================================
 * Public Variant Instance Type
 * ============================================================================= */

/**
 * A single constructed enum variant instance with its discriminant, payload,
 * a back-reference to the factory that created it, and matching utilities.
 *
 * @template TAG     The discriminant string literal
 * @template PAYLOAD The payload type carried by this variant
 * @template ALL     The full `VariantsRecord` for the enum
 */
export type IronEnumVariant<
	TAG extends keyof ALL & string,
	PAYLOAD,
	ALL extends VariantsRecord
> = {
	/** Discriminant of the variant. */
	readonly tag: TAG;
	/** Payload carried by the variant. */
	readonly data: PAYLOAD;
	/**
	 * The factory object this instance originated from.
	 *
	 * @example
	 * const loading = Status.Loading();
	 * // Create a new variant from the same factory
	 * const ready = loading.instance.Ready({ finishedAt: new Date() });
	 */
	readonly instance: IronEnumFactory<ALL>;
} & EnumMethods<ALL>;

/**
 * Serializable wire format for a variant instance.
 *
 * Use with `JSON.stringify` and `Enum._.parse` / `Enum._.fromJSON` /
 * `Enum._.reviver` to move values across the wire safely.
 *
 * @example
 * const s = Status.Error({ message: "oops", code: 500 });
 * const json = JSON.stringify(s);
 * // json === '{"tag":"Error","data":{"message":"oops","code":500}}'
 */
export type IronEnumWireFormat<ALL extends VariantsRecord> = {
	[K in keyof ALL & string]: { tag: K; data: ALL[K] };
}[keyof ALL & string];

/* =============================================================================
 * Methods available on every variant instance
 * ============================================================================= */

/**
 * Helper to exclude a specific variant from the union by its tag.
 */
type ExcludeVariant<
	ALL extends VariantsRecord,
	K extends keyof ALL & string
> = Exclude<IronEnumVariantUnion<ALL>, IronEnumVariant<K, ALL[K], ALL>>;

/**
 * Methods present on each variant instance.
 *
 * Includes:
 * - `toJSON` for structured logging/serialization.
 * - `is` / `if` / `ifNot` for quick predicates.
 * - `match` / `matchAsync` for flexible pattern matching.
 * - `matchExhaustive` for compile-time exhaustive handling.
 */
export interface EnumMethods<ALL extends VariantsRecord> {
	/**
	 * Convert the instance into `{ tag, data }` for JSON or debugging.
	 * Automatically called by `JSON.stringify`.
	 *
	 * @example
	 * const s = Status.Ready({ finishedAt: new Date() });
	 * const json = JSON.stringify(s);
	 * // json === '{"tag":"Ready","data":{...}}'
	 */
	toJSON(): IronEnumWireFormat<ALL>;

	/**
	 * Predicate that narrows the variant type on success.
	 *
	 * @example
	 * if (state.is("Ready")) {
	 * // state.data is narrow to Ready payload
	 * state.data.finishedAt.toISOString();
	 * }
	 */
	is<K extends keyof ALL & string>(
		key: K
	): this is IronEnumVariant<K, ALL[K], ALL>;

	/**
	 * Execute a callback when the discriminant equals `key`.
	 *
	 * When no callbacks are provided, acts as a boolean predicate.
	 * When callbacks are provided, returns `true` or the callback's
	 * result on success, and `false` or the failure callback's
	 * result on failure.
	 *
	 * The `failure` callback receives a type-safe union of all
	 * variants *except* the one being checked.
	 *
	 * @example
	 * // As a predicate
	 * if (state.if("Loading")) {
	 * 		// ...
	 * }
	 *
	 * // With a success callback
	 * state.if("Ready", (data) => {
	 * 		console.log(data.finishedAt);
	 * });
	 *
	 * // With both callbacks to extract a value
	 * const message = state.if(
	 * 		"Error",
	 * 		(data) => `Error: ${data.message}`,
	 * 		(other) => `Status: ${other.tag}` // other is Loading | Ready
	 * );
	 */
	if<K extends keyof ALL & string, RIf = void, RElse = void>(
		key: K,
		success?: (payload: ALL[K], self: IronEnumVariant<K, ALL[K], ALL>) => RIf,
		failure?: (self: ExcludeVariant<ALL, K>) => RElse
	): IfReturn<RIf, RElse>;

	/**
	 * Execute a callback when the discriminant does NOT equal `key`.
	 *
	 * The `success` callback receives a type-safe union of all
	 * variants *except* the one being checked.
	 *
	 * @example
	 * // As a predicate
	 * if (state.ifNot("Error")) {
	 * 		// state is Loading | Ready
	 * }
	 *
	 * // With a success callback
	 * state.ifNot("Loading", (other) => {
	 * 		// other is Ready | Error
	 * 		console.log(`Not loading: ${other.tag}`);
	 * });
	 */
	ifNot<K extends keyof ALL & string, RIf = void, RElse = void>(
		key: K,
		success?: (self: ExcludeVariant<ALL, K>) => RIf,
		failure?: (payload: ALL[K], self: IronEnumVariant<K, ALL[K], ALL>) => RElse
	): IfReturn<RIf, RElse>;

	/**
	 * Pattern matching with optional `_` fallback arm.
	 *
	 * Use when some variants can be handled together via a fallback.
	 *
	 * @example
	 * // Exhaustive match
	 * const httpStatus = state.match({
	 * 		Loading: () => 202,
	 * 		Ready: () => 200,
	 * 		Error: ({ code }) => code,
	 * });
	 *
	 * // With a fallback
	 * const message = state.match({
	 * 		Error: ({ message }) => message,
	 * 		_: (self) => `Current state: ${self.tag}`,
	 * });
	 */
	match<A extends MatchFns<ALL>>(callbacks: A): MatchResult<A>;

	/**
	 * Asynchronous pattern matching with optional `_` fallback arm.
	 * All callbacks must return a `Promise`.
	 *
	 * @example
	 * const data = await state.matchAsync({
	 * 		Loading: async () => fetch("/data"),
	 * 		Ready: async (data) => data.finishedAt,
	 * 		_: async () => null
	 * });
	 */
	matchAsync<A extends MatchFnsAsync<ALL>>(
		callbacks: A
	): Promise<MatchResult<A>>;

	/**
	 * Exhaustive pattern matching. All variants must be handled.
	 *
	 * No `_` fallback is allowed. Compilation fails if a case is missing.
	 *
	 * @example
	 * const message = state.matchExhaustive({
	 * 		Loading: () => "Still loading...",
	 * 		Ready: ({ finishedAt }) => `Done at ${finishedAt}`,
	 * 		Error: ({ message }) => `Failed: ${message}`,
	 * });
	 */
	matchExhaustive<A extends ExhaustiveFns<ALL>>(callbacks: A): MatchResult<A>;
}

/* =============================================================================
 * Internal Type Utilities for Matching
 * ============================================================================= */

type NonOptional<T> = { [K in keyof T]-?: T[K] };

/** Map each tag to a synchronous handler `(payload, self) => R`. */
type ObjectToFunctionMapBase<T extends VariantsRecord, R> = {
	[K in keyof T]?: (payload: T[K], self: IronEnumVariant<K & string, T[K], T>) => R;
};

/** Sync handler options. */
type ObjectToFunctionMap<T extends VariantsRecord> = ObjectToFunctionMapBase<T, any>;

/** Async handler options. */
type ObjectToFunctionMapAsync<T extends VariantsRecord> = ObjectToFunctionMapBase<
	T,
	Promise<any>
>;



/**
 * Valid sync match configurations:
 * 1) Provide all tags, or
 * 2) Provide partial tags plus `_` fallback.
 */
type MatchFns<X extends VariantsRecord> =
	| NonOptional<ObjectToFunctionMap<X>>
	| (ObjectToFunctionMap<X> & { _: (self: IronEnumVariantUnion<X>) => any });

/**
 * Valid async match configurations:
 * 1) Provide all tags, or
 * 2) Provide partial tags plus `_` fallback.
 */
type MatchFnsAsync<X extends VariantsRecord> =
	| NonOptional<ObjectToFunctionMapAsync<X>>
	| (ObjectToFunctionMapAsync<X> & {
		_: (self: IronEnumVariantUnion<X>) => Promise<any>;
	});

/** Exhaustive mapping: all tags required, no `_` fallback allowed. */
type ExhaustiveFns<X extends VariantsRecord> = {
	[K in keyof X & string]: (
		payload: X[K],
		self: IronEnumVariant<K, X[K], X>
	) => any;
};

/** Extract the unified return type of a match dispatch. */
type MatchResult<A> = A extends { [K: string]: (...args: any) => infer R }
	? R
	: never;

/* =============================================================================
 * Factory Implementation
 * ============================================================================= */

/**
 * Create a concrete variant instance and attach all methods.
 *
 * This function centralizes the instance layout and avoids per-call
 * function allocation differences across factories.
 */
function enumFactory<
	ALL extends VariantsRecord,
	TAG extends keyof ALL & string
>(
	_allVariants: ALL,
	tag: TAG,
	data: ALL[TAG],
	instance: IronEnumFactory<ALL>
): IronEnumVariant<TAG, ALL[TAG], ALL> {
	if (tag === "_") throw new Error("'_' is reserved as a fallback key.");

	// Self reference enables methods to pass a stable instance shape.
	const self = {} as IronEnumVariant<TAG, ALL[TAG], ALL>;

	const is = <K extends keyof ALL & string>(key: K): boolean => (key as string) === (tag as string);

	const _if = <K extends keyof ALL & string, RIf = void, RElse = void>(
		key: K,
		success?: (payload: ALL[K], self: IronEnumVariant<K, ALL[K], ALL>) => RIf,
		failure?: (self: IronEnumVariantUnion<ALL>) => RElse
	): IfReturn<RIf, RElse> => {
		const hit = key === (tag as unknown as K);
		if (hit) {
			if (success) {
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
		success?: (self: IronEnumVariantUnion<ALL>) => RIf,
		failure?: (payload: ALL[K], self: IronEnumVariant<K, ALL[K], ALL>) => RElse
	): IfReturn<RIf, RElse> => {
		const miss = key !== (tag as unknown as K);
		if (miss) {
			if (success) {
				const r = success(self) as RIf;
				return (r === undefined ? true : r) as IfReturn<RIf, RElse>;
			}
			return true as IfReturn<RIf, RElse>;
		}
		if (failure) {
			const r = (failure as any)(data, self) as RElse;
			return (r === undefined ? false : r) as IfReturn<RIf, RElse>;
		}
		return false as IfReturn<RIf, RElse>;
	};

	const match = (callbacks: MatchFns<ALL>) => {
		const specific = (callbacks as any)[tag];
		const cb = specific ?? (callbacks as any)._;
		if (!cb) {
			throw new Error(`No handler for '${String(tag)}' and no '_' fallback`);
		}
		return specific ? cb(data, self) : cb(self);
	};

	const matchAsync = async (callbacks: MatchFnsAsync<ALL>) => {
		const specific = (callbacks as any)[tag];
		const cb = specific ?? (callbacks as any)._;
		if (!cb) {
			throw new Error(`No handler for '${String(tag)}' and no '_' fallback`);
		}
		return specific ? cb(data, self) : cb(self);
	};

	const matchExhaustive = (callbacks: ExhaustiveFns<ALL>) => {
		const cb = (callbacks as any)[tag];
		return cb(data, self);
	};

	const selfProperties: IronEnumVariant<TAG, ALL[TAG], ALL> = {
		tag,
		data,
		instance,
		toJSON: () => ({ tag, data }),
		is: is as any,
		if: _if as any,
		ifNot: _ifNot as any,
		match: match as any,
		matchAsync: matchAsync as any,
		matchExhaustive: matchExhaustive as any,
	};

	Object.assign(self, selfProperties);
	return self;
}

/* =============================================================================
 * Main Enum Builder
 * ============================================================================= */

/**
 * Runtime factory for an enum, where each key is a constructor for its variant.
 *
 * @example
 * const Status = IronEnum<{
 * Loading: undefined;
 * Ready: { count: number };
 * }>();
 *
 * const s1 = Status.Loading(); // { tag: "Loading", data: undefined }
 * const s2 = Status.Ready({ count: 1 }); // { tag: "Ready", data: { count: 1 } }
 */
export type IronEnumFactory<ALL extends VariantsRecord> = {
	[K in keyof ALL & string]: VariantConstructor<ALL[K], K, ALL>;
} & {
	/**
	 * Utilities and [TYPE ONLY] metadata exposed via the `_` property.
	 *
	 * The fields marked [TYPE ONLY] exist only for type access in code and do not
	 * exist at runtime. They intentionally evaluate to `never` at runtime.
	 */
	_: EnumProperties<ALL, {}>;
};

/**
 * Utility metadata exposed on the factory via `_`.
 *
 * Includes parsers and [TYPE ONLY] accessors for tags, payload union, and
 * the union instance type.
 */
export type EnumProperties<ALL extends VariantsRecord, AddedProps> = {
	/**
	 * [TYPE ONLY] Union of tag names.
	 *
	 * @example
	 * const Status = IronEnum<{ A: 0; B: 1 }>();
	 * type StatusTags = typeof Status._.typeTags; // "A" | "B"
	 */
	readonly typeTags: keyof ALL & string;

	/**
	 * [TYPE ONLY] Union of payload values.
	 *
	 * @example
	 * const Status = IronEnum<{ A: 0; B: 1 }>();
	 * type StatusData = typeof Status._.typeData; // 0 | 1
	 */
	readonly typeData: ALL[keyof ALL];

	/**
	 * [TYPE ONLY] Union of all variant instances for this enum.
	 * This is the main type to use in function signatures.
	 *
	 * @example
	 * const Status = IronEnum<{ A: 0; B: 1 }>();
	 *
	 * function process(s: typeof Status._.typeOf) {
	 * // ...
	 * }
	 */
	readonly typeOf: IronEnumVariantUnion<ALL> & AddedProps;

	/**
	 * Parse `{ tag, data }` into a variant instance.
	 * If the keys where provided to the original function call then throws when the tag is not recognized by this factory.
	 *
	 * @example
	 * const data = { tag: "Ready", data: { finishedAt: new Date() } };
	 * const s = Status._.parse(data);
	 * if (s.is("Ready")) { ... }
	 */
	parse(
		dataObj: { readonly tag: string; readonly data: unknown }
	): IronEnumVariant<keyof ALL & string, ALL[keyof ALL], ALL>;

	/**
	 * Alias of `parse`. Convenient for deserializers.
	 * @see parse
	 */
	fromJSON(
		dataObj: { readonly tag: string; readonly data: unknown }
	): IronEnumVariant<keyof ALL & string, ALL[keyof ALL], ALL>;

	/**
	 * JSON.parse reviver. Pass as the reviver to automatically convert
	 * nested `{ tag, data }` shapes for this enum.
	 *
	 * @example
	 * const text = '{"tag":"Ready","data":{...}}';
	 * const s = JSON.parse(text, (k, v) => Status._.reviver(v));
	 * // s is now a full Status.Ready variant instance
	 */
	reviver(obj: unknown): IronEnumVariantUnion<ALL> | unknown;
};

/**
 * Create a new enum factory.
 *
 * @param args - Optional arguments.
 * @param args.keys - An array of variant keys. Providing this skips the
 * Proxy-based implementation for a faster, pre-bound factory.
 *
 * @example
 * // Dynamic (Proxy-based, slower)
 * const Status = IronEnum<{
 * 		A: undefined;
 * 		B: undefined;
 * }>();
 *
 * // Pre-bound (Fast, no Proxy)
 * const FastStatus = IronEnum<{
 * 		A: undefined;
 * 		B: undefined;
 * }>({ keys: ["A", "B"] });
 */
export function IronEnum<ALL extends VariantsRecord>(args?: {
	keys?: (keyof ALL & string)[]
}): "_" extends keyof ALL ? "ERROR: '_' is reserved!" : IronEnumFactory<ALL> {
	const keys = args?.keys;
	let result: IronEnumFactory<ALL> = {} as any;

	const parse = (dataObj: { readonly tag: string; readonly data: unknown }) => {
		const actualKey = dataObj.tag as keyof ALL & string;
		if (keys?.length && !keys.includes(actualKey)) {
			throw new Error(`Unexpected variant '${actualKey}'`);
		}
		return enumFactory<ALL, typeof actualKey>(
			{} as ALL,
			actualKey,
			dataObj.data as ALL[typeof actualKey],
			result
		);
	};

	const _: EnumProperties<ALL, {}> = {
		typeTags: undefined as never, // [TYPE ONLY]
		typeData: undefined as never, // [TYPE ONLY]
		typeOf: undefined as never,   // [TYPE ONLY]
		parse,
		fromJSON: parse,
		reviver(obj: unknown) {
			if (obj && typeof obj === "object" && "tag" in (obj as any) && "data" in (obj as any)) {
				// We use parse, but must cast the input.
				// The `in` checks are a reasonable safeguard.
				return parse(obj as { tag: string; data: unknown });
			}
			return obj;
		},
	};

	// Keyed fast-path (no Proxy)
	if (keys?.length) {
		result = { _ } as IronEnumFactory<ALL>;
		for (const key of keys) {
			(result as any)[key] = ((...args: [any?]) =>
				enumFactory<ALL, typeof key>({} as ALL, key, args[0], result)) as any;
		}
		return result as any;
	}

	// Dynamic Proxy builder with built-in guard
	const BUILTINS = new Set(["toString", "valueOf", "inspect", "constructor"]);
	result = new Proxy(
		{},
		{
			get: (_tgt, prop: string | symbol) => {
				if (prop === "_") return _;
				if (typeof prop !== "string") return undefined;
				if (BUILTINS.has(prop)) {
					const fn = (Object.prototype as any)[prop];
					return typeof fn === "function" ? fn.bind(result) : undefined;
				}
				return (...args: [any?]) => {
					const data = args[0] as ALL[typeof prop];
					return enumFactory<ALL, typeof prop>({} as ALL, prop, data, result);
				};
			},
		}
	) as any;

	return result as any;
}

/* =============================================================================
 * Result Type (Rust-style error handling)
 * ============================================================================= */

/**
 * Methods common to success-carrying types that allow extracting values,
 * defaults, or lazily computed fallbacks.
 */
type ExtendedRustMethods<T> = {
	/**
	 * Return the success value.
	 * **Throws** if the variant is `Err` or `None`.
	 *
	 * @example
	 * Ok(1).unwrap(); // 1
	 * Err("!").unwrap(); // Throws
	 * None().unwrap(); // Throws
	 */
	unwrap(): T;

	/**
	 * Return the success value or a provided default.
	 *
	 * @example
	 * Ok(1).unwrap_or(0); // 1
	 * Err("!").unwrap_or(0); // 0
	 * None().unwrap_or(0); // 0
	 */
	unwrap_or<R>(value: R): R | T;

	/**
	 * Return the success value or the result of a fallback function.
	 * The callback is only executed if needed.
	 *
	 * @example
	 * Ok(1).unwrap_or_else(() => 0); // 1
	 * Err("!").unwrap_or_else(() => 0); // 0
	 * None().unwrap_or_else(() => expensive_calc()); // 0
	 */
	unwrap_or_else<R>(cb: () => R): R | T;
};

/**
 * Result-specific helpers for mapping and chaining.
 */
type ResultMethods<ALL extends { Ok: unknown; Err: unknown }> = {
	/**
	 * Convert `Result<T,E>` to `Option<T>`, dropping the error.
	 *
	 * @example
	 * Ok(1).ok(); // Some(1)
	 * Err("!").ok(); // None()
	 */
	ok(): OptionVariant<{ Some: ALL["Ok"]; None: undefined }>;

	/**
	 * Predicate for `Ok` variant.
	 *
	 * @example
	 * if (myResult.isOk()) { ... }
	 */
	isOk(): boolean;

	/**
	 * Predicate for `Err` variant.
	 *
	 * @example
	 * if (myResult.isErr()) { ... }
	 */
	isErr(): boolean;

	/**
	 * Map the `Ok` value, leaving `Err` untouched.
	 *
	 * @example
	 * Ok(1).map(x => x + 1); // Ok(2)
	 * Err("!").map(x => x + 1); // Err("!")
	 */
	map<U>(f: (t: ALL["Ok"]) => U): ResultVariant<{ Ok: U; Err: ALL["Err"] }>;

	/**
	 * Map the `Err` value, leaving `Ok` untouched.
	 *
	 * @example
	 * Ok(1).mapErr(x => x + "!"); // Ok(1)
	 * Err("!").mapErr(x => x + "!"); // Err("!!")
	 */
	mapErr<F>(f: (e: ALL["Err"]) => F): ResultVariant<{ Ok: ALL["Ok"]; Err: F }>;

	/**
	 * Chain a new `Result`-returning operation when `Ok`.
	 * Also known as `flatMap`.
	 *
	 * @example
	 * const safeDivide = (n: number) => n === 0 ? Err("div by 0") : Ok(10 / n);
	 *
	 * Ok(5).andThen(safeDivide); // Ok(2)
	 * Ok(0).andThen(safeDivide); // Err("div by 0")
	 * Err("!").andThen(safeDivide); // Err("!")
	 */
	andThen<U>(
		f: (t: ALL["Ok"]) => ResultVariant<{ Ok: U; Err: ALL["Err"] }>
	): ResultVariant<{ Ok: U; Err: ALL["Err"] }>;
};

/**
 * A Result instance (Ok or Err) with extraction and mapping helpers.
 *
 * This type is invariant, meaning `Result<T, never>` is not assignable
 * to `Result<T, string>`.
 *
 * To accept `Result` in a function, either use a specific factory:
 * @example
 * const MyResult = Result<string, Error>();
 * function process(r: typeof MyResult._.typeOf) { ... }
 *
 * // Or make the function generic:
 * function process<T, E>(r: ResultVariant<{ Ok: T, Err: E }>) { ... }
 */
export type ResultVariant<ALL extends { Ok: unknown; Err: unknown }> =
	IronEnumVariant<keyof ALL & string, ALL[keyof ALL], ALL> &
	ExtendedRustMethods<ALL["Ok"]> &
	ResultMethods<ALL>;

/**
 * Factory for creating Ok and Err variants plus metadata via `_`.
 *
 * @example
 * const R = Result<number, string>();
 * const r1 = R.Ok(1);
 * const r2 = R.Err("nope");
 */
export type ResultFactory<ALL extends { Ok: unknown; Err: unknown }> = {
    Ok(data: ALL["Ok"]): IronEnumVariant<"Ok", ALL["Ok"], ALL> & ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>;
    Err(data: ALL["Err"]): IronEnumVariant<"Err", ALL["Err"], ALL> & ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>;
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Ok"]> & ResultMethods<ALL>>;
};

/**
 * Internal constructor for a typed Result factory.
 *
 * A fresh factory is produced per `<T,E>` instantiation to preserve
 * factory identity and allow future per-type runtime extensibility.
 */
const ResultInternal = <T, E>(): ResultFactory<{ Ok: T; Err: E }> => {
	const R = IronEnum<{ Ok: T; Err: E }>({ keys: ["Err", "Ok"] });

	const OkCtor = (value: T) => {
		const base = (R as any).Ok(value);

		return Object.assign(base, {
			unwrap: () => value,
			unwrap_or: () => value,
			unwrap_or_else: () => value,
			isOk: () => true,
			isErr: () => false,
			ok: () => Option<T>().Some(value),
			map<U>(f: (t: T) => U) {
				return Result<U, E>().Ok(f(value)) as any;
			},
			mapErr<F>(_f: (e: E) => F) {
				return Result<T, F>().Ok(value) as any;
			},
			andThen<U>(f: (t: T) => ResultVariant<{ Ok: U; Err: E }>) {
				return f(value) as any;
			},
		});
	};

	const ErrCtor = (error: E) => {
		const base = (R as any).Err(error);

		return Object.assign(base, {
			unwrap: () => {
				throw error instanceof Error ? error : new Error(String(error ?? "Err"));
			},
			unwrap_or: <R>(x: R) => x,
			unwrap_or_else: <R>(cb: () => R) => cb(),
			isOk: () => false,
			isErr: () => true,
			ok: () => Option<T>().None(),
			map<U>(_f: (t: T) => U) {
				return Result<U, E>().Err(error) as any;
			},
			mapErr<F>(f: (e: E) => F) {
				return Result<T, F>().Err(f(error)) as any;
			},
			andThen<U>(_f: (t: T) => ResultVariant<{ Ok: U; Err: E }>) {
				return Result<U, E>().Err(error) as any;
			},
		});
	};

	return { _: (R._ as any), Ok: OkCtor, Err: ErrCtor };
};

/**
 * Create a typed Result factory `<T,E>`.
 *
 * @example
 * const StringResult = Result<string, Error>();
 * const r1 = StringResult.Ok("hello");
 *
 * function process(r: typeof StringResult._.typeOf) {
 * // ...
 * }
 */
export const Result: <T, E>() => ResultFactory<{ Ok: T; Err: E }> = <T, E>() =>
	ResultInternal<T, E>();

/**
 * Convenience Ok constructor for ad-hoc success values.
 * The `Err` type is `never`.
 *
 * @example
 * const r = Ok(123); // ResultVariant<{ Ok: number, Err: never }>
 */
export const Ok: <T>(value: T) => ResultVariant<{ Ok: T; Err: never }> = <T>(value: T) =>
	Result<T, never>().Ok(value);

/**
 * Convenience Err constructor for ad-hoc error values.
 * The `Ok` type is `never`.
 *
 * @example
 * const r = Err("oops"); // ResultVariant<{ Ok: never, Err: string }>
 */
export const Err: <E>(error: E) => ResultVariant<{ Ok: never; Err: E }> = <E>(error: E) =>
	Result<never, E>().Err(error);

/* =============================================================================
 * Option Type (Rust-style nullable values)
 * ============================================================================= */

/**
 * Option-specific helpers for converting to Result, mapping, chaining, and
 * basic predicates.
 */
type OptionMethods<OK> = {
	/**
	 * Convert `Some(T)` to `Ok(T)` or `None` to `Err(E)`.
	 *
	 * @example
	 * Some(1).ok_or("!"); // Ok(1)
	 * None().ok_or("!"); // Err("!")
	 */
	ok_or<E>(err: E): ResultVariant<{ Ok: OK; Err: E }>;

	/**
	 * Convert `Some(T)` to `Ok(T)` or `None` to `Err(E)`
	 * using a lazily-computed error.
	 *
	 * @example
	 * Some(1).ok_or_else(() => "!"); // Ok(1)
	 * None().ok_or_else(() => "!"); // Err("!")
	 */
	ok_or_else<E>(err: () => E): ResultVariant<{ Ok: OK; Err: E }>;

	/**
	 * Predicate for `Some` variant.
	 *
	 * @example
	 * if (myOption.isSome()) { ... }
	 */
	isSome(): boolean;

	/**
	 * Predicate for `None` variant.
	 *
	 * @example
	 * if (myOption.isNone()) { ... }
	 */
	isNone(): boolean;

	/**
	 * Map the `Some` value, leaving `None` untouched.
	 *
	 * @example
	 * Some(1).map(x => x + 1); // Some(2)
	 * None().map(x => x + 1); // None()
	 */
	map<U>(f: (t: OK) => U): OptionVariant<{ Some: U; None: undefined }>;

	/**
	 * Chain a new `Option`-returning operation when `Some`.
	 * Also known as `flatMap`.
	 *
	 * @example
	 * const firstChar = (s: string) => s.length > 0 ? Some(s[0]) : None();
	 *
	 * Some("hi").andThen(firstChar); // Some("h")
	 * Some("").andThen(firstChar); // None()
	 * None().andThen(firstChar); // None()
	 */
	andThen<U>(
		f: (t: OK) => OptionVariant<{ Some: U; None: undefined }>
	): OptionVariant<{ Some: U; None: undefined }>;

	/**
	 * Keep `Some` only when the predicate passes.
	 *
	 * @example
	 * Some(2).filter(x => x % 2 === 0); // Some(2)
	 * Some(1).filter(x => x % 2 === 0); // None()
	 * None().filter(x => x % 2 === 0); // None()
	 */
	filter(p: (t: OK) => boolean): OptionVariant<{ Some: OK; None: undefined }>;
};

/**
 * Option instance (Some or None) enriched with extraction and mapping helpers.
 *
 * This type is invariant. See `ResultVariant` for notes on usage.
 */
export type OptionVariant<ALL extends { Some: unknown; None: undefined }> =
	IronEnumVariant<keyof ALL & string, ALL[keyof ALL], ALL> &
	ExtendedRustMethods<ALL["Some"]> &
	OptionMethods<ALL["Some"]>;

/**
 * Factory for creating Some and None variants plus metadata via `_`.
 *
 * @example
 * const O = Option<number>();
 * const s = O.Some(1);
 * const n = O.None();
 */
export type OptionFactory<ALL extends { Some: unknown; None: undefined }> = {
    Some(data: ALL["Some"]): IronEnumVariant<"Some", ALL["Some"], ALL> & ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>;
    None(): IronEnumVariant<"None", ALL["None"], ALL> & ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>;
    _: EnumProperties<ALL, ExtendedRustMethods<ALL["Some"]> & OptionMethods<ALL["Some"]>>;
};

/**
 * Internal constructor for a typed Option factory.
 */
const OptionInternal = <T>(): OptionFactory<{ Some: T; None: undefined }> => {
	const O = IronEnum<{ Some: T; None: undefined }>({ keys: ["None", "Some"] });

	const SomeCtor = (value: T) => {
		const base = (O as any).Some(value);

		return Object.assign(base, {
			isSome: () => true,
			isNone: () => false,
			unwrap: () => value,
			unwrap_or: () => value,
			unwrap_or_else: () => value,
			ok_or<E>(_err: E) {
				return Result<T, E>().Ok(value);
			},
			ok_or_else<E>(_errFn: () => E) {
				return Result<T, E>().Ok(value);
			},
			map<U>(f: (t: T) => U) {
				return Option<U>().Some(f(value)) as any;
			},
			andThen<U>(f: (t: T) => OptionVariant<{ Some: U; None: undefined }>) {
				return f(value) as any;
			},
			filter(p: (t: T) => boolean) {
				return p(value) ? Option<T>().Some(value) : Option<T>().None();
			},
		});
	};

	const NoneCtor = () => {
		const base = (O as any).None();

		return Object.assign(base, {
			isSome: () => false,
			isNone: () => true,
			unwrap: () => {
				throw new Error("Called unwrap() on Option.None");
			},
			unwrap_or: <R>(x: R) => x,
			unwrap_or_else: <R>(cb: () => R) => cb(),
			ok_or<E>(err: E) {
				return Result<T, E>().Err(err);
			},
			ok_or_else<E>(errFn: () => E) {
				return Result<T, E>().Err(errFn());
			},
			map<U>(_f: (t: T) => U) {
				return Option<U>().None();
			},
			andThen<U>(_f: (t: T) => OptionVariant<{ Some: U; None: undefined }>) {
				return Option<U>().None();
			},
			filter(_p: (t: T) => boolean) {
				return Option<T>().None();
			},
		});
	};

	return { _: (O._ as any), Some: SomeCtor, None: NoneCtor };
};


/**
 * Create a typed Option factory `<T>`.
 *
 * @example
 * const NumberOption = Option<number>();
 * const s = NumberOption.Some(100);
 *
 * function process(o: typeof NumberOption._.typeOf) {
 * // ...
 * }
 */
export const Option: <T>() => OptionFactory<{ Some: T; None: undefined }> = <T>() =>
	OptionInternal<T>();

/**
 * Convenience Some constructor for ad-hoc values.
 *
 * @example
 * const s = Some(123); // OptionVariant<{ Some: number, ... }>
 */
export const Some: <T>(value: T) => OptionVariant<{ Some: T; None: undefined }> = <T>(
	value: T
) => Option<T>().Some(value);

/**
 * Convenience None constructor.
 * The `Some` type is `never`.
 *
 * @example
 * const n = None(); // OptionVariant<{ Some: never, ... }>
 */
export const None: () => OptionVariant<{ Some: never; None: undefined }> = () =>
	Option<never>().None();

/* =============================================================================
 * Try / TryInto Utilities
 * ============================================================================= */

/**
 * Convert exception-throwing code into Result-returning code.
 */
export const Try = {
	/**
	 * Execute a synchronous function and wrap the outcome.
	 *
	 * Ok on success, Err with the caught exception on failure.
	 *
	 * @example
	 * const throws = () => { throw new Error("!"); };
	 * const r = Try.sync(throws); // Err(Error("!"))
	 *
	 * const r2 = Try.sync(() => JSON.parse("{")); // Err(SyntaxError(...))
	 * const r3 = Try.sync(() => JSON.parse('{"a":1}')); // Ok({ a: 1 })
	 */
	sync<X>(cb: () => X): ResultVariant<{ Ok: X; Err: unknown }> {
		// Create a single factory for this function's return type
		const R = Result<X, unknown>();
		try {
			// Use the local factory's .Ok
			return R.Ok(cb());
		} catch (e) {
			// Use the local factory's .Err
			return R.Err(e);
		}
	},

	/**
	 * Execute an asynchronous function and wrap the outcome.
	 *
	 * Resolves to Ok on success, Err with the caught exception on rejection.
	 *
	 * @example
	 * const rejects = async () => { throw new Error("!"); };
	 * const r = await Try.async(rejects); // Err(Error("!"))
	 *
	 * const r2 = await Try.async(() => fetch("/good")); // Ok(Response)
	 */
	async async<X>(cb: () => Promise<X>): Promise<ResultVariant<{ Ok: X; Err: unknown }>> {
		// Create a single factory for this function's return type
		const R = Result<X, unknown>();
		try {
			// Use the local factory's .Ok
			return R.Ok(await cb());
		} catch (e) {
			// Use the local factory's .Err
			return R.Err(e);
		}
	},
};

/**
 * Transform functions to return Result instead of throwing.
 */
export const TryInto = {
	/**
	 * Wrap a synchronous function. The wrapper never throws.
	 *
	 * @example
	 * const unsafeParse = (s: string) => JSON.parse(s);
	 * const safeParse = TryInto.sync(unsafeParse);
	 *
	 * const r1 = safeParse('{"a":1}'); // Ok({ a: 1 })
	 * const r2 = safeParse("{"); // Err(SyntaxError(...))
	 */
	sync<X, Y extends any[]>(cb: (...args: Y) => X) {
		return (...args: Y) => Try.sync(() => cb(...args));
	},

	/**
	 * Wrap an asynchronous function. The wrapper resolves to Result
	 * instead of rejecting.
	 *
	 * @example
	 * const unsafeFetch = async (url: string) => {
	 * 		const res = await fetch(url);
	 * 		if (!res.ok) throw new Error(res.statusText);
	 * 		return res.json();
	 * }
	 *
	 * const safeFetch = TryInto.async(unsafeFetch);
	 *
	 * const r1 = await safeFetch("/api/data"); // Ok(data)
	 * const r2 = await safeFetch("/api/404"); // Err(Error("Not Found"))
	 */
	async<X, Y extends any[]>(cb: (...args: Y) => Promise<X>) {
		return async (...args: Y) => Try.async(() => cb(...args));
	},
};