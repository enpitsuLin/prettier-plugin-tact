import type { AstPath, Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'

const { hardline, join, indent, dedent, group } = doc.builders

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
      return path.map(print, 'children')
    case 'import':
      return [
        'import ',
        path.call(print, 'children', 1),
        path.call(print, 'children', 2),
        hardline,
        // next node isn't import wrap line
        node.nextSibling?.type !== 'import' ? hardline : '',
      ]
    case 'contract':
      if (node.childCount > 0)
        return join(' ', path.map(print, 'children'))
      return node.text
    case 'contract_body':

      return indent([
        join(
          hardline,
          Array.from(
            { length: node.childCount - 1 },
            (_, i) => (path.call(print, 'children', i)
            ),
          ),
        ),
        dedent(path.call(validatePrint(print), 'lastChild')),
      ])
    case 'storage_variable':
      // console.log(node.children.map((item, i) => ({ item, i })));
      return [node.text, hardline]
    case 'storage_function':
      return [
        join(' ', [
          // function_attributes
          path.call(print, 'children', 0),
          // `fun` keyword
          path.call(print, 'children', 1),
          // function name identifier
          path.call(print, 'children', 2),
        ]),
        // parameter_list
        path.call(print, 'children', 3),
        path.call(print, 'children', 4), // this is `:`
        // function return type
        path.call(print, 'children', 5),
        ' ',
        // function body
        path.call(print, 'children', 6),
      ]
    case 'init_function':
      return join(' ', [
        // init keyword
        [
          path.call(print, 'children', 0),
          // parameter_list
          path.call(print, 'children', 1),
        ],
        // function_body
        path.call(print, 'children', 2),
      ])
    case 'receive_function':
      return join(' ', [
        [
          'receive',
          // (
          path.call(print, 'children', 1),
          // string or parameter
          path.call(print, 'children', 2),
          // )
          path.call(print, 'children', 3),
        ],
        // function_body
        path.call(print, 'children', 4),
      ])
    case 'function_attributes':
      return join(' ', path.map(print, 'children'))
    case 'parameter_list':
      return node.text
    case 'type_identifier':
      return [' ', node.text]
    case 'function_body':
      return [
        indent([
          '{',
          hardline,
          path.call(print, 'namedChildren', 0),
          path.call(print, 'namedChildren', 1),
          dedent(
            path.call(validatePrint(print), 'lastChild'),
          ),
          hardline,
        ]),
      ]
    case 'message':
    {
      const isOverwritesUniqueId = node.children
        .some((node: SyntaxNode) => node.type === 'message_value')
      return [
        // if first node is message dont wrap line
        node.previousSibling ? hardline : '',
        group([
          'message',
          join(' ', [
            isOverwritesUniqueId
              ? [path.call(print, 'children', 1), path.call(print, 'children', 2)]
              : path.call(print, 'children', 1),
            path.call(validatePrint(print), 'lastChild'),
          ]),
        ]),
        hardline,
      ]
    }
    case 'message_body':
      return [
        indent([
          path.call(validatePrint(print), 'firstChild'),
          join(
            hardline
            , Array.from(
              { length: (node.childCount - 2) / 2 },
              (_, i) => [
                path.call(print, 'children', (i * 2) + 1),
                path.call(print, 'children', (i * 2) + 2),
              ],
            ),
          ),
        ]),
        path.call(validatePrint(print), 'lastChild'),
        hardline,
      ]
    case 'field':
      return node.text
    case '{':
      return [node.text, hardline]
    case '}':
      return [hardline, node.text]
    case 'return_statement':
    case 'assignment_statement':
      return [
        node.text,
        ';',
      ]
    case ';':
    case ':':
    case '(':
    case ')':
    case 'string':
    case 'comment':
    case 'init':
    case 'identifier':
    case 'override':
    case 'get':
    case 'fun':
      return node.text
    default:

      // console.log(node, node.text)
      return node.text
  }
}

function validatePrint(print: (path: AstPath<SyntaxNode>) => doc.builders.Doc) {
  return (path: AstPath<SyntaxNode | null>) => {
    if (path.node !== null)
      return print(path as AstPath<SyntaxNode>)
    return ''
  }
}

export const printer: Printer<SyntaxNode> = {
  print: printTact,
}
