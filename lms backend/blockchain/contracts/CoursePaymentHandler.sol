// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoursePaymentHandler is Ownable {
    IERC20 public immutable usdc;
    address public treasury;

    event CoursePaid(
        address indexed student,
        string courseId,
        uint256 amount,
        uint256 paidAt
    );

    constructor(address usdcToken, address initialTreasury) {
        require(usdcToken != address(0), "Invalid USDC token address");
        require(initialTreasury != address(0), "Invalid treasury address");
        usdc = IERC20(usdcToken);
        treasury = initialTreasury;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }

    function payForCourse(string calldata courseId, uint256 amount) external {
        require(bytes(courseId).length > 0, "Course id required");
        require(amount > 0, "Amount must be greater than zero");

        bool success = usdc.transferFrom(msg.sender, treasury, amount);
        require(success, "USDC transfer failed");

        emit CoursePaid(msg.sender, courseId, amount, block.timestamp);
    }
}
