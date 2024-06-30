import { toNano } from '@ton/core'
import type { NetworkProvider } from '@ton/blueprint'
import { Counter } from '../wrappers/Counter'

export async function run(provider: NetworkProvider) {
  const counter = provider.open(await Counter.fromInit(BigInt(Math.floor(Math.random() * 10000))))

  await counter.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    },
  )

  await provider.waitForDeploy(counter.address)

  console.log('ID', await counter.getId())
}
