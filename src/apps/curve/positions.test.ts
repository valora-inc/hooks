import { getAllCurvePools } from './positions'
import { NetworkId } from '../../api/networkId'

describe('curve positions', () => {
  // note: curve API response is mocked in test/server.ts
  describe('getAllCurvePools', () => {
    it('gives empty list for unknown or unsupported network', async () => {
      const result = await getAllCurvePools('unknown' as NetworkId)
      expect(result).toEqual([])

      const result2 = await getAllCurvePools(NetworkId['ethereum-sepolia'])
      expect(result2).toEqual([])
    })
    it('gives list of pools for celo', async () => {
      const result = await getAllCurvePools(NetworkId['celo-mainnet'])
      expect(result).toEqual([
        {
          address: '0x998395fEd908d33CF27115A1D9Ab6555def6cd45',
          size: 3,
        },
        {
          address: '0x32fD7e563c6521Ab4D59CE3277bcfBe3317CFd63',
          size: 3,
        },
        {
          address: '0xAF7Ee5Ba02dC9879D24cb16597cd854e13f3aDa8',
          size: 2,
        },
      ])
    })
  })
})
