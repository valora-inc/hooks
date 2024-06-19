import { getAllCurvePools } from './positions'
import { NetworkId } from '../../types/networkId'

describe('curve positions', () => {
  // note: curve API response is mocked in test/server.ts
  describe('getAllCurvePools', () => {
    it('gives empty list for unknown or unsupported network', async () => {
      const result = await getAllCurvePools('unknown' as NetworkId)
      expect(result).toEqual([])

      const result2 = await getAllCurvePools(NetworkId['ethereum-sepolia'])
      expect(result2).toEqual([])
    })
    it.each([
      [
        NetworkId['celo-mainnet'],
        [
          '0x998395fEd908d33CF27115A1D9Ab6555def6cd45',
          '0x32fD7e563c6521Ab4D59CE3277bcfBe3317CFd63',
          '0xAF7Ee5Ba02dC9879D24cb16597cd854e13f3aDa8',
        ],
      ],
      [
        NetworkId['ethereum-mainnet'],
        [
          '0x1F71f05CF491595652378Fe94B7820344A551B8E',
          '0xe7A3b38c39F97E977723bd1239C3470702568e7B',
        ],
      ],
    ])(
      'gives list of pools for networkId %s',
      async (networkId: NetworkId, expectedPoolAddresses) => {
        const result = await getAllCurvePools(networkId)
        expect(result.map((pool) => pool.address)).toEqual(
          expectedPoolAddresses,
        )
      },
    )
  })
})
