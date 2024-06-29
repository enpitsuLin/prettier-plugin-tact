import type { AstPath } from 'prettier'
import type { SyntaxNode } from 'tree-sitter'
import { doc } from 'prettier'
import { bodyComment, ownlineCommentNode } from './contants'

const { hardline, group } = doc.builders

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

/**
 * format (abstract)storage function/global function/native function
 */
export function formatFunction(path: AstPath<SyntaxNode>, print: (path: AstPath<SyntaxNode>) => doc.builders.Doc) {
  const node = path.node
  const isNativeFunction = node.type === 'native_function'

  const hasFunAttributes = node.namedChildren.some(n => n.type === 'function_attributes')

  if (!isNativeFunction) {
    const hasReturnType = node.namedChild(hasFunAttributes ? 3 : 2)?.type === 'type_identifier'
    const hasFunBody = node.namedChildren.some(n => n.type === 'function_body')

    const attributes = hasFunAttributes ? [path.call(print, 'namedChildren', 0)] : []
    const identity = path.call(print, 'namedChildren', hasFunAttributes ? 1 : 0)
    const parameterList = path.call(print, 'namedChildren', hasFunAttributes ? 2 : 1)
    const returnType = path.call(print, 'namedChildren', hasFunAttributes ? 3 : 2)
    const body = path.call(print, 'namedChildren', hasFunAttributes ? hasReturnType ? 4 : 3 : hasReturnType ? 3 : 2)
    return group([
      hasFunAttributes ? [attributes, ' '] : [],
      'fun ',
      identity,
      parameterList,
      ...hasReturnType ? [': ', returnType] : [],
      hasFunBody ? [' ', body] : ';',
      ...node.nextNamedSibling
      && !doesCommentBelongToNode(node.nextNamedSibling)
        ? [hardline]
        : [],
    ])
  }
  const hasReturnType = node.namedChild(hasFunAttributes ? 4 : 3)?.type === 'type_identifier'

  const func_identifier = path.call(print, 'namedChildren', 0)
  const attributes = hasFunAttributes ? [path.call(print, 'namedChildren', 1)] : []
  const identity = path.call(print, 'namedChildren', hasFunAttributes ? 2 : 1)
  const parameterList = path.call(print, 'namedChildren', hasFunAttributes ? 3 : 2)
  const returnType = path.call(print, 'namedChildren', hasFunAttributes ? 4 : 3)

  return group([
    [`@name(`, func_identifier, ')', hardline],
    hasFunAttributes ? [attributes, ' '] : [],
    'native ',
    identity,
    parameterList,
    ...hasReturnType ? [': ', returnType] : [],
    ';',
    ...node.nextNamedSibling
    && !doesCommentBelongToNode(node.nextNamedSibling)
      ? [hardline]
      : [],
  ])
}

export function formatContract(path: AstPath<SyntaxNode>, print: (path: AstPath<SyntaxNode>) => doc.builders.Doc) {
  const node = path.node

  const attributesIndex = node.namedChildren.findIndex(n => ['trait_attributes', 'contract_attributes'].includes(n.type))
  const traitIndex = node.namedChildren.findIndex(n => n.type === 'trait_list')
  const identityIndex = node.namedChildren.findIndex(n => n.type === 'identifier')

  return group([
    attributesIndex !== -1 ? [path.call(print, 'namedChildren', attributesIndex)] : [],
    'contract ',
    identityIndex !== -1 ? [path.call(print, 'namedChildren', identityIndex), ' '] : [],
    traitIndex !== -1 ? [path.call(print, 'namedChildren', traitIndex), ' '] : [],
    // contract_body
    path.call(validatePrint(print), 'lastNamedChild'),
    ...node.nextNamedSibling
    && !doesCommentBelongToNode(node.nextNamedSibling)
      ? [hardline]
      : [],

  ])
}

export function doesNodesInSameRow(...nodes: SyntaxNode[]): boolean {
  let row: number | null = null
  return nodes.some(({ startPosition }) => {
    if (row && startPosition.row === row)
      return true
    row = startPosition.row
    return false
  })
}

export function doesCommentBelongToNode(node: SyntaxNode): boolean {
  if (!node.previousNamedSibling || !bodyComment.has(node.type))
    return false

  return (
    node.previousNamedSibling.startPosition.row <= node.startPosition.row
    && node.previousNamedSibling.endPosition.row >= node.startPosition.row
  )
}

export function doesCommentOwnline(node: SyntaxNode): boolean {
  if (!bodyComment.has(node.type))
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
