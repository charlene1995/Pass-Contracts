pragma solidity ^0.8.0;

interface IFeeCalculator {
    function calculateFee(address seller) external view returns (uint256 feeRate);
}