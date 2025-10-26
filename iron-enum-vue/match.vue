<script
  setup
  lang="ts"
  generic="ALL extends VariantsRecord"
>
import { computed, useSlots } from 'vue';
import type { VariantsRecord, EnumFactoryUnion } from 'iron-enum';

/**
 * 1. Define component props.
 * The `generic` attribute on <script> makes the component
 * generic over the enum's VariantsRecord.
 */
const props = defineProps<{
  /**
   * The enum instance to match against.
   */
  on: EnumFactoryUnion<ALL>;
}>();

/**
 * 2. Define all possible slots and their payload types.
 * Vue's Volar tooling will read this and provide
 * full type-safety in the template.
 */
defineSlots<
  {
    /**
     * Dynamically define a slot for every key in the enum.
     * The slot props will contain the 'payload' for that variant.
     */
    [K in keyof ALL & string]?: (props: { payload: ALL[K] }) => any;
  } & {
    /**
     * A fallback slot, `_`, for non-exhaustive matches.
     */
    _?: (props: {}) => any;
  }
>();

/**
 * 3. Get a reference to the slots passed by the parent.
 */
const slots = useSlots();

/**
 * 4. Create a computed property to find the correct slot name.
 * This is reactive and will update when `props.on` changes.
 */
const slotName = computed(() => {
  const tag = props.on.tag as string;
  
  // Check if a specific slot exists (e.g., #Ready)
  if (slots[tag]) {
    return tag;
  }
  
  // Check if a fallback slot exists (e.g., #_)
  if (slots._) {
    return '_';
  }

  return null;
});

/**
 * 5. Create a computed property for the payload.
 */
const payload = computed(() => props.on.payload);
</script>

<template>
  <slot
    v-if="slotName"
    :name="slotName"
    :payload="payload"
  />
</template>