import { createHash } from 'node:crypto'
import ts from 'typescript'

export interface ResolvedAnchor {
  line: number
  value: string
  hash: string
}

const VALUE_MAX = 160

export function hashText(text: string): string {
  return createHash('sha256').update(normalizeWhitespace(text)).digest('hex').slice(0, 12)
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function clip(text: string): string {
  const flat = normalizeWhitespace(text)
  return flat.length > VALUE_MAX ? `${flat.slice(0, VALUE_MAX - 1)}…` : flat
}

function nameOf(node: ts.Node): string | null {
  const named = node as { name?: ts.Node }
  if (!named.name) return null
  if (ts.isIdentifier(named.name) || ts.isStringLiteral(named.name) || ts.isPrivateIdentifier(named.name)) {
    return named.name.text
  }
  return null
}

/** Top-level declarations, including each `const` inside a variable statement. */
function findTopLevel(source: ts.SourceFile, name: string): ts.Node | null {
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (nameOf(declaration) === name) return declaration
      }
      continue
    }
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      nameOf(statement) === name
    ) {
      return statement
    }
  }
  return null
}

/** Depth-first search for a named property, method, or member below `root`. */
function findMember(root: ts.Node, name: string): ts.Node | null {
  let found: ts.Node | null = null
  const visit = (node: ts.Node) => {
    if (found) return
    if (
      node !== root &&
      (ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isPropertySignature(node)) &&
      nameOf(node) === name
    ) {
      found = node
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function describeValue(node: ts.Node, source: ts.SourceFile): string {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    const params = node.parameters.map((param) => param.name.getText(source)).join(', ')
    return clip(`${nameOf(node) ?? 'function'}(${params})`)
  }
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const init = node.initializer
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
      const params = init.parameters.map((param) => param.name.getText(source)).join(', ')
      return clip(`${nameOf(node)}(${params})`)
    }
    return clip(init.getText(source))
  }
  if (ts.isPropertyAssignment(node)) return clip(node.initializer.getText(source))
  if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
    return clip(`type ${nameOf(node)}`)
  }
  return clip(node.getText(source))
}

/**
 * Resolve `symbol` in a TypeScript source file.
 * `A.b.c` finds the top-level declaration `A`, then the first member named `b`
 * below it, then `c` below that.
 */
export function resolveTsAnchor(fileName: string, text: string, symbol: string): ResolvedAnchor | null {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind(fileName))
  const [head, ...rest] = symbol.split('.')
  let node = findTopLevel(source, head)
  for (const part of rest) {
    if (!node) return null
    node = findMember(node, part)
  }
  if (!node) return null
  const start = node.getStart(source)
  return {
    line: source.getLineAndCharacterOfPosition(start).line + 1,
    value: describeValue(node, source),
    hash: hashText(node.getText(source)),
  }
}

function scriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) return ts.ScriptKind.JS
  return ts.ScriptKind.TS
}

/**
 * Resolve a Markdown heading. `symbol` is matched against heading text,
 * case-insensitive. The hash covers the section up to the next heading of the
 * same or higher level.
 */
export function resolveMarkdownAnchor(text: string, symbol: string): ResolvedAnchor | null {
  const lines = text.split('\n')
  const wanted = symbol.trim().toLowerCase()
  let startIndex = -1
  let level = 0
  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.*)$/.exec(lines[i])
    if (match && match[2].trim().toLowerCase().includes(wanted)) {
      startIndex = i
      level = match[1].length
      break
    }
  }
  if (startIndex === -1) return null
  let endIndex = lines.length
  for (let i = startIndex + 1; i < lines.length; i++) {
    const match = /^(#{1,6})\s+/.exec(lines[i])
    if (match && match[1].length <= level) {
      endIndex = i
      break
    }
  }
  const section = lines.slice(startIndex, endIndex).join('\n')
  const firstBody = lines
    .slice(startIndex + 1, endIndex)
    .map((line) => line.replace(/^[>*\-\s]+/, '').replace(/\*\*/g, '').trim())
    .find((line) => line.length > 0 && !line.startsWith('|') && !line.startsWith('#'))
  return {
    line: startIndex + 1,
    value: clip(firstBody ?? lines[startIndex].replace(/^#+\s*/, '')),
    hash: hashText(section),
  }
}

/**
 * Resolve a plain-text anchor (YAML, JSON, SQL): the first line containing
 * `symbol`. The whole file is hashed, since there is no structure to scope to.
 */
export function resolveTextAnchor(text: string, symbol: string): ResolvedAnchor | null {
  const lines = text.split('\n')
  const index = lines.findIndex((line) => line.includes(symbol))
  if (index === -1) return null
  return { line: index + 1, value: clip(lines[index]), hash: hashText(text) }
}

const TS_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']

export function resolveAnchor(fileName: string, text: string, symbol: string): ResolvedAnchor | null {
  if (fileName.endsWith('.md')) return resolveMarkdownAnchor(text, symbol)
  if (TS_EXTENSIONS.some((ext) => fileName.endsWith(ext))) return resolveTsAnchor(fileName, text, symbol)
  return resolveTextAnchor(text, symbol)
}

export function anchorKey(ruleId: string, file: string, symbol: string): string {
  return `${ruleId}::${file}#${symbol}`
}
