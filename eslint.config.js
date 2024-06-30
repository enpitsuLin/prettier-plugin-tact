import { antfu } from '@antfu/eslint-config'

export default antfu(
  {
    ignores: ['**/build/*'],
  },
  {
    files: ['example/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
)
