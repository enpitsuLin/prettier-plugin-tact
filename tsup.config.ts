import { defineConfig } from 'tsup'

export default defineConfig([
  {
    clean: true,
    dts: true,
    outDir: 'lib',
    treeshake: true,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    external: ['prettier'],
  },
])
