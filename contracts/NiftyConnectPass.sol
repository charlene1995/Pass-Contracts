pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@divergencetech/ethier/contracts/crypto/SignatureChecker.sol";
import "@divergencetech/ethier/contracts/crypto/SignerManager.sol";

import "./IFeeCalculator.sol";

contract NiftyConnectPass is ERC721, IFeeCalculator, SignerManager {
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
    }

    uint256 constant public UINT256_MAXIMUM_VALUE = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 constant public TOTAL_BLACK_CARD_AMOUNT = 100;
    uint256 constant public TOTAL_PLATINUM_CARD_AMOUNT = 1000;

    uint256 constant public ONE_MONTH = 30*86400;
    uint256 constant public ONE_SEASON = 3*ONE_MONTH;
    uint256 constant public ONE_YEAR = 12*ONE_MONTH;

    string public baseURI;

    uint256 public restGoldCardMintAmount = 10000;
    uint256 public goldMonthCardPrice = 15e16; // 0.15 ETH
    uint256 public goldSeasonCardPrice = 35e16; // 0.35 ETH
    uint256 public goldYearCardPrice = 100e16; // 1 ETH

    uint256 public normalMonthCardPrice = 15e15; // 0.015 ETH
    uint256 public normalSeasonCardPrice = 35e15; // 0.035 ETH
    uint256 public normalYearCardPrice = 100e15; // 0.1 ETH

    mapping(uint256 => NiftyConnectPassCardAttribution) public attributionHub;

    mapping(address => uint256[]) private userToSortedBlackCardMap;
    mapping(address => uint256[]) private userToSortedPlatinumCardMap;
    mapping(address => uint256[]) private userToSortedGoldCardMap;
    mapping(address => uint256[]) private userToSortedNormalCardMap;
    mapping(address => uint256[]) private userToSortedEarlyBirdCardMap;

    uint256 public tokenIdIdx = 1;

    mapping(bytes32 => bool) public usedApproveMessages;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) public ERC721(_name, _symbol) {
        baseURI = _baseURI;
    }

    function mintBlackOrPlatinumTo(address recipient, NiftyConnectPassCardType cardType, bytes32 nonce, bytes calldata sig) external returns(bool) {
        require(
            cardType==NiftyConnectPassCardType.Black ||
            cardType==NiftyConnectPassCardType.Platinum, "invalid card type");
        signers.requireValidSignature(
            signaturePayload(recipient, cardType, nonce),
            sig,
            usedApproveMessages);

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           NiftyConnectPassCardType.Black,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    UINT256_MAXIMUM_VALUE
        });
        afterTransfer(address(0x0), recipient, tokenIdIdx);
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

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           NiftyConnectPassCardType.Gold,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    block.timestamp+expireTime
        });
        afterTransfer(address(0x0), recipient, tokenIdIdx);
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
            expireTimestamp:    block.timestamp+expireTime
        });
        afterTransfer(address(0x0), recipient, tokenIdIdx);
        tokenIdIdx++;
        return true;
    }

    function mintEarlyBirdTo(address recipient, bytes32 nonce, bytes calldata sig) external payable returns(bool) {
        signers.requireValidSignature(
            signaturePayload(recipient, NiftyConnectPassCardType.EarlyBird, nonce),
            sig,
            usedApproveMessages);

        _safeMint(recipient, tokenIdIdx);
        attributionHub[tokenIdIdx] = NiftyConnectPassCardAttribution({
            cardType:           NiftyConnectPassCardType.EarlyBird,
            mintTimestamp:      block.timestamp,
            expireTimestamp:    UINT256_MAXIMUM_VALUE
        });
        afterTransfer(address(0x0), recipient, tokenIdIdx);
        tokenIdIdx++;
        return true;
    }

    function signaturePayload(address to, NiftyConnectPassCardType cardType, bytes32 nonce)
        internal pure returns (bytes memory) {
        return abi.encodePacked(to, cardType, nonce);
    }

    function alreadyMinted(address recipient, NiftyConnectPassCardType cardType, bytes32 nonce)
        external view returns (bool) {
        return usedApproveMessages[SignatureChecker.generateMessage(signaturePayload(recipient, cardType, nonce))];
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

    function afterTransfer(address from, address to, uint256 tokenId) internal {

    }

    function calculateFee(address seller) external view returns (uint256 feeRate) {
        return 0;
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
}