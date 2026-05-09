// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VerificationRegistry is Ownable {
    struct CompletionRecord {
        bool completed;
        uint256 score;
        uint256 completedAt;
        uint256 certificateTokenId;
        bytes32 recordHash;
    }

    mapping(address => mapping(bytes32 => CompletionRecord)) public completions;

    event CompletionRegistered(
        address indexed student,
        bytes32 indexed courseIdHash,
        uint256 score,
        uint256 certificateTokenId,
        bytes32 recordHash
    );

    constructor() {}

    function registerCompletion(
        address student,
        string calldata courseId,
        uint256 score,
        uint256 certificateTokenId,
        bytes32 recordHash
    ) external onlyOwner {
        require(student != address(0), "Invalid student address");
        require(bytes(courseId).length > 0, "Course id required");

        bytes32 courseIdHash = keccak256(abi.encodePacked(courseId));

        completions[student][courseIdHash] = CompletionRecord({
            completed: true,
            score: score,
            completedAt: block.timestamp,
            certificateTokenId: certificateTokenId,
            recordHash: recordHash
        });

        emit CompletionRegistered(student, courseIdHash, score, certificateTokenId, recordHash);
    }

    function isCompleted(address student, string calldata courseId) external view returns (bool) {
        bytes32 courseIdHash = keccak256(abi.encodePacked(courseId));
        return completions[student][courseIdHash].completed;
    }
}
