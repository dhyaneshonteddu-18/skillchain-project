// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Non-transferable achievement badges. They prove a registered claim, not skill quality by themselves.
contract SkillBadge is ERC721, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    uint256 private _nextTokenId;
    mapping(uint256 => string) public achievementType;
    mapping(uint256 => string) public proofURI;
    mapping(address => mapping(bytes32 => bool)) private _hasAchievementType;

    constructor(address admin) ERC721("SkillBadge", "SKB") {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    function mintBadge(address student, string calldata achievementType_, string calldata proofURI_)
        external onlyRole(VERIFIER_ROLE) returns (uint256)
    {
        require(student != address(0), "Invalid student");
        require(bytes(achievementType_).length > 0, "Missing achievement type");
        uint256 tokenId = _nextTokenId++;
        _safeMint(student, tokenId);
        achievementType[tokenId] = achievementType_;
        proofURI[tokenId] = proofURI_;
        _hasAchievementType[student][keccak256(bytes(achievementType_))] = true;
        return tokenId;
    }

    function hasAchievementType(address student, string calldata achievementType_) external view returns (bool) {
        return _hasAchievementType[student][keccak256(bytes(achievementType_))];
    }

    function nextTokenId() external view returns (uint256) { return _nextTokenId; }

    function addVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, account);
    }

    function removeVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, account);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("SkillBadge: non-transferable");
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
