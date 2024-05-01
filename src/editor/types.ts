import { Selector } from '../public/commands';

export type SelectorPrivate = Selector

export type ExecuteCommandFunction = (
  command: SelectorPrivate | [SelectorPrivate, ...any[]]
) => boolean;

export type CommandRegistry<T> = Partial<{
  [K in SelectorPrivate]: { fn: (...args: unknown[]) => boolean } & T;
}>;
