import type { AstPath } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { doc } from 'prettier'
import { bodyComment, ownlineCommentNode } from './contants'

const { hardline, group } = doc.builders

export function filterTrusty<T>(item: false | T | undefined | null): item is NonNullable<T> {
  return Boolean(item)
}

export function handleFieldTrailing(path: AstPath<SyntaxNode>): doc.builders.Doc {
  const node = path.node
  if (!node.nextNamedSibling || bodyComment.has(node.nextNamedSibling.type))
    return ' '
  if (node.nextNamedSibling.type === 'comment' && doesCommentBelongToNode(node.nextNamedSibling))
    return [' ']
  return hardline
}

export function formatComment(path: AstPath<SyntaxNode>): doc.builders.Doc {
  const node = path.node
  if (node.nextNamedSibling?.type && ownlineCommentNode.has(node.nextNamedSibling?.type) && node.startPosition.column !== 0) {
    return [' ', node.text, hardline]
  }
  if ((doesCommentBelongToNode(node) && node.nextNamedSibling) || doesCommentOwnline(node)) {
    if (node.nextSibling?.type && ['}', ']', ')'].includes(node.nextSibling?.type))
      return node.text
    return [node.text, hardline]
  }
  return node.text
}

export function formatField(path: AstPath<SyntaxNode>, print: (path: AstPath<SyntaxNode>) => doc.builders.Doc): doc.builders.Doc {
  const node = path.node
  const hasAs = node.namedChildren.some(n => n.type === 'tlb_serialization')
  const hasDefaultValue = node.namedChildren.length > 2 && !hasAs
  const isOptional = node.children.some(n => n.type === '?')
  if (hasDefaultValue) {
    return group([
      path.call(print, 'namedChildren', 0),
      ': ',
      path.call(print, 'namedChildren', 1),
      `${isOptional ? '?' : ''} = `,
      path.call(print, 'namedChildren', 2),
      ';',
      handleFieldTrailing(path),
    ])
  }
  return group([
    path.call(print, 'namedChildren', 0),
    ': ',
    path.call(print, 'namedChildren', 1),
    `${isOptional ? '?' : ''}`,
    path.call(print, 'namedChildren', 2),
    ';',
    handleFieldTrailing(path),
  ])
}

export function doesCommentBelongToNode(node: SyntaxNode): boolean {
  if (!node.previousNamedSibling || node.type !== 'comment')
    return false

  return (
    node.previousNamedSibling.startPosition.row <= node.startPosition.row
    && node.previousNamedSibling.endPosition.row >= node.startPosition.row
  )
}

export function doesCommentOwnline(node: SyntaxNode): boolean {
  if (node.type !== 'comment')
    return false
  if (!node.previousNamedSibling || !node.nextNamedSibling)
    return true

  return (
    node.previousNamedSibling.startPosition.row <= node.startPosition.row
    && node.previousNamedSibling.endPosition.row <= node.startPosition.row
    && node.nextNamedSibling.startPosition.row >= node.startPosition.row
    && node.nextNamedSibling.endPosition.row >= node.startPosition.row
  )
}

export function validatePrint(print: (path: AstPath<SyntaxNode>) => doc.builders.Doc) {
  return (path: AstPath<SyntaxNode | null>) => {
    if (path.node !== null)
      return print(path as AstPath<SyntaxNode>)
    return ''
  }
}
