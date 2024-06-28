import type { AstPath, Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { formatComment, formatField } from './utils'
import { withNodesSeparator, withNullNodeHandler, withPreservedEmptyLines } from './wrapper'

const { hardline, join, indent, group } = doc.builders

let nextNodeShouldBeIgnored = false

const printTact: Printer<SyntaxNode>['print'] = (path, _options, print) => {
  const node = path.node

  if (node.hasError) {
    throw new Error('Document has syntax error')
  }

  if (nextNodeShouldBeIgnored) {
    nextNodeShouldBeIgnored = false
    return node.text
  }

  switch (node.type) {
    case 'source_file':
      return path.map(print, 'namedChildren')
    case 'import':
      return group([
        'import ',
        path.call(print, 'namedChildren', 0),
        ';',
      ])
    case 'contract': {
      const hasTrait = node.namedChild(1)?.type === 'trait_list'

      return group([
        'contract ',
        join(' ', [
          join(' ', [
            // contract identifier
            path.call(print, 'namedChildren', 0),
            // maybe trait_list
            hasTrait ? path.call(print, 'namedChildren', 1) : '',
          ]),
          // contract_body
          path.call(validatePrint(print), 'lastNamedChild'),
        ]),
      ])
    }
    case 'trait_list':
      return group([
        'with ',
        join(', ', path.map(print, 'namedChildren')),
      ])
    case 'contract_body':
      return node.text
    case 'message': {
      const isOverwritesUniqueId = node.children
        .some((node: SyntaxNode) => node.type === 'message_value')
      if (isOverwritesUniqueId) {
        return group([
          'message',
          path.call(print, 'namedChildren', 0),
          ' ',
          path.call(print, 'namedChildren', 1),
          ' {',
          indent([hardline, path.call(print, 'namedChildren', 2)]),
          hardline,
          '}',
        ])
      }
      return group([
        'message ',
        path.call(print, 'namedChildren', 0),
        ' {',
        indent([hardline, path.call(print, 'namedChildren', 1)]),
        hardline,
        '}',
      ])
    }
    case 'message_value':
      return node.text
    case 'message_body':
      if (node.namedChildCount === 0)
        return node.text
      return path.map(print, 'namedChildren')
    case 'struct':
      return group([
        'struct ',
        path.call(print, 'namedChildren', 0),
        ' {',
        indent([hardline, path.call(print, 'namedChildren', 1)]),
        hardline,
        '}',
      ])
    case 'struct_body':

      if (node.namedChildCount === 0)
        return node.text
      return path.map(print, 'namedChildren')
    case 'field':

      return formatField(path, print)
    case 'identifier':
    case 'type_identifier':
      return node.text
    case 'tlb_serialization':
      return [' as ', path.map(print, 'namedChildren')]
    case 'comment':
      return formatComment(path)
    case 'string':
      return node.text
    default:
    // console.log(node)
  }

  return ''
}

function validatePrint(print: (path: AstPath<SyntaxNode>) => doc.builders.Doc) {
  return (path: AstPath<SyntaxNode | null>) => {
    if (path.node !== null)
      return print(path as AstPath<SyntaxNode>)
    return ''
  }
}

export const printer: Printer<SyntaxNode> = {
  print: withNullNodeHandler(withPreservedEmptyLines(withNodesSeparator(printTact))),
}
