// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface Comet {
    struct AssetInfo {
        uint8 offset;
        address asset;
        address priceFeed;
        uint64 scale;
        uint64 borrowCollateralFactor;
        uint64 liquidateCollateralFactor;
        uint64 liquidationFactor;
        uint128 supplyCap;
    }

    function balanceOf(address owner) external view returns (uint256);

    function collateralBalanceOf(
        address account,
        address asset
    ) external view returns (uint128);

    function borrowBalanceOf(address account) external view returns (uint256);

    function baseToken() external view returns (address);
    function getAssetInfo(uint8 i) external view returns (AssetInfo memory);
    function numAssets() external view returns (uint8);
}

contract CompoundUserPositionMulticall {
    struct CollateralInfo {
        address asset;
        uint128 balance;
    }

    function getUserPositions(
        address owner,
        address cometAddress
    )
        external
        view
        returns (
            address baseToken,
            uint256 baseTokenBalance,
            uint256 borrowBalance,
            CollateralInfo[] memory collaterals
        )
    {
        Comet comet = Comet(cometAddress);

        baseToken = comet.baseToken();
        baseTokenBalance = comet.balanceOf(owner);
        borrowBalance = comet.borrowBalanceOf(owner);

        uint8 numAssets = comet.numAssets();
        collaterals = new CollateralInfo[](numAssets);

        for (uint8 index = 0; index < numAssets; index++) {
            Comet.AssetInfo memory assetInfo = comet.getAssetInfo(index);
            CollateralInfo memory collateralInfo = CollateralInfo(
                assetInfo.asset,
                comet.collateralBalanceOf(owner, assetInfo.asset)
            );
            collaterals[index] = collateralInfo;
        }
    }
}
