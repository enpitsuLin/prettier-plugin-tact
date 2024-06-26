import type { AstPath, Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'

const { hardline, join, indent, dedent, line, group } = doc.builders

let nextNodeShouldBeIgnored = false

const printTact: Printer<SyntaxNode>['print'] = (path, options, print) => {
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
            (_, i) => i,
          ).map(i => (path.call(print, 'children', i))),
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
        hardline,
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
        ['receive',
          // (
          path.call(print, 'children', 1),
          // string or parameter
          path.call(print, 'children', 2),
          // )
          path.call(print, 'children', 3)],
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
      return group([
        hardline,
        'message',
        join(' ', [
          isOverwritesUniqueId
            ? [path.call(print, 'children', 1), path.call(print, 'children', 2)]
            : path.call(print, 'children', 1),
          path.call(validatePrint(print), 'lastChild'),
        ]),
        hardline,
      ])
    }
    case '{':
      return [node.text, line]
    case '}':
      return [line, node.text]
    case 'return_statement':
      return [
        node.text,
        ';',
      ]
    case 'init':
    case 'comment':
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
