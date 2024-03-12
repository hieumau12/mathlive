import { Atom } from "../core/atom-class";
import { Context } from "../core/context";
import { Box } from "../core/box";
import type { AtomJson, AtomType, CreateAtomOptions } from "core/types";
import type { Argument } from "../latex-commands/types";
import { PlaceholderAtom } from "./placeholder";
import { ScientificConstantsData } from "../tera-research/ScientificConstants.data";
import { MetricConversionsData } from "../tera-research/MetricConversion.data";

export class VariableAtom extends Atom {
  readonly variableArgs: (Argument | null)[];

  constructor(options: CreateAtomOptions) {
    // type == 'variable' | 'constant' | 'conversion'
    super({ type: options.command?.substring(1) as AtomType, ...options });
    this.variableArgs = options.args || [];
    this.body = !this.variableArgs[0]
      ? [new PlaceholderAtom()]
      : [new Atom({
        value: this.variableArgs[0] as string
      })];
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
    let result: Box | null = null;

    if (this.type == "variable") {
      /*
      * In case variable is randreal
      * it need to be bold style and italic
      * the content should be Rand#
      * */
      if (this.variableArgs[0] === "randreal") {
        result = Atom.createBox(context, [
          new Atom({
            value: "Rand#",
            style: {
              variantStyle: "bolditalic"
            }
          })
        ]);
      } else result = Atom.createBox(context, this.body);
    }

    if (this.type == "constant") {
      let symbol = ScientificConstantsData.find(c => c.code === this.variableArgs[0])?.symbol || this.variableArgs[0] as string;
      result = Atom.createBox(context, [
        new Atom({
          value: symbol,
          style: {
            variantStyle: "bolditalic"
          }
        })
      ]);
    }

    if (this.type == "conversion") {
      let symbol = MetricConversionsData.find(c => c.code === this.variableArgs[0])?.symbol || this.variableArgs[0] as string;
      result = Atom.createBox(context, [
        new Atom({
          value: symbol,
          style: {
            variantStyle: "bold"
          }
        })
      ]);
    }

    if (!result) return null;
    if (this.caret) result.caret = this.caret;
    return this.bind(context, result);
  }
}
