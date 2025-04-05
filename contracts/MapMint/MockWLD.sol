// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWLD
 * @dev A mock WorldCoin (WLD) token for testing purposes
 */
contract MockWLD is ERC20, Ownable {
    uint8 private _decimals = 18;

    /**
     * @dev Constructor that initializes the token with name, symbol, and mints initial supply
     */
    constructor() ERC20("MockWorldCoin", "mWLD") Ownable(msg.sender) {
        // Mint 1,000,000 tokens to the deployer
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @dev Returns the number of decimals used for token amounts
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints tokens to an address (only owner can call)
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
} 