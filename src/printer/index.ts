import type { Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { doesCommentBelongToNode, doesNodesInSameRow, formatComment, formatContract, formatField, formatFunction } from './utils'
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
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'trait':
    case 'contract':
      return formatContract(path, print)
    case 'trait_attributes':
    case 'contract_attributes':
      return group([
        '@interface(',
        path.call(print, 'namedChildren', 0),
        ')',
        hardline,
      ])
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
    case 'global_constant':
    case 'storage_variable':
    case 'storage_constant': {
      if (node.namedChildren.some(n => n.type === 'tlb_serialization')) {
        return [
          ...['storage_constant', 'global_constant'].includes(node.type) ? ['const '] : [],
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
        ...['storage_constant', 'global_constant'].includes(node.type) ? ['const '] : [],
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
    case 'bounced_function':
      return group([
        node.type === 'receive_function' ? 'receive(' : 'bounced(',
        ...node.namedChild(0)?.type !== 'function_body' ? [path.call(print, 'namedChildren', 0)] : [],
        ') ',
        path.call(print, 'namedChildren', node.namedChild(1)?.type === 'function_body' ? 1 : 0),
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
    case 'bounced_type':
      return group([
        'bounced<',
        path.call(print, 'namedChildren', 0),
        '>',
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
    case 'return_statement':
      return ['return ', path.map(print, 'namedChildren'), ';']
    case 'field_access_expression':
      return group([
        path.call(print, 'namedChildren', 0),
        '.',
        path.call(print, 'namedChildren', 1),
      ])
    case 'parenthesized_expression':
      return ['(', path.map(print, 'namedChildren'), ')']
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
          ...node.nextNamedSibling
          && !doesCommentBelongToNode(node.nextNamedSibling)
            ? [hardline]
            : [],
        ])
      }
      return group([
        'message ',
        path.call(print, 'namedChildren', 0),
        ' {',
        indent([hardline, path.call(print, 'namedChildren', 1)]),
        hardline,
        '}',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    }
    case 'message_value':
      return group([
        '(',
        path.call(print, 'namedChildren', 0),
        ')',
      ])
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
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
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
              ' else',
              path.call(print, 'namedChildren', 2),
            ]
          : [],
      ])
    case 'else_clause':
      return group([
        ...node.namedChild(0)?.type === 'if_statement' ? [' '] : [],
        path.call(print, 'namedChildren', 0),
      ])
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
    case 'let_statement': {
      const isOptional = node.children.find(n => n.type === 'type_identifier')?.nextSibling?.type === '?'
      return group([
        'let ',
        // identifier
        path.call(print, 'namedChildren', 0),
        ': ',
        path.call(print, 'namedChildren', 1),
        isOptional ? '?' : '',
        ' = ',
        path.call(print, 'namedChildren', 2),
        ';',
        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [' '],
      ])
    }
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
    case 'tlb_serialization':
      return [' as ', path.map(print, 'namedChildren')]
    case 'comment':
      return formatComment(path)
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
    case 'instance_expression':

      return group([
        path.call(print, 'namedChildren', 0),
        ' ',
        path.call(print, 'namedChildren', 1),
      ])
    case 'instance_argument_list':
      return group([
        '{',
        indent([
          node.startPosition.row === node.endPosition.row ? ' ' : hardline,
          join(node.startPosition.row === node.endPosition.row ? ' ' : hardline, path.map(print, 'namedChildren')),
        ]),
        node.startPosition.row === node.endPosition.row ? ' ' : hardline,
        '}',
      ])
    case 'instance_argument':
      return [node.text, ',']
    case 'initOf':
      return group([
        'initOf ',
        path.call(print, 'namedChildren', 0),
        path.call(print, 'namedChildren', 1),
      ])
    case 'non_null_assert_expression':
      return group([
        path.call(print, 'namedChildren', 0),
        '!!',
      ])
    case 'map_type':
      return group([
        'map<',
        path.call(print, 'namedChildren', 0),
        ', ',
        path.call(print, 'namedChildren', 1),
        '>',
      ])
    case 'unary_expression':
      return group([
        node.text.at(0)!,
        path.call(print, 'namedChildren', 0),
      ])
    case 'method_call_expression':
    case 'binary_expression':
      // maybe not to use node.text for method_call_experssion and binary_expression
      return node.text
    case 'ternary_expression':
      return group([
        path.call(print, 'namedChildren', 0),
        ' ? ',
        path.call(print, 'namedChildren', 1),
        ' : ',
        path.call(print, 'namedChildren', 2),
      ])
    case 'identifier':
    case 'type_identifier':
    case 'self':
    case 'string':
    case 'boolean':
    case 'integer':
    case 'null':
    case 'lvalue':
      return node.text
    default:
      // console.log(node, node.text)
      // console.table(node.namedChildren.map(({ type, text }) => ({ type, text })))
      return ''
  }
}

export const printer: Printer<SyntaxNode> = {
  print: withNullNodeHandler(withPreservedEmptyLines(withNodesSeparator(printTact))),
}
