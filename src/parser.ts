import Parser from 'tree-sitter'
import Tact from 'tree-sitter-tact'

export const parser = new Parser()
parser.setLanguage(Tact)
