pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

import "@divergencetech/ethier/contracts/crypto/SignatureChecker.sol";
import "@divergencetech/ethier/contracts/crypto/SignerManager.sol";

import "./IFeeCalculator.sol";
import "./Governable.sol";

contract NiftyConnectPass is ERC721, ERC2981, IFeeCalculator, SignerManager, Governable {
    using SafeERC20 for IERC20;
    using SignatureChecker for EnumerableSet.AddressSet;

    enum NiftyConnectPassCardType {
        Black,
        Platinum,
        Gold,
        Normal,
        EarlyBird
    }

    enum Period {
        Month,
        Season,
        Year
    }

    struct NiftyConnectPassCardAttribution {
        NiftyConnectPassCardType cardType;
        uint256 mintTimestamp;
        uint256 expireTimestamp;

        uint256 previousTokenId;
        uint256 nextTokenId;
    }

    uint256 constant public UINT256_MAXIMUM_VALUE = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 constant public TOTAL_BLACK_CARD_AMOUNT = 100;
    uint256 constant public TOTAL_PLATINUM_CARD_AMOUNT = 1000;
    uint256 public constant MAXIMUM_FEE_RATE = 500;

    uint256 constant public ONE_MONTH = 30*86400;
    uint256 constant public ONE_SEASON = 3*ONE_MONTH;
    uint256 constant public ONE_YEAR = 12*ONE_MONTH;

    string public baseURI;

    uint256 public blackCardFeeRate = 0;
    uint256 public platinumCardFeeRate = 20;
    uint256 public goldCardFeeRate = 0;
    uint256 public normalCardFeeRate = 35;
    uint256 public defaultFeeRate = 200;

    uint256 public restGoldCardMintAmount = 10000;
    uint256 public goldMonthCardPrice = 15e16; // 0.15 ETH
    uint256 public goldSeasonCardPrice = 35e16; // 0.35 ETH
    uint256 public goldYearCardPrice = 100e16; // 1 ETH

    uint256 public normalMonthCardPrice = 15e15; // 0.015 ETH
    uint256 public normalSeasonCardPrice = 35e15; // 0.035 ETH
    uint256 public normalYearCardPrice = 100e15; // 0.1 ETH

    mapping(uint256 => NiftyConnectPassCardAttribution) public attributionHub;

    mapping(NiftyConnectPassCardType => mapping(address => uint256)) public userToLongestValidityPeriodMap;
    mapping(NiftyConnectPassCardType => uint256) public cardTypeToTotalSupply;

    uint256 public tokenIdIdx = 1;

    mapping(bytes32 => bool) public usedApproveMessages;

    event ValidityPeriodLinkForIssuer(address issuer, uint256 currTokenId, uint256 expireTime, uint256 preTokenId, uint256 nextTokenId);
    event ValidityPeriodLinkForReceiver(address recipient, uint256 currTokenId, uint256 expireTime, uint256 preTokenId, uint256 nextTokenId);

    constructor(
        string memory _name,
        string memory _symbol
    ) public ERC721(_name, _symbol) {
    }

    function mintBlackOrPlatinumTo(address recipient, NiftyConnectPassCardType cardType, bytes32 salt, bytes calldata sig) external returns(bool) {
        if (cardType==NiftyConnectPassCardType.Black) {
            require(cardTypeToTotalSupply[cardType]<TOTAL_BLACK_CARD_AMOUNT, "can't mint more black card");
        } else if(cardType==NiftyConnectPassCardType.Platinum) {
            require(cardTypeToTotalSupply[cardType]<TOTAL_PLATINUM_CARD_AMOUNT, "can't mint more platinum card");
        } else {
            revert("invalid card type");
        }
        signers.requireValidSignature(
            signaturePayload(recipient, cardType, salt),
            sig,
            usedApproveMessages);

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           cardType,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    UINT256_MAXIMUM_VALUE,
            previousTokenId:    0,
            nextTokenId:        0
        });
        updateValidityPeriodLinkForReceiver(recipient, tokenIdIdx);
        cardTypeToTotalSupply[cardType] = cardTypeToTotalSupply[cardType] + 1;
        tokenIdIdx++;
        return true;
    }

    function mintGoldTo(Period period, address recipient) external payable returns(bool) {
        uint256 expireTime;
        uint256 price;
        if (period == Period.Month) {
            expireTime = ONE_MONTH;
            price = goldMonthCardPrice;
        } else if (period == Period.Season) {
            expireTime = ONE_SEASON;
            price = goldSeasonCardPrice;
        } else if (period == Period.Year) {
            expireTime = ONE_YEAR;
            price = goldYearCardPrice;
        } else {
            revert("invalid period");
        }
        require(msg.value == price, "price mismatch");
        require(cardTypeToTotalSupply[NiftyConnectPassCardType.Gold] < restGoldCardMintAmount, "can't mint more gold card");

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           NiftyConnectPassCardType.Gold,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    block.timestamp+expireTime,
            previousTokenId:    0,
            nextTokenId:        0
        });
        updateValidityPeriodLinkForReceiver(recipient, tokenIdIdx);
        cardTypeToTotalSupply[NiftyConnectPassCardType.Gold] = cardTypeToTotalSupply[NiftyConnectPassCardType.Gold] + 1;
        tokenIdIdx++;
        return true;
    }

    function mintNormalTo(Period period, address recipient) external payable returns(bool) {
        uint256 expireTime;
        uint256 price;
        if (period == Period.Month) {
            expireTime = ONE_MONTH;
            price = normalMonthCardPrice;
        } else if (period == Period.Season) {
            expireTime = ONE_SEASON;
            price = normalSeasonCardPrice;
        } else if (period == Period.Year) {
            expireTime = ONE_YEAR;
            price = normalYearCardPrice;
        } else {
            revert("invalid period");
        }
        require(msg.value == price, "price mismatch");

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           NiftyConnectPassCardType.Normal,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    block.timestamp+expireTime,
            previousTokenId:    0,
            nextTokenId:        0
        });
        updateValidityPeriodLinkForReceiver(recipient, tokenIdIdx);
        cardTypeToTotalSupply[NiftyConnectPassCardType.Normal] = cardTypeToTotalSupply[NiftyConnectPassCardType.Normal] + 1;
        tokenIdIdx++;
        return true;
    }

    function mintEarlyBirdTo(address recipient, bytes32 salt, bytes calldata sig) external returns(bool) {
        signers.requireValidSignature(
            signaturePayload(recipient, NiftyConnectPassCardType.EarlyBird, salt),
            sig,
            usedApproveMessages);

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           NiftyConnectPassCardType.EarlyBird,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    UINT256_MAXIMUM_VALUE,
            previousTokenId:    0,
            nextTokenId:        0
        });
        updateValidityPeriodLinkForReceiver(recipient, tokenIdIdx);
        cardTypeToTotalSupply[NiftyConnectPassCardType.EarlyBird] = cardTypeToTotalSupply[NiftyConnectPassCardType.EarlyBird] + 1;
        tokenIdIdx++;
        return true;
    }

    function signaturePayload(address to, NiftyConnectPassCardType cardType, bytes32 salt)
        public pure returns (bytes memory) {
        return abi.encodePacked(to, cardType, salt);
    }

    function alreadyMinted(address recipient, NiftyConnectPassCardType cardType, bytes32 salt)
        external view returns (bool) {
        return usedApproveMessages[SignatureChecker.generateMessage(signaturePayload(recipient, cardType, salt))];
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        super.transferFrom(from, to, tokenId);
        afterTransfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        super.safeTransferFrom(from, to, tokenId);
        afterTransfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        super.safeTransferFrom(from, to, tokenId, _data);
        afterTransfer(from, to, tokenId);
    }

    function updateValidityPeriodLinkForReceiver(address recipient, uint256 tokenId) internal {
        NiftyConnectPassCardAttribution storage attr = attributionHub[tokenId];
        mapping(address => uint256) storage longestValidityPeriodBlackCardMap = userToLongestValidityPeriodMap[attr.cardType];
        uint256 tokenIdWithlongestValidityPeriod = longestValidityPeriodBlackCardMap[recipient];
        NiftyConnectPassCardAttribution storage attrOfTokenIdWithlongestValidityPeriod = attributionHub[tokenIdWithlongestValidityPeriod];

        if (tokenIdWithlongestValidityPeriod == 0) { // priviously there is no tokenId with the same card type
            longestValidityPeriodBlackCardMap[recipient] = tokenId;
        } else if (tokenIdWithlongestValidityPeriod != 0 && attrOfTokenIdWithlongestValidityPeriod.expireTimestamp <= attr.expireTimestamp) {
            longestValidityPeriodBlackCardMap[recipient] = tokenId;
            attr.previousTokenId = tokenIdWithlongestValidityPeriod;
            attrOfTokenIdWithlongestValidityPeriod.nextTokenId = tokenId;
        } else {
            uint256 iterateTokenId = tokenIdWithlongestValidityPeriod;
            for(;;) {
                NiftyConnectPassCardAttribution storage tempAttr = attributionHub[iterateTokenId];
                if (tempAttr.expireTimestamp <= attr.expireTimestamp) {
                    attr.previousTokenId = iterateTokenId;
                    attr.nextTokenId = tempAttr.nextTokenId;
                    if (tempAttr.nextTokenId != 0) {
                        NiftyConnectPassCardAttribution storage tempNextAttr = attributionHub[tempAttr.nextTokenId];
                        tempNextAttr.previousTokenId = tokenId;
                    }
                    tempAttr.nextTokenId = tokenId;
                    break;
                } else {
                    if (tempAttr.previousTokenId == 0) {
                        tempAttr.previousTokenId = tokenId;
                        attr.nextTokenId = iterateTokenId;
                        break;
                    }
                    iterateTokenId = tempAttr.previousTokenId;
                }
            }
        }
        emit ValidityPeriodLinkForReceiver(recipient, tokenId, attr.expireTimestamp, attr.previousTokenId, attr.nextTokenId);
    }

    function updateValidityPeriodLinkForIssuer(address from, uint256 tokenId) internal {
        NiftyConnectPassCardAttribution storage attr = attributionHub[tokenId];
        mapping(address => uint256) storage longestValidityPeriodBlackCardMap = userToLongestValidityPeriodMap[attr.cardType];
        uint256 tokenIdWithlongestValidityPeriod = longestValidityPeriodBlackCardMap[from];

        if (attr.previousTokenId != 0 && attr.nextTokenId != 0) {
            NiftyConnectPassCardAttribution storage previousAttr = attributionHub[attr.previousTokenId];
            NiftyConnectPassCardAttribution storage nextAttr = attributionHub[attr.nextTokenId];
            previousAttr.nextTokenId = attr.nextTokenId;
            nextAttr.previousTokenId = attr.previousTokenId;
        } else if (attr.previousTokenId == 0 && attr.nextTokenId != 0) {
            NiftyConnectPassCardAttribution storage nextAttr = attributionHub[attr.nextTokenId];
            nextAttr.previousTokenId = attr.previousTokenId;
        } else if (attr.previousTokenId != 0 && attr.nextTokenId == 0) {
            NiftyConnectPassCardAttribution storage previousAttr = attributionHub[attr.previousTokenId];
            previousAttr.nextTokenId = attr.nextTokenId;
            longestValidityPeriodBlackCardMap[from] = attr.previousTokenId;
        } else {
            longestValidityPeriodBlackCardMap[from] = 0;
        }
        emit ValidityPeriodLinkForIssuer(from, tokenId, attr.expireTimestamp, attr.previousTokenId, attr.nextTokenId);
        attr.previousTokenId = 0;
        attr.nextTokenId = 0;
    }

    function afterTransfer(address from, address to, uint256 tokenId) internal {
        updateValidityPeriodLinkForIssuer(from, tokenId);
        updateValidityPeriodLinkForReceiver(to, tokenId);
    }

    function calculateFee(address seller) external view returns (uint256 feeRate) {
        mapping(address => uint256) storage longestValidityPeriodBlackCardMap = userToLongestValidityPeriodMap[NiftyConnectPassCardType.Black];
        NiftyConnectPassCardAttribution memory attrBlackCard = attributionHub[longestValidityPeriodBlackCardMap[seller]];
        if (attrBlackCard.expireTimestamp >= block.timestamp) {
            return blackCardFeeRate;
        }
        mapping(address => uint256) storage longestValidityPeriodGoldCardMap = userToLongestValidityPeriodMap[NiftyConnectPassCardType.Gold];
        NiftyConnectPassCardAttribution memory attrGoldCard = attributionHub[longestValidityPeriodGoldCardMap[seller]];
        if (attrGoldCard.expireTimestamp >= block.timestamp) {
            return goldCardFeeRate;
        }
        mapping(address => uint256) storage longestValidityPeriodPlatinumCardMap = userToLongestValidityPeriodMap[NiftyConnectPassCardType.Platinum];
        NiftyConnectPassCardAttribution memory attrPlatinumCard = attributionHub[longestValidityPeriodPlatinumCardMap[seller]];
        if (attrPlatinumCard.expireTimestamp >= block.timestamp) {
            return platinumCardFeeRate;
        }
        mapping(address => uint256) storage longestValidityPeriodNormalCardMap = userToLongestValidityPeriodMap[NiftyConnectPassCardType.Normal];
        NiftyConnectPassCardAttribution memory attrNormalCard = attributionHub[longestValidityPeriodNormalCardMap[seller]];
        if (attrNormalCard.expireTimestamp >= block.timestamp) {
            return normalCardFeeRate;
        }
        return defaultFeeRate;
    }

    function redeem(address payable recipient, IERC20 token) onlyOwner external returns(bool) {
        if (address(token) == address(0x00)) {
            uint256 balance = address(this).balance;
            recipient.transfer(balance);
        } else {
            uint256 balance = token.balanceOf(address(this));
            token.safeTransfer(recipient, balance);
        }
        return true;
    }

    function changeBlackCardFeeRate(uint256 newBlackFeeRate) public onlyGovernor {
        require(newBlackFeeRate <= MAXIMUM_FEE_RATE, "invalid new fee share");
        blackCardFeeRate = newBlackFeeRate;
    }

    function changePlatinumCardFeeRate(uint256 newPlatinumFeeRate) public onlyGovernor {
        require(newPlatinumFeeRate <= MAXIMUM_FEE_RATE, "invalid new fee share");
        platinumCardFeeRate = newPlatinumFeeRate;
    }

    function changeGoldCardFeeRate(uint256 newGoldFeeRate) public onlyGovernor {
        require(newGoldFeeRate <= MAXIMUM_FEE_RATE, "invalid new fee share");
        goldCardFeeRate = newGoldFeeRate;
    }

    function changeNormalCardFeeRate(uint256 newNormalFeeRate) public onlyGovernor {
        require(newNormalFeeRate <= MAXIMUM_FEE_RATE, "invalid new fee share");
        normalCardFeeRate = newNormalFeeRate;
    }

    function changeDefaultFeeRate(uint256 newDefaultFeeRate) public onlyGovernor {
        require(newDefaultFeeRate <= MAXIMUM_FEE_RATE, "invalid new fee share");
        defaultFeeRate = newDefaultFeeRate;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyGovernor {
        super._setDefaultRoyalty(receiver, feeNumerator);
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}