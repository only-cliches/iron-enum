import { z, ZodError, ZodType } from 'zod';
import { IronEnum, Result } from 'iron-enum';
import type {
    IronEnumFactory,
    IronEnumVariantUnion,
    ResultVariant,
    VariantsRecord,
    IronEnumWireFormat,
    IronEnumVariant
} from 'iron-enum';

export type ZodEnum<
    T extends { [K in string]: ZodType },
    Variants extends VariantsRecord = { [K in keyof T]: z.infer<T[K]> }
> = {
    /** The core IronEnum factory instance */
    self: IronEnumFactory<Variants>,
    /**
     * Parses a raw object, validates it, and returns an IronEnum instance.
     * Throws an error if validation fails.
     */
    parse: <TAG extends keyof Variants & string>(input: Variants[TAG] extends undefined ? { tag: TAG, data?: Variants[TAG] } : { tag: TAG, data: Variants[TAG] }, params?: z.core.ParseContext<z.core.$ZodIssue>) => IronEnumVariant<TAG, Variants[TAG], Variants>,
    /**
     * A non-throwing version of `.parse` that returns a Result type instead. You can call `.unwrap()` to get the value and optionally throw an error.
     * * @param input object to parse
     * @param params Zod parse parameters
     * @returns Result<Enum, ZodError>
     */
    safeParse: <TAG extends keyof Variants & string>(input: Variants[TAG] extends undefined ? { tag: TAG, data?: Variants[TAG] } : { tag: TAG, data: Variants[TAG] }, params?: z.core.ParseContext<z.core.$ZodIssue>) => ResultVariant<{ Ok: IronEnumVariant<TAG, Variants[TAG], Variants>, Err: z.ZodError }>,
    /** The raw Zod schema for the enum's wire format */
    schema: z.ZodType<IronEnumWireFormat<Variants>>
}

export function createZodEnum<
    T extends { [K in string]: ZodType }
>(payloads: T): "_" extends keyof T ? "ERROR: '_' is reserved!" : ZodEnum<T> {

    type Variants = { [K in keyof T]: z.infer<T[K]> };
    type WireFormat = IronEnumWireFormat<Variants>;

    const Enum = IronEnum<Variants>({
        keys: Object.keys(payloads) as (keyof Variants & string)[],
    }) as IronEnumFactory<Variants>;

    const variantSchemas = Object.entries(payloads).map(
        ([key, payloadSchema]) => {
            return z.object({
                tag: z.literal(key),
                data: payloadSchema
            }).strict();
        }
    );

    let Schema: z.ZodType<WireFormat>;

    if (variantSchemas.length === 0) {
        Schema = z.never();
    } else if (variantSchemas.length === 1) {
        Schema = variantSchemas[0] as any;
    } else {
        Schema = z.union(
            variantSchemas as unknown as [ZodType, ZodType, ...ZodType[]]
        ) as any;
    }

    const R = Result<typeof Enum._.typeOf, ZodError>();

    return {
        self: Enum,
        parse: (input: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => {
            const parsed = Schema.parse(input, params) as WireFormat;
            return Enum._.parse(parsed);
        },
        safeParse: (input: unknown, params?: z.core.ParseContext<z.core.$ZodIssue>) => {
            const result = Schema.safeParse(input, params);
            if (result.success) {
                return R.Ok(Enum._.parse(result.data as WireFormat));
            }
            return R.Err(result.error);
        },
        schema: Schema
    } as any;
}