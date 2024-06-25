import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'tree-sitter-tact': resolve(__dirname, 'node_modules', 'tree-sitter-tact', 'bindings', 'node', 'index.js'),
    },
  },
  test: {
  },
})
