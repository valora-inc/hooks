// Update the farms.json file with the latest farm info
// This is a temporary solution as querying farm info from the blockchain is too slow
// Medium term solution is to index farms using The Graph
// Usage: yarn ts-node ./src/apps/ubeswap/scripts/updateFarms.ts
/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import { FarmInfoEventAbi } from '../abis/farm-registry'
import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'

const FARM_REGISTRY = '0xa2bf67e12EeEDA23C7cA1e5a34ae2441a17789Ec'
const FARM_CREATION_BLOCK = 9840049n

// How many blocks to query at once
// Decrease this if the RPC node times out
const BLOCKS_PER_QUERY = 500_000n

const client = createPublicClient({
  chain: celo,
  transport: http(),
})

void (async () => {
  const currentBlockNumber = await client.getBlockNumber()
  console.log('Current block number', currentBlockNumber)

  const farmInfoEvents = []
  for (
    let fromBlock = FARM_CREATION_BLOCK;
    fromBlock < currentBlockNumber;
    fromBlock += BLOCKS_PER_QUERY
  ) {
    const toBlock = fromBlock + BLOCKS_PER_QUERY
    console.log('Querying blocks range', fromBlock, toBlock)
    const events = await client.getLogs({
      address: FARM_REGISTRY,
      event: FarmInfoEventAbi,
      fromBlock,
      toBlock,
    })
    farmInfoEvents.push(...events)
  }

  const farmInfo = farmInfoEvents.map((e) => e.args)

  console.log(JSON.stringify(farmInfo, null, ' '))

  // Write farm info to file
  fs.writeFileSync(
    path.join(__dirname, '../data/farms.json'),
    JSON.stringify(farmInfo, null, ' '),
  )
})()
