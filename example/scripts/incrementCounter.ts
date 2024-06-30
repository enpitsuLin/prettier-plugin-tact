import { Address, toNano } from '@ton/core'
import type { NetworkProvider } from '@ton/blueprint'
import { sleep } from '@ton/blueprint'
import { Counter } from '../wrappers/Counter'

export async function run(provider: NetworkProvider, args: string[]) {
  const ui = provider.ui()

  const address = Address.parse(args.length > 0 ? args[0] : await ui.input('No address'))

  if (!(await provider.isContractDeployed(address))) {
    ui.write(`Error: Contract at address ${address} is not deployed!`)
    return
  }

  const counter = provider.open(Counter.fromAddress(address))

  const counterBefore = await counter.getCounter()

  await counter.send(
    provider.sender(),
    {
      value: toNano('0.05'),
    },
    {
      $$type: 'Add',
      queryId: 0n,
      amount: 1n,
    },
  )

  ui.write('Waiting for counter to increase...')

  let counterAfter = await counter.getCounter()
  let attempt = 1
  while (counterAfter === counterBefore) {
    ui.setActionPrompt(`Attempt ${attempt}`)
    await sleep(2000)
    counterAfter = await counter.getCounter()
    attempt++
  }

  ui.clearActionPrompt()
  ui.write('Counter increased successfully!')
}
