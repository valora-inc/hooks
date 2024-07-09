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
  struct MarketInfo {
    address baseToken;
    uint256 baseTokenBalance;
    uint256 borrowBalance;
    CollateralInfo[] collaterals;
  }

  struct CollateralInfo {
    address asset;
    uint128 balance;
  }

  function getUserPositions(
    address owner,
    address[] memory cometAddresses
  ) external view returns (MarketInfo[] memory marketInfo) {
    marketInfo = new MarketInfo[](cometAddresses.length);

    for (uint256 index = 0; index < cometAddresses.length; index++) {
      Comet comet = Comet(cometAddresses[index]);

      uint8 numAssets = comet.numAssets();
      CollateralInfo[] memory collaterals = new CollateralInfo[](numAssets);

      for (uint8 collIndex = 0; collIndex < numAssets; collIndex++) {
        Comet.AssetInfo memory assetInfo = comet.getAssetInfo(collIndex);
        CollateralInfo memory collateralInfo = CollateralInfo(
          assetInfo.asset,
          comet.collateralBalanceOf(owner, assetInfo.asset)
        );
        collaterals[collIndex] = collateralInfo;
      }

      marketInfo[index] = MarketInfo(
        comet.baseToken(),
        comet.balanceOf(owner),
        comet.borrowBalanceOf(owner),
        collaterals
      );
    }
  }
}
