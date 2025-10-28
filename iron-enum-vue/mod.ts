import { defineComponent, type PropType, type SlotsType } from "vue";
import type {
  VariantsRecord,
  IronEnumFactory,
  IronEnumVariantUnion,
} from "iron-enum";

type TagOf<ALL extends VariantsRecord> = keyof ALL & string;

type TagSlots<ALL extends VariantsRecord> = {
  [K in TagOf<ALL>]?: (p: ALL[K]) => any;
};

type FallbackSlot<ALL extends VariantsRecord> = {
  _?: (p: IronEnumVariantUnion<ALL>) => any;
};

export function createEnumMatch<ALL extends VariantsRecord>(
  _factory: IronEnumFactory<ALL>
) {
  return defineComponent({
    name: "EnumMatch",
    props: {
      of: {
        type: Object as PropType<IronEnumVariantUnion<ALL>>,
        required: true as const,
      },
    },
    // purely for typing; ignored at runtime
    slots: {} as SlotsType<TagSlots<ALL> & FallbackSlot<ALL>>,
    setup(
      props: Readonly<{ of: IronEnumVariantUnion<ALL> }>,
      { slots }
    ) {
      return () => {
        const v = props.of;
        const tag = v.tag as TagOf<ALL>;

        // Narrow slots for dynamic access
        const tagHandlers = slots as unknown as Partial<
          Record<TagOf<ALL>, (p: unknown) => any>
        > &
          FallbackSlot<ALL>;

        const s = tagHandlers[tag];
        if (s) return s(v.data);
        const fb = tagHandlers._;
        return fb ? fb(v) : null;
      };
    },
  });
}

export function createEnumMatchExhaustive<ALL extends VariantsRecord>(
  factory: IronEnumFactory<ALL>
) {
  const Base = createEnumMatch(factory);
  return defineComponent({
    name: "EnumMatchExhaustive",
    props: Base.props,
    slots: Base.slots,
    setup(
      props: Readonly<{ of: IronEnumVariantUnion<ALL> }>,
      { slots }
    ) {
      return () => {
        const v = props.of;
        const tag = v.tag as TagOf<ALL>;

        const tagHandlers = slots as unknown as Partial<
          Record<TagOf<ALL>, (p: unknown) => any>
        >;

        const s = tagHandlers[tag];
        if (!s) throw new Error(`Missing slot for '${String(tag)}'`);
        return s(v.data);
      };
    },
  });
}



