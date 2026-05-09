// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LMSToken is ERC20, Ownable {
    event RewardMinted(address indexed to, uint256 amount, string reason);

    constructor() ERC20("LMS Reward Token", "LMSR") {}

    function mintReward(address to, uint256 amount, string memory reason) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than zero");

        _mint(to, amount);
        emit RewardMinted(to, amount, reason);
    }
}
