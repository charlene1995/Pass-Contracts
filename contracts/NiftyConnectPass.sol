pragma solidity ^0.8.0;

import "./ERC721A.sol";
import "./IFeeCalculator.sol";

contract NiftyConnectPass is ERC721A, IFeeCalculator {

    enum NiftyConnectPassCardType {
        Black,
        Platinum,
        Gold,
        Normal,
        EarlyBird
    }

    struct NiftyConnectPassCardAttribution {
        uint256 mintTimestamp;
        uint256 expireTimestamp;
    }

    uint256 constant public TOTAL_BLACK_CARD_AMOUNT = 100;
    uint256 constant public TOTAL_PLATINUM_CARD_AMOUNT = 1000;

    uint256 public restGoldCardMintAmount = 10000;
    uint256 public goldMonthCardPrice = 15e16; // 0.15 ETH
    uint256 public goldSeasonCardPrice = 35e16; // 0.35 ETH
    uint256 public goldYearCardPrice = 100e16; // 1 ETH

    uint256 public normalMonthCardPrice = 15e15; // 0.015 ETH
    uint256 public normalSeasonCardPrice = 35e15; // 0.035 ETH
    uint256 public normalYearCardPrice = 100e15; // 0.1 ETH

    mapping(address => uint256) userBlackCardBalanceMap;
    mapping(address => uint256) userPlatinumCardBalanceMap;
    mapping(address => uint256) userGoldCardBalanceMap;
    mapping(address => uint256) userNormalCardBalanceMap;
    mapping(address => uint256) userEarlyBirdCardBalanceMap;

}