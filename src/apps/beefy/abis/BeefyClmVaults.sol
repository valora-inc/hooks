// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface ClmVault {
    function balanceOf(address owner) external view returns (uint256);

    function balances() external view returns (uint256, uint256);

    function totalSupply() external view returns (uint256);

    function wants() external view returns (address, address);
}

interface ClmPool {
    function balanceOf(address owner) external view returns (uint256);

    function totalSupply() external view returns (uint256);
}

contract BeefyClmVaults {
    struct VaultInfo {
        address token0;
        address token1;
        uint256 amount0;
        uint256 amount1;
    }

    function getUserVaults(
        address owner,
        address[] memory vaults
    ) external view returns (VaultInfo[] memory userVaults) {
        userVaults = new VaultInfo[](vaults.length);

        for (uint16 index = 0; index < vaults.length; index++) {
            ClmVault vault = ClmVault(vaults[index]);
            (address token0, address token1) = vault.wants();

            (uint256 amount0, uint256 amount1) = vault.balances();
            uint256 supply = vault.totalSupply();
            uint256 balance = vault.balanceOf(owner);

            userVaults[index] = VaultInfo(
                token0,
                token1,
                (balance * amount0) / supply,
                (balance * amount1) / supply
            );
        }
    }

    function getUserClmPools(
        address owner,
        address[] memory vaults,
        address[] memory pools
    ) external view returns (VaultInfo[] memory userVaults) {
        userVaults = new VaultInfo[](vaults.length);

        for (uint16 index = 0; index < vaults.length; index++) {
            ClmVault vault = ClmVault(vaults[index]);
            ClmPool pool = ClmPool(pools[index]);
            (address token0, address token1) = vault.wants();
            (uint256 amount0, uint256 amount1) = vault.balances();
            uint256 vaultSupply = vault.totalSupply();
            uint256 vaultBalance = vault.balanceOf(pools[index]);

            uint256 poolSupply = pool.totalSupply();
            uint256 poolBalance = pool.balanceOf(owner);

            uint256 poolAmount0 = (vaultBalance * amount0) / vaultSupply;
            uint256 poolAmount1 = (vaultBalance * amount1) / vaultSupply;

            userVaults[index] = VaultInfo(
                token0,
                token1,
                (poolBalance * poolAmount0) / poolSupply,
                (poolBalance * poolAmount1) / poolSupply
            );
        }
    }
}
