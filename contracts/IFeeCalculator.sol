pragma solidity ^0.8.0;

interface IFeeCalculator {
    function calculateFee(address taker, address maker) external view returns (uint256 feeRate);
}