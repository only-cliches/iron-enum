import { defineComponent, h } from 'vue';
import type { PropType, VNode, Slots } from 'vue';
import type { VariantsRecord, EnumFactoryUnion } from 'iron-enum';

// Define the type for the slots that the consumer will provide
type MatchSlots<ALL extends VariantsRecord> = {
    [K in keyof ALL & string]?: (props: { payload: ALL[K] }) => VNode[];
} & {
    /**
     * A fallback slot, `_`, for non-exhaustive matches.
     */
    _?: (props: {}) => VNode[];
};

export const Match = defineComponent({
    name: 'Match',

    /**
     * Runtime props definition.
     * We use a broad type here for the runtime, and the `setup`
     * function will provide the specific generic types.
     */
    props: {
        on: {
            type: Object as PropType<EnumFactoryUnion<any>>,
            required: true,
        },
    },

    /**
     * The `setup` function is where we introduce the generic.
     * Vue will infer `ALL` from the `on` prop that's passed in.
     */
    setup<ALL extends VariantsRecord>(
        props: any,
        { slots }: { slots: Slots }
    ) {
        // The `setup` function returns the `render` function.
        return () => {
            // Cast the `on` prop (typed as `any` by the runtime prop)
            // to our inferred generic type. This is type-safe.
            const on = props.on as EnumFactoryUnion<ALL>;
            const tag = on.tag as keyof ALL & string;
            const payload = on.payload;

            // Cast the runtime `slots` object to our typed definition
            const typedSlots = slots as MatchSlots<ALL>;

            // Find the matching slot, falling back to '_'
            const slot = typedSlots[tag] ?? typedSlots._;

            if (slot) {
                // If a slot is found, render it by calling it
                // as a function and passing the payload.
                return slot({ payload: payload });
            }

            // Render an empty comment node
            return h(() => null);
        };
    },
});