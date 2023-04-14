// Took the event ABI I needed from https://github.com/Ubeswap/ubeswap-interface/blob/baaa4a029a04e16f92c8fcef3766bc87cb02d4dc/src/constants/abis/FarmRegistry.json
export const FarmInfoEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: 'address',
      name: 'stakingAddress',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'bytes32',
      name: 'farmName',
      type: 'bytes32',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'lpAddress',
      type: 'address',
    },
  ],
  name: 'FarmInfo',
  type: 'event',
} as const
