pragma solidity ^0.5.0;

import "./Token1.sol";
import "./Token2.sol";

// This contract can take TST1 and convert them to TST2 and send.
contract Interoperability {
    address owner;
    Token1 TST1;
    Token2 TST2;
    uint256 conversionFactor; // one to one conversion means conversionFactor is 100.
    
    modifier onlyOwner {
        require(msg.sender == owner, "Sender is not the owner of contract");
        _;
    }
    
    event TST2Withdrawn(address sender, address receiver, uint256 tokenAmount);
    
    constructor(address _owner, address _TST1, address _TST2, uint256 _conversionFactor) public {
        owner = _owner;
        TST1 = Token1(_TST1);
        TST2 = Token2(_TST2);
        conversionFactor = _conversionFactor;
    }
    
    function interoperableTransfer(address toAddress, uint256 tokenAmount) public {
        address thisContract = address(this);
        uint256 prevBalance = TST1.balanceOf(thisContract);
        TST1.transferFrom(msg.sender, address(this), tokenAmount);
        uint256 currentBalance = TST1.balanceOf(thisContract);
        require(tokenAmount == currentBalance - prevBalance, "Balances don't add up, something is wrong.");
        _transfer(toAddress, tokenAmount);
    }
    
    function withdrawTST2 (address toAddress, uint256 tokenAmount) public onlyOwner {
        _transfer(toAddress, tokenAmount);
        emit TST2Withdrawn(msg.sender, toAddress, tokenAmount);
    }

    function _transfer(address to, uint256 value) internal {
        require(TST2.transfer(to, value), "Token transfer failed");
    }
}