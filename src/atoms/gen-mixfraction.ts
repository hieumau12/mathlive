import type { MathstyleName, Style } from "../public/core-types";

import { Atom } from "../core/atom-class";
import { Box } from "../core/box";
import { VBox } from "../core/v-box";
import { Context } from "../core/context";
import { AXIS_HEIGHT } from "../core/font-metrics";
import type { AtomJson } from "core/types";
import {makeCustomSizedDelim} from "../core/delimiters";

export type GenMixFractionOptions = {
  continuousFraction?: boolean;
  align?: "left" | "right" | "center";
  numerPrefix?: string;
  denomPrefix?: string;
  leftDelim?: string;
  rightDelim?: string;
  hasBarLine?: boolean;
  mathstyleName?: MathstyleName;
  fractionNavigationOrder?: "numerator-denominator" | "denominator-numerator";
  style?: Style;
};

/**
 * GenMixFraction -- Generalized Mix Fraction
 *
 * Decompose mixfractions
 *
 */
export class GenMixFractionAtom extends Atom {
  readonly hasBarLine: boolean;
  readonly leftDelim?: string;
  readonly rightDelim?: string;
  private readonly continuousFraction: boolean;
  private readonly align: "left" | "right" | "center";
  private readonly numerPrefix?: string;
  private readonly denomPrefix?: string;
  private readonly mathstyleName?: MathstyleName;
  private readonly fractionNavigationOrder?:
    | "numerator-denominator"
    | "denominator-numerator";

  constructor(
    left: readonly Atom[],
    above: readonly Atom[],
    below: readonly Atom[],
    options: GenMixFractionOptions
  ) {
    super({
      ...options,
      type: "genmixfraction",
      displayContainsHighlight: true
    });
    this.above = above;
    this.below = below;
    this.body = left;
    this.hasBarLine = options?.hasBarLine ?? true;
    this.continuousFraction = options?.continuousFraction ?? false;
    this.align = options?.align ?? "center";
    this.numerPrefix = options?.numerPrefix;
    this.denomPrefix = options?.denomPrefix;
    this.mathstyleName = options?.mathstyleName;
    this.leftDelim = options?.leftDelim;
    this.rightDelim = options?.rightDelim;
    this.fractionNavigationOrder = options?.fractionNavigationOrder;
  }

  // may be customized for fractions...
  get children(): readonly Atom[] {
    if (this._children) return this._children;

    const result: Atom[] = [];
    if (this.fractionNavigationOrder === "denominator-numerator") {
      for (const x of this.below!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.above!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.body!) {
        result.push(...x.children);
        result.push(x);
      }
    } else {
      for (const x of this.body!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.above!) {
        result.push(...x.children);
        result.push(x);
      }
      for (const x of this.below!) {
        result.push(...x.children);
        result.push(x);
      }
    }

    this._children = result;
    return result;
  }

  static fromJson(json: AtomJson): GenMixFractionAtom {
    return new GenMixFractionAtom(
      json.left,
      json.above,
      json.below,
      json as any as GenMixFractionOptions
    );
  }

  // The order of the children, which is used for keyboard navigation order,

  toJson(): AtomJson {
    const options: GenMixFractionOptions = {};
    if (this.continuousFraction) options.continuousFraction = true;
    if (this.align !== "center") options.align = this.align;
    if (!this.hasBarLine) options.hasBarLine = false;
    if (this.mathstyleName) options.mathstyleName = this.mathstyleName;
    if (this.fractionNavigationOrder)
      options.fractionNavigationOrder = this.fractionNavigationOrder;
    return { ...super.toJson(), ...options };
  }

  render(context: Context): Box | null {
    const mixedFractionContext = new Context(
      { parent: context, mathstyle: this.mathstyleName },
      this.style
    );
    const metrics = mixedFractionContext.metrics;

    const wholeNumContext = new Context(
      {
        parent: mixedFractionContext,
        mathstyle: ""
      },
      this.style
    );
    const wholeNumBox =
      Atom.createBox(wholeNumContext, this.body, { type: "ignore" }) ??
      new Box(null, { type: "ignore" });

    const numContext = new Context(
      {
        parent: mixedFractionContext,
        mathstyle: this.continuousFraction ? "" : "numerator"
      },
      this.style
    );
    const numerBox = this.numerPrefix
      ? new Box(
        [new Box(this.numerPrefix), Atom.createBox(numContext, this.above)],
        { isTight: numContext.isTight, type: "ignore" }
      )
      : Atom.createBox(numContext, this.above, { type: "ignore" }) ??
      new Box(null, { type: "ignore" });

    const denomContext = new Context(
      {
        parent: mixedFractionContext,
        mathstyle: this.continuousFraction ? "" : "denominator"
      },
      this.style
    );
    const denomBox = this.denomPrefix
      ? new Box([
        new Box(this.denomPrefix),
        Atom.createBox(denomContext, this.below, { type: "ignore" })
      ])
      : Atom.createBox(denomContext, this.below, { type: "ignore" }) ??
      new Box(null, { type: "ignore" });

    const ruleThickness = this.hasBarLine ? metrics.defaultRuleThickness : 0;

    // Rule 15b from TeXBook Appendix G, p.444
    //
    // 15b. If C > T, set u ← σ8 and v ← σ11. Otherwise set u ← σ9 or σ10,according
    // as θ ̸= 0 or θ = 0, and set v ← σ12. (The fraction will be typeset with
    // its numerator shifted up by an amount u with respect to the current
    // baseline, and with the denominator shifted down by v, unless the boxes
    // are unusually large.)
    let numerShift: number;
    let clearance = 0;
    let denomShift: number;
    if (mixedFractionContext.isDisplayStyle) {
      numerShift = numContext.metrics.num1; // Set u ← σ8
      clearance = ruleThickness > 0 ? 3 * ruleThickness : 7 * ruleThickness;
      denomShift = denomContext.metrics.denom1; // V ← σ11
    } else {
      if (ruleThickness > 0) {
        numerShift = numContext.metrics.num2; // U ← σ9
        clearance = ruleThickness; //  Φ ← θ
      } else {
        numerShift = numContext.metrics.num3; // U ← σ10
        clearance = 3 * metrics.defaultRuleThickness; // Φ ← 3 ξ8
      }

      denomShift = denomContext.metrics.denom2; // V ← σ12
    }

    const classes: string[] = [];
    if (this.isSelected) classes.push("ML__selected");
    const numerDepth = numerBox.depth;
    const denomHeight = denomBox.height;
    let frac: Box;
    let mixFrac: Box;
    if (ruleThickness <= 0) {
      // Rule 15c from Appendix G
      // No bar line between numerator and denominator
      const candidateClearance =
        numerShift - numerDepth - (denomHeight - denomShift);
      if (candidateClearance < clearance) {
        numerShift += (clearance - candidateClearance) / 2;
        denomShift += (clearance - candidateClearance) / 2;
      }

      frac = new VBox({
        individualShift: [
          {
            box: numerBox,
            shift: -numerShift,
            classes: [...classes, align(this.align)]
          },
          {
            box: denomBox,
            shift: denomShift,
            classes: [...classes, align(this.align)]
          }
        ]
      });
    } else {
      // Rule 15d from Appendix G of the TeXBook.
      // There is a bar line between the numerator and the denominator

      const fracLine = new Box(null, {
        classes: "ML__frac-line",
        mode: this.mode,
        style: this.style
      });
      fracLine.softWidth = Math.max(numerBox.width, denomBox.width);
      fracLine.height = ruleThickness / 2;
      fracLine.depth = ruleThickness / 2;

      const numerLine = AXIS_HEIGHT + ruleThickness / 2;
      if (numerShift < clearance + numerDepth + numerLine)
        numerShift = clearance + numerDepth + numerLine;

      const denomLine = AXIS_HEIGHT - ruleThickness / 2;
      if (denomShift < clearance + denomHeight - denomLine)
        denomShift = clearance + denomHeight - denomLine;

      frac = new VBox({
        individualShift: [
          {
            box: denomBox,
            shift: denomShift,
            classes: [...classes, align(this.align)]
          },
          { box: fracLine, shift: -denomLine, classes },
          {
            box: numerBox,
            shift: -numerShift,
            classes: [...classes, align(this.align)]
          }
        ]
      });

      // console.log('denom', denomBox.height, denomBox.depth);
      // console.log('fracline', fracLine.height, fracLine.depth);
      // console.log('numer', numerBox.height, numerBox.depth);
      // console.log('frac', frac.height, frac.depth);
      // console.log(
      //   'expected',
      //   denomBox.height + denomBox.depth + fracLine.height,
      //   numerBox.height + numerBox.depth + fracLine.depth
      // );
    }
    const delimSize = metrics.num1

    const leftDelim = this.bind(
      context,
      makeCustomSizedDelim(
        'open',
        '[',
        delimSize/2,
        true,
        context,
        { style: this.style, mode: this.mode, isSelected: this.isSelected }
      )
    );
    const rightDelim = this.bind(
      context,
      makeCustomSizedDelim(
        'close',
        ']',
        delimSize/2,
        true,
        context,
        { style: this.style, mode: this.mode, isSelected: this.isSelected }
      )
    );


    mixFrac = new Box([leftDelim, wholeNumBox, frac, rightDelim], {
      classes: classes.join(" "),
      type: "inner",
      isTight: mixedFractionContext.isTight
    }).wrap(mixedFractionContext);

    const result = this.bind(context, mixFrac);
    if (this.caret) result.caret = this.caret;

    return this.attachSupsub(context, { base: result });
  }
}

function align(v: "left" | "right" | "center"): string {
  return (
    {
      left: "ML__left",
      right: "ML__right",
      center: "ML__center"
    }[v] ?? "ML__center"
  );
}
