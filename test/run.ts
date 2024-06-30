import fs from 'node:fs'
import path from 'node:path'
import prettier from 'prettier'
import { describe, expect, it } from 'vitest'
import * as tactPlugin from '../src/index'

async function runFormat(filepath: string) {
  const code = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n')

  return prettier.format(
    code,
    {
      plugins: [
        tactPlugin,
      ],
      printWidth: 80,
      filepath,
    },
  )
}

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
        const result = await runFormat(filepath)
        expect(result).toMatchFileSnapshot(getSnapshotPath(dirname, filename))

        expect(() => {
          runFormat(filepath)
        }).not.toThrowError()
      })
    })
  })
}

function getSnapshotPath(dirname: string, filename: string) {
  const snapshotPath = path.join(dirname, '__snapshots__', `${filename}.snap`)

  return snapshotPath
}
