export const userPositionsAbi = [
  {
    inputs: [],
    name: 'T',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'contract INonfungiblePositionManager',
        name: 'positionsManager',
        type: 'address',
      },
      {
        internalType: 'contract IUniswapV3Factory',
        name: 'factory',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'getPositions',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'poolAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
          {
            internalType: 'uint96',
            name: 'nonce',
            type: 'uint96',
          },
          {
            internalType: 'address',
            name: 'operator',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'token0',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'token1',
            type: 'address',
          },
          {
            internalType: 'uint24',
            name: 'fee',
            type: 'uint24',
          },
          {
            internalType: 'int24',
            name: 'tickLower',
            type: 'int24',
          },
          {
            internalType: 'int24',
            name: 'tickUpper',
            type: 'int24',
          },
          {
            internalType: 'uint128',
            name: 'liquidity',
            type: 'uint128',
          },
          {
            internalType: 'uint256',
            name: 'amount0',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount1',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'feeGrowthInside0LastX128',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'feeGrowthInside1LastX128',
            type: 'uint256',
          },
          {
            internalType: 'uint128',
            name: 'tokensOwed0',
            type: 'uint128',
          },
          {
            internalType: 'uint128',
            name: 'tokensOwed1',
            type: 'uint128',
          },
        ],
        internalType: 'struct UniV3UserPositionsMulticall.UniV3Position[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
