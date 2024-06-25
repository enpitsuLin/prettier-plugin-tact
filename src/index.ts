import type { Options, Parser, Printer, SupportLanguage } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { parser } from './parser'
import { printer } from './printer'

export const languages: SupportLanguage[] = [
  {
    name: 'TACT',
    extensions: ['.tact'],
    parsers: ['tact-parser'],
  },
]

export const parsers: Record<string, Parser> = {
  'tact-parser': {
    parse: (text: string): SyntaxNode => parser.parse(text).rootNode,
    astFormat: 'tact-format',
    locStart: () => -1,
    locEnd: () => -1,
  },
}

export const printers: Record<string, Printer<SyntaxNode>> = {
  'tact-format': printer,
}

export const defaultOptions: Options = {
  tabWidth: 4,
}
