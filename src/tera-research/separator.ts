import { MacroDictionary } from '../public/core-types';

export enum SeparatorCharacter {
  Space = ' ',
  Underscore = '_',
  Dot = '.',
  Comma = ',',
  Apostrophe = "'",
  Nothing = '',
}

export const CharacterLatexMap = {
  [SeparatorCharacter.Space]: '\\:',
  [SeparatorCharacter.Underscore]: '{\\_}',
  [SeparatorCharacter.Dot]: '.',
  [SeparatorCharacter.Comma]: ',',
  [SeparatorCharacter.Apostrophe]: "'",
  [SeparatorCharacter.Nothing]: '',
};

export class SeparatorUtils {
  static getThousandSeparatorMacro(char: SeparatorCharacter): MacroDictionary {
    return {
      thousandSep: {
        def: CharacterLatexMap[char || SeparatorCharacter.Nothing],
        isImplicitArg: false,
      },
    };
  }

  static getThousandthSeparatorMacro(
    char: SeparatorCharacter
  ): MacroDictionary {
    return {
      thousandthSep: {
        def: CharacterLatexMap[char || SeparatorCharacter.Nothing],
        isImplicitArg: false,
      },
    };
  }

  static getDecimalSeparatorMacro(char: SeparatorCharacter): MacroDictionary {
    return {
      decimalsep: {
        def: CharacterLatexMap[char || SeparatorCharacter.Nothing],
        isImplicitArg: false,
      },
    };
  }
}
