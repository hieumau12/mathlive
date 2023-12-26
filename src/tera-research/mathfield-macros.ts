import {ScientificConstantsData} from "./ScientificConstants.data";
import {MetricConversionsData} from "./MetricConversion.data";


export const MATHFIELD_MACTOS_EXTEND = {
  exponentialE: '\\footnotesize\\textbf×10',
  modulo: '\\textrm{mod}',
  npr: '\\operatorname{P}',
  ncr: '\\operatorname{C}',
  arcsin: '\\sin^{-1}',
  arccos: '\\cos^{-1}',
  arctan: '\\tan^{-1}',
  arccot: '\\cot^{-1}',
  outpolar: '\\mathbf{▸r∠φ}',
  outcomplex: '\\mathbf{▸a+bi}',

  eulerE: '\\mathbf{e}',

  variable: {
    args: 1,
    def: '#1',
    isImplicitArg: true,
    argsMapping: variableMapping()
  },
  constant: {
    args: 1,
    def: '\\mathbf{#1}',
    isImplicitArg: true,
    argsMapping: constantMapping()
  },
  conversion: {
    args: 1,
    def: '\\mathbf{#1}',
    isImplicitArg: true,
    argsMapping: conversionMapping()
  },

  quotient: { //÷R
    def: '\\textrm{÷R}'
  },
  mixfraction: {
    args: 3,
    def: '{#1}\\frac{#2}{#3}',
    isImplicitArg: true,
  },
  degree: {
    def: '^{\\circ}',
    isImplicitArg: true
  },
  minute: {
    def: '\\,{}^\\prime\\;',
    isImplicitArg: true,
  },
  second: {
    def: '\\,\\doubleprime\\;',
    isImplicitArg: true,
  },
  termseparator: {
    def: '\\textrm{, }',
    isImplicitArg: true,
  },
  implicitmul: { //implicitMultiplication
    def: '',
    isImplicitArg: true,
  },
  decimalsep: {
    def: '.',
    isImplicitArg: true
  },
  thousandSep: {
    def: '\\:',
    isImplicitArg: true
  },
  thousandthSep: {
    def: '\\:',
    isImplicitArg: true
  }
}

function variableMapping() {
  return {
    'randreal': '\\mathbf{Rand#}'
  }
}

function constantMapping() {
  let mapping = {}
  ScientificConstantsData.forEach(c => {
    mapping[c.code] = c.symbol
  })
  return mapping
}

function conversionMapping() {
  let mapping = {}
  MetricConversionsData.forEach(c => {
    mapping[c.code] = c.symbol.replace('►', '→')
  })
  return mapping
}
