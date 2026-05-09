// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CourseCertificateNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct CertificateData {
        string courseId;
        uint256 score;
        uint256 issuedAt;
    }

    mapping(uint256 => CertificateData) public certificateData;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed student,
        string courseId,
        uint256 score,
        string tokenURI
    );

    constructor() ERC721("LMS Course Certificate", "LMSCERT") {}

    function mintCertificate(
        address student,
        string memory courseId,
        uint256 score,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(student != address(0), "Invalid student address");

        uint256 tokenId = _nextTokenId;
        _nextTokenId += 1;

        _safeMint(student, tokenId);
        _setTokenURI(tokenId, metadataURI);

        certificateData[tokenId] = CertificateData({
            courseId: courseId,
            score: score,
            issuedAt: block.timestamp
        });

        emit CertificateMinted(tokenId, student, courseId, score, metadataURI);

        return tokenId;
    }
}
