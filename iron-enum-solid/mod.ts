import { createMemo } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";
import type { VariantsRecord, EnumFactoryUnion } from "iron-enum";

// Define the 'cases' prop types, similar to React's
type BaseMatchCases<T, R> = {
    [K in keyof T]?: T[K] extends undefined | null | void
    ? () => R
    : (payload: T[K]) => R;
};

type NonOptional<T> = { [K in keyof T]-?: T[K] };
type MatchCases<ALL extends VariantsRecord> =
    | NonOptional<BaseMatchCases<ALL, JSX.Element>>
    | (BaseMatchCases<ALL, JSX.Element> & { _: () => JSX.Element });

/**
 * Props for the <Match> component.
 */
export interface MatchProps<ALL extends VariantsRecord> {
    /**
     * The enum instance to match against.
     * This should be a signal accessor, e.g., `status()`
     */
    on: EnumFactoryUnion<ALL>;
    /**
     * An object of handlers for each variant.
     */
    cases: MatchCases<ALL>;
}

/**
 * A type-safe, reactive component for matching against
 * an IronEnum instance in Solid.
 *
 * @example
 * const [status, setStatus] = createSignal(Status.Loading());
 *
 * <Match
 * on={status()}
 * cases={{
 * Loading: () => <Spinner />,
 * Ready: (payload) => <DataView data={payload} />,
 * _: () => <Fallback />
 * }}
 * />
 */
export function Match<ALL extends VariantsRecord>(props: MatchProps<ALL>) {
    // Create a memo that reactively computes the rendered output.
    // This memo will re-run ONLY when the enum's tag or payload changes.
    const renderedElement = createMemo(() => {
        // We access props.on inside the memo to create a subscription.
        const tag = props.on.tag as keyof ALL & string;
        const payload = props.on.payload;

        // We also access props.cases inside, in case it's a signal.
        const handler = (props.cases as any)[tag] ?? (props.cases as any)._;

        // Call the correct handler
        return (handler as any)(payload);
    });

    // Return the memo's accessor. Solid knows how to render this.
    return renderedElement;
}