import type { Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { doesCommentBelongToNode, doesNodesInSameRow, formatComment, formatField, formatFunction, validatePrint } from './utils'
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
        ...node.nextNamedSibling?.type !== 'import' ? [hardline] : [],
      ])
    case 'trait':
    case 'contract': {
      const hasTrait = node.namedChild(1)?.type === 'trait_list'

      return group([
        'contract ',
        join(' ', [
          hasTrait
            ? join(' ', [
              // contract identifier
              path.call(print, 'namedChildren', 0),
              // maybe trait_list
              path.call(print, 'namedChildren', 1),
            ])
            : path.call(print, 'namedChildren', 0),
          // contract_body
          path.call(validatePrint(print), 'lastNamedChild'),

          ...node.nextNamedSibling
          && !doesCommentBelongToNode(node.nextNamedSibling)
            ? [hardline]
            : [],
        ]),
      ])
    }
    case 'trait_list':
      return group([
        'with ',
        join(', ', path.map(print, 'namedChildren')),
      ])
    case 'trait_body':
    case 'contract_body':
      return [
        '{',
        indent([hardline, path.map(print, 'namedChildren')]),
        hardline,
        '}',
      ]
    case 'storage_variable': {
      if (node.namedChildren.some(n => n.type === 'tlb_serialization')) {
        return [
          path.call(print, 'namedChildren', 0),
          ': ',
          path.call(print, 'namedChildren', 1),
          path.call(print, 'namedChildren', 2),
          ...node.namedChild(3)
            ? [' = ', path.call(print, 'namedChildren', 3)]
            : [],
          ';',
          ...node.nextNamedSibling
          && !doesCommentBelongToNode(node.nextNamedSibling)
            ? [hardline]
            : [],
        ]
      }

      return [
        path.call(print, 'namedChildren', 0),
        ': ',
        path.call(print, 'namedChildren', 1),
        ...node.namedChild(2)
          ? [' = ', path.call(print, 'namedChildren', 2)]
          : [],
        ';',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ]
    }
    case 'receive_function':
      return group([
        'receive(',
        path.call(print, 'namedChildren', 0),
        ') ',
        path.call(print, 'namedChildren', 1),
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'init_function':
      return group([
        'init',
        join(' ', [
          path.call(print, 'namedChildren', 0),
          path.call(print, 'namedChildren', 1),
        ]),
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'storage_function':
    case 'global_function':
    case 'native_function':
      return formatFunction(path, print)
    case 'func_identifier':
      return node.text
    case 'function_attributes':
      return node.text
    case 'parameter_list':
      return group([
        '(',
        join(', ', path.map(print, 'namedChildren')),
        ')',
      ])
    case 'parameter':
      return group([
        path.call(print, 'namedChildren', 0),
        ': ',
        path.call(print, 'namedChildren', 1),
      ])
    case 'function_body':
      if (node.namedChildCount === 0) {
        if (node.nextNamedSibling)
          return [node.text, hardline]
        return node.text
      }

      return group([
        '{',
        indent([hardline, path.map(print, 'namedChildren')]),
        hardline,
        '}',
      ])
    case 'augmented_assignment_statement':
      return group([
        path.call(print, 'namedChildren', 0),
        ' ',
        node.child(1)!.text,
        ' ',
        path.call(print, 'namedChildren', 1),
        ';',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'assignment_statement':
      return group([
        path.call(print, 'namedChildren', 0),
        ' = ',
        path.call(print, 'namedChildren', 1),
        ';',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'lvalue':
      return node.text
    case 'return_statement':
      return ['return ', path.map(print, 'namedChildren'), ';']
    case 'field_access_expression':
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
    case 'if_statement':
      return group([
        'if (',
        path.call(print, 'namedChildren', 0),
        ')',
        path.call(print, 'namedChildren', 1),
        ...node.namedChildren.some(n => n.type === 'else_clause')
          ? [
              ' else ',
              path.call(print, 'namedChildren', 2),
            ]
          : [],
      ])
    case 'else_clause':
      return path.map(print, 'namedChildren')
    case 'repeat_statement':
      return group([
        'repeat (',
        path.call(print, 'namedChildren', 0),
        ')',
        path.call(print, 'namedChildren', 1),
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'while_statement':
      return group([
        'while (',
        path.call(print, 'namedChildren', 0),
        ')',
        path.call(print, 'namedChildren', 1),
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'do_until_statement':
      return group([
        'do',
        path.call(print, 'namedChildren', 0),
        ' until (',
        path.call(print, 'namedChildren', 1),
        ');',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'foreach_statement':
      return group([
        'foreach (',
        join(', ', [
          path.call(print, 'namedChildren', 0),
          path.call(print, 'namedChildren', 1),
        ]),
        ' in ',
        path.call(print, 'namedChildren', 2),
        ')',
        path.call(print, 'namedChildren', 3),
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'block_statement':
      return group([
        ' {',
        indent([
          ...(node.namedChild(0)
          && doesNodesInSameRow(node.namedChild(0)!, node))
            ? []
            : [hardline],
          path.map(print, 'namedChildren'),
        ]),
        hardline,
        '}',
      ])
    case 'let_statement':
      return group([
        'let ',
        // identifier
        path.call(print, 'namedChildren', 0),
        ': ',
        path.call(print, 'namedChildren', 1),
        ' = ',
        path.call(print, 'namedChildren', 2),
        ';',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [' '],
      ])
    case 'try_statement':
      return group([
        'try',
        path.call(print, 'namedChildren', 0),
        ...node.namedChildCount > 1 ? [path.call(print, 'namedChildren', 1)] : [],
      ])
    case 'catch_clause':
      return [
        ' catch (',
        path.call(print, 'namedChildren', 0),
        ')',
        path.call(print, 'namedChildren', 1),
      ]
    case 'expression_statement':
      return [
        node.text,
        ';',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [' '],
      ]
    case 'method_call_expression':
    case 'binary_expression':
      // maybe not to use node.text for method_call_experssion and binary_expression
      return node.text
    case 'identifier':
    case 'type_identifier':
      return node.text
    case 'tlb_serialization':
      return [' as ', path.map(print, 'namedChildren')]
    case 'comment':
      return formatComment(path)
    case 'string':
    case 'boolean':
    case 'integer':
      return node.text
    case 'static_call_expression':
      return group([
        path.call(print, 'namedChildren', 0),
        path.call(print, 'namedChildren', 1),
      ])
    case 'argument_list':
      return group([
        '(',
        join(', ', path.map(print, 'namedChildren')),
        ')',
      ])
    case 'argument':
      return path.map(print, 'namedChildren')
    default:
    // console.log(node)
  }

  return ''
}

export const printer: Printer<SyntaxNode> = {
  print: withNullNodeHandler(withPreservedEmptyLines(withNodesSeparator(printTact))),
}
