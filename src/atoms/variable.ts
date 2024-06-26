import {Atom} from '../core/atom-class';
import {Context} from '../core/context';
import {Box} from '../core/box';
import type {AtomJson, AtomType, CreateAtomOptions, ToLatexOptions} from 'core/types';
import type {Argument} from '../latex-commands/types';
import {PlaceholderAtom} from './placeholder';
import {ScientificConstantsData} from '../tera-research/ScientificConstants.data';
import {MetricConversionsData} from '../tera-research/MetricConversion.data';

export class VariableAtom extends Atom {
  readonly variableArgs: (Argument | null)[];

  constructor(options: CreateAtomOptions) {
    // type == 'variable' | 'constant' | 'conversion'
    super({type: options.command?.substring(1) as AtomType, ...options});
    this.variableArgs = options.args || [];

    this.body = !this.variableArgs[0]
      ? [new PlaceholderAtom()]
      : [
        new Atom({
          type: 'not-editable',
          value: this.variableArgs[0] as string,
        }),
      ];

    this.captureSelection = true;
    this.displayContainsHighlight = true;
    this.skipBoundary = true;

    this.isImplicitArg = this.type !== 'conversion';
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
    let result: Box | null = null;

    if (this.type === 'variable') {
      let ansValue: {atoms: Atom[], latex: string} | undefined = undefined
      let rootContext: Context = context;

      while (rootContext.parent) {
        rootContext = rootContext.parent!;
      }

      ansValue = rootContext.ansValue;

      /*
       * In case variable is randreal
       * it need to be bold style and italic
       * the content should be Rand#
       * */
      if (this.variableArgs[0] === 'randreal') {
        result = Atom.createBox(context, [
          new Atom({
            value: 'Rand#',
            type: 'not-editable',
            style: {
              variantStyle: 'bolditalic',
            },
          }),
        ]);

      } else if (this.variableArgs[0] === 'Ans' && ansValue) {
        let atoms = ansValue.atoms

        let tempAtom = new Atom({
          body: atoms,
          type: "macro",
          captureSelection: true,
          isImplicitArg: true,
        })

        const tempAnsValueBox = Atom.createBox(context, tempAtom.body, {type: 'lift'})!

        tempAnsValueBox.classes = 'ML__ans-value'

        result = tempAnsValueBox

        result.depth = result.depth + 0.9
        result.height = result.height + 0.25
      } else result = Atom.createBox(context, this.body, {type: 'lift'});
    }

    if (this.type === 'constant') {
      const symbol =
        ScientificConstantsData.find((c) => c.code === this.variableArgs[0])
          ?.symbol || (this.variableArgs[0] as string);
      result = Atom.createBox(context, [
        new Atom({
          value: symbol,
          type: 'not-editable',
          style: {
            variantStyle: 'bolditalic',
          },
        }),
      ]);
    }

    if (this.type === 'conversion') {
      const symbol =
        MetricConversionsData.find((c) => c.code === this.variableArgs[0])
          ?.symbol || (this.variableArgs[0] as string);
      result = Atom.createBox(context, [
        new Atom({
          value: symbol,
          type: 'not-editable',
          style: {
            variantStyle: 'bold',
          },
        }),
      ]);
    }

    if (!result) return null;
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}
