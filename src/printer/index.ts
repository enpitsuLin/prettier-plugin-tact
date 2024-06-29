import type { Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { doesCommentBelongToNode, filterTrusty, formatComment, formatField, validatePrint } from './utils'
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
    case 'storage_variable':
      return [
        path.call(print, 'namedChildren', 0),
        ': ',
        path.call(print, 'namedChildren', 1),
        path.call(print, 'namedChildren', 2),
        ';',
      ]
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

    case 'storage_function':
    case 'global_function':
      if (node.namedChildren.some(n => n.type === 'function_attributes')) {
        return group([
          path.call(print, 'namedChildren', 0),
          ' fun ',
          // function identity
          path.call(print, 'namedChildren', 1),
          path.call(print, 'namedChildren', 2),
          node.namedChild(3)?.type === 'type_identifier'
            ? join(' ', [
              ':',
              path.call(print, 'namedChildren', 3),
              path.call(print, 'namedChildren', 4),
            ])
            : path.call(print, 'namedChildren', 3),

          ...node.nextNamedSibling
          && !doesCommentBelongToNode(node.nextNamedSibling)
            ? [hardline]
            : [],
        ])
      }

      return group([
        'fun ',
        // function identity
        path.call(print, 'namedChildren', 0),
        path.call(print, 'namedChildren', 1),
        node.namedChild(2)?.type === 'type_identifier'
          ? join(' ', [
            ':',
            path.call(print, 'namedChildren', 2),
            path.call(print, 'namedChildren', 3),
          ])
          : path.call(print, 'namedChildren', 2),

        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
    case 'native_function':
      if (node.namedChildren.some(n => n.type === 'function_attributes')) {
        return group([
          group([
            '@name(',
            path.call(print, 'namedChildren', 0),
            ')',
            hardline,
          ]),
          path.call(print, 'namedChildren', 1),
          ' native ',
          // function identity
          path.call(print, 'namedChildren', 2),
          path.call(print, 'namedChildren', 3),
          ...node.namedChild(4)
            ? [': ', path.call(print, 'namedChildren', 4)]
            : [],
          ';',

          ...node.nextNamedSibling
          && !doesCommentBelongToNode(node.nextNamedSibling)
            ? [hardline]
            : [],
        ])
      }

      return group([
        group([
          '@name(',
          path.call(print, 'namedChildren', 0),
          ')',
          hardline,
        ]),
        'native ',
        // function identity
        path.call(print, 'namedChildren', 1),
        path.call(print, 'namedChildren', 2),
        ...node.namedChild(3)
          ? [': ', path.call(print, 'namedChildren', 3)]
          : [],
        ';',

        ...node.nextNamedSibling
        && !doesCommentBelongToNode(node.nextNamedSibling)
          ? [hardline]
          : [],
      ])
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
      return ['return ', path.map(print, 'children'), ';']
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
    case 'block_statement':
      // console.log(node, node.namedChildren)
      return group([
        ' {',
        indent([hardline, path.map(print, 'namedChildren')]),
        hardline,
        '}',
      ])
    case 'expression_statement':
      return [node.text, ';']
    case 'binary_expression':
      // maybe not to use node.text
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
    default:
    // console.log(node)
  }

  return ''
}

export const printer: Printer<SyntaxNode> = {
  print: withNullNodeHandler(withPreservedEmptyLines(withNodesSeparator(printTact))),
}