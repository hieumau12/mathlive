import { Atom } from '../core/atom-class';
import { Context } from '../core/context';
import { Box } from '../core/box';
import type { AtomJson, CreateAtomOptions } from 'core/types';
import type { Argument } from '../latex-commands/types';
import { PlaceholderAtom } from './placeholder';
import {
  argAtoms,
  parseArgAsString,
} from '../latex-commands/definitions-utils';

export class VariableAtom extends Atom {
  readonly variableArgs: (Argument | null)[];

  constructor(options: CreateAtomOptions) {
    super({ type: 'variable', ...options });
    this.variableArgs = options.args || [];
    this.body = !this.variableArgs[0]
      ? [new PlaceholderAtom()]
      : argAtoms(this.variableArgs[0]);
    this.captureSelection = true;
  }

  static fromJson(json: AtomJson): VariableAtom {
    return new VariableAtom(json as any);
  }

  toJson(): AtomJson {
    const options = super.toJson();
    if (this.variableArgs) options.args = this.variableArgs;
    return options;
  }

  render(context: Context): Box | null {
    let result: Box | null;

    /*
     * In case variable is randreal
     * it need to be bold style and italic
     * the content should be Rand#
     * */
    if (parseArgAsString(argAtoms(this.variableArgs[0])) === 'randreal') {
      result = Atom.createBox(context, [
        new Atom({
          value: 'Rand#',
          style: {
            variantStyle: 'bolditalic',
          },
        }),
      ]);
    } else result = Atom.createBox(context, this.body);

    if (!result) return null;
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}
