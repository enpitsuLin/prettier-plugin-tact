/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import prettier from 'prettier'
import * as tactPlugin from '../../src/index'

describe(import.meta.dirname, () => {
  const contracts = fs.readdirSync(import.meta.dirname)
    .filter((filename) => {
      const filepath = `${import.meta.dirname}/${filename}`

      return (
        path.extname(filename) === '.tact'
        && fs.lstatSync(filepath).isFile()
        && filename[0] !== '.'
      )
    })

  contracts.forEach((filename) => {
    it(filename, async () => {
      const filepath = `${import.meta.dirname}/${filename}`
      const code = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n')

      const result = await prettier.format(
        code,
        {
          plugins: [
            tactPlugin,
          ],
          printWidth: 80,
          filepath,
        },
      )

      console.log('code:')
      console.log(code)
      console.log('result:')
      console.log(result)

      expect(result)
    })
  })
})
