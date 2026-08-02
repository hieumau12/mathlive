import { MacroDictionary } from '../public/core-types';

export enum ExponentialENotation {
  MathRm = 'mathrm',
  Scientific = 'scientific',
}

export const ExponentialELatexMap: Record<ExponentialENotation, string> = {
  [ExponentialENotation.MathRm]: ' \\mathrm{ᴇ}',
  [ExponentialENotation.Scientific]: ' \\scriptsize{\\times10}',
};

export class ExponentialEUtils {
  static getExponentialEMacro(
    notation: ExponentialENotation
  ): MacroDictionary {
    return {
      exponentialE: {
        def: ExponentialELatexMap[notation || ExponentialENotation.MathRm],
        isImplicitArg: true,
      },
    };
  }
}
