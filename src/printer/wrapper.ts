import type { AstPath, Printer } from 'prettier'
import { doc } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'

// These node should separated with newline
export const separatedNodes = new Set([
  'if_statement',
])

const { hardline } = doc.builders

/**
 * Adds an empty line before and after some statements
 */
export function withNodesSeparator(
  printFn: Printer<SyntaxNode>['print'],
): Printer<SyntaxNode>['print'] {
  return function (path, options, print) {
    const node = path.node

    const result = printFn(path, options, print)

    const shouldPrependNewline
      = node.previousNamedSibling
      && (node.previousNamedSibling.type !== 'comment'
      || doesCommentBelongToNode(node.previousNamedSibling))

    const shouldAppendNewline
      = node.nextNamedSibling
      && !separatedNodes.has(node.nextNamedSibling.type)
      && !doesCommentBelongToNode(node.nextNamedSibling)

    if (separatedNodes.has(node.type)) {
      return [
        shouldPrependNewline ? hardline : '',
        result,
        shouldAppendNewline ? hardline : '',
      ]
    }

    return result
  }
}

/**
 * Preserves existing empty lines in original source code.
 * Multiple empty lines get replaced with a single one.
 */
export function withPreservedEmptyLines(
  printFn: Printer<SyntaxNode>['print'],
): Printer<SyntaxNode>['print'] {
  const nodeTypesToExclude = new Set<string>([])

  return function (path, options, print) {
    const node = path.node
    const result = printFn(path, options, print)

    if (nodeTypesToExclude.has(node.type))
      return result

    if (
      !separatedNodes.has(node.type)
      && node.previousNamedSibling
      && !separatedNodes.has(node.previousNamedSibling.type)
    ) {
      const currentLine = node.startPosition.row
      const previousLine = node.previousNamedSibling.endPosition.row

      if (currentLine - previousLine > 1) {
        return [hardline, result]
      }
    }

    return result
  }
}

/** This printer wrapper must be the outer one */
export function withNullNodeHandler(
  printFn: Printer<SyntaxNode>['print'],
): Printer<SyntaxNode>['print'] {
  return function (path, options, print) {
    const node = path.node

    if (node === null)
      return ''

    const result = printFn(path as AstPath<SyntaxNode>, options, print)
    return result
  }
}

function doesCommentBelongToNode(node: SyntaxNode): boolean {
  if (!node.previousNamedSibling || node.type !== 'comment')
    return false

  return (
    node.previousNamedSibling.startPosition.row <= node.startPosition.row
    && node.previousNamedSibling.endPosition.row >= node.startPosition.row
  )
}
