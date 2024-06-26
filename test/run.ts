/* eslint-disable no-console */
import fs, { readFile, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import prettier from 'prettier'
import * as tactPlugin from '../src/index'

export function run(dirname: string) {
  describe(dirname, () => {
    const contracts = fs.readdirSync(dirname)
      .filter((filename) => {
        const filepath = `${dirname}/${filename}`

        return (
          path.extname(filename) === '.tact'
          && fs.lstatSync(filepath).isFile()
          && filename[0] !== '.'
        )
      })

    contracts.forEach((filename) => {
      it(filename, async () => {
        const filepath = `${dirname}/${filename}`
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

        expect(result).toMatchFileSnapshot(getSnapshotPath(dirname, filename))
      })
    })
  })
}

function getSnapshotPath(dirname: string, filename: string) {
  const snapshotPath = path.join(dirname, '__snapshots__', `${filename}.snap`)

  return snapshotPath
}
