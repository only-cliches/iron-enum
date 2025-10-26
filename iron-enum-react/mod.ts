import * as React from "react";
import type { VariantsRecord, EnumFactoryUnion } from "iron-enum";

/**
 * Defines the type for the 'cases' prop.
 * It's an object mapping variant names to render functions.
 * - Variants with no payload: () => React.ReactNode
 * - Variants with payload: (payload: P) => React.ReactNode
 */
type BaseMatchCases<T, R> = {
  [K in keyof T]?: T[K] extends undefined | null | void
  ? () => R
  : (payload: T[K]) => R;
};

/**
 * Ensures that the 'cases' prop is exhaustive,
 * either by handling all variants or providing a '_' fallback.
 */
type NonOptional<T> = { [K in keyof T]-?: T[K] };
type MatchCases<ALL extends VariantsRecord> =
  | NonOptional<BaseMatchCases<ALL, React.ReactNode>>
  | (BaseMatchCases<ALL, React.ReactNode> & { _: () => React.ReactNode });

/**
 * Props for the <Match> component.
 * It's generic over the enum's VariantsRecord.
 */
export interface MatchProps<ALL extends VariantsRecord> {
  /**
   * The enum instance to match against.
   */
  on: EnumFactoryUnion<ALL>;
  /**
   * An object of handlers for each variant.
   * Must be exhaustive or include a '_' fallback.
   * Payloads are fully type-inferred.
   */
  cases: MatchCases<ALL>;
}

/**
 * A type-safe, declarative component for matching against
 * an IronEnum instance.
 *
 * @example
 * <Match
 * on={status}
 * cases={{
 * Loading: () => <Spinner />,
 * Ready: (payload) => <DataView data={payload} />,
 * Error: ({ message }) => <ErrorDisplay error={message} />,
 * _: () => <Fallback />
 * }}
 * />
 */
export function Match<ALL extends VariantsRecord>({
  on,
  cases,
}: MatchProps<ALL>) {
  // Get the tag and payload from the enum instance
  const tag = on.tag as keyof ALL & string;
  const payload = on.payload;

  // Find the correct handler, falling back to '_'
  const handler = (cases as any)[tag] ?? (cases as any)._;

  // Call the handler.
  // We use `(handler as any)` to simplify the call,
  // as the `MatchCases` type already guarantees the
  // function signature is correct (e.g., it won't
  // receive a payload if it doesn't expect one).
  return (handler as any)(payload);
}