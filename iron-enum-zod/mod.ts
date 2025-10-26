import { z, ZodError } from 'zod';
import { IronEnum, Result } from 'iron-enum';
import type {
    IronEnumInstance,
    EnumFactoryUnion,
    ResultFactory,
    VariantsRecord
} from 'iron-enum';

export type ZodEnum<
    T extends { [K in string]: z.ZodTypeAny },
    Variants extends VariantsRecord = { [K in keyof T]: z.infer<T[K]> }
> = {
    /** The core IronEnum factory instance */
    self: IronEnumInstance<Variants>,
    /**
     * Parses a raw object, validates it, and returns an IronEnum instance.
     * Throws an error if validation fails.
     */
    parse: (input: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => EnumFactoryUnion<Variants>,
	/**
	 * A non throwing version of `.parse` that returns a Result type instead. You can call `.unwrap()` to get the value and optionally throw an error.
	 * 
	 * @param input object to parse
	 * @param params Zod parse parameters
	 * @returns Result<Enum, ZodError>
	 */
	safeParse: (input: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => ResultFactory<{Ok: EnumFactoryUnion<Variants>, Err: z.ZodError}>,
    /** The raw Zod schema for the enum */
    schema: z.ZodType<Partial<Variants>>
}

export function createZodEnum<
    T extends { [K in string]: z.ZodTypeAny }
>(payloads: T): "_" extends keyof T ? "ERROR: '_' is reserved!" : ZodEnum<T> {

    type Variants = { [K in keyof T]: z.infer<T[K]> };
	type EnumType = EnumFactoryUnion<Variants>;

    const Enum = IronEnum<Variants>({
        keys: Object.keys(payloads) as (keyof Variants & string)[],
    }) as IronEnumInstance<Variants>;

    const variantSchemas = Object.entries(payloads).map(
        ([key, payloadSchema]) => {
            return z.object({ [key]: payloadSchema }).strict();
        }
    );

    let Schema: z.ZodType<Partial<Variants>>;

    if (variantSchemas.length === 0) {
        Schema = z.never();
    } else if (variantSchemas.length === 1) {
        Schema = variantSchemas[0] as any;
    } else {
        const [first, second, ...rest] = variantSchemas as [
            z.ZodObject<any>,
            z.ZodObject<any>,
            ...z.ZodObject<any>[]
        ];
        const unionSchema = z.union([first, second, ...rest]);
        Schema = unionSchema.refine(
            (val) => Object.keys(val).length === 1,
            { message: "Input must have exactly one variant key" }
        ) as any;
    }

	const R = Result<EnumType, ZodError>();

    return {
        self: Enum,
        parse: (input: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => Enum._.parse(Schema.parse(input, params)),
		safeParse: (input: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => {
			const result = Schema.safeParse(input, params);
			if (result.success) {
				return R.Ok(Enum._.parse(result.data));
			}
			return R.Err(result.error);
		},
        schema: Schema
    } as any;
}