import { Address } from "viem";
import { NetworkId } from "../../types/networkId";

export const ALLBRIDGE_ADDRESSES_BY_NETWORK_ID: Record<NetworkId, Address[] | undefined> = {
    [NetworkId['celo-mainnet']]: undefined,
    [NetworkId['celo-alfajores']]: undefined,
    [NetworkId['ethereum-mainnet']]: undefined,
    [NetworkId['ethereum-sepolia']]: undefined,
    [NetworkId['arbitrum-one']]: ['0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e'],
    [NetworkId['arbitrum-sepolia']]: undefined,
    [NetworkId['op-mainnet']]: undefined,
    [NetworkId['op-sepolia']]: undefined,
    [NetworkId['polygon-pos-mainnet']]: undefined,
    [NetworkId['polygon-pos-amoy']]: undefined,
    [NetworkId['base-mainnet']]: undefined,
    [NetworkId['base-sepolia']]: undefined,
}