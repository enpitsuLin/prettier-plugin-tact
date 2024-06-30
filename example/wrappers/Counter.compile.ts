import type { CompilerConfig } from '@ton/blueprint'

export const compile: CompilerConfig = {
  lang: 'tact',
  target: 'contracts/Counter.tact',
  options: {
    debug: true,
  },
}
