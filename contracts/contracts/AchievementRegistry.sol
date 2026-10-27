// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./SkillCoin.sol";
import "./SkillBadge.sol";
import "./CertificateHashRegistry.sol";

/// @notice Coordinates verified achievement issuance and standard 18-decimal SKC rewards.
contract AchievementRegistry is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    uint256 public constant TOKEN_UNIT = 1 ether;

    SkillCoin public immutable skillCoin;
    SkillBadge public immutable skillBadge;
    CertificateHashRegistry public immutable certificateRegistry;
    mapping(string => uint256) public rewardAmount; // raw ERC-20 units (18 decimals)
    // Changed from bool to uint256 to track count of claims (allows multiple claims per achievement type)
    mapping(address => mapping(string => uint256)) public claimCount;

    event AchievementApproved(address indexed student, string achievementType, uint256 coinsAwarded, uint256 badgeId, bytes32 certificateHash, uint256 claimNumber);

    constructor(address admin, address skillCoinAddress, address skillBadgeAddress, address certificateRegistryAddress) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
        skillCoin = SkillCoin(skillCoinAddress);
        skillBadge = SkillBadge(skillBadgeAddress);
        certificateRegistry = CertificateHashRegistry(certificateRegistryAddress);
        rewardAmount["INTERNSHIP"] = 100 * TOKEN_UNIT;
        rewardAmount["HACKATHON"] = 200 * TOKEN_UNIT;
        rewardAmount["AWS_CERT"] = 150 * TOKEN_UNIT;
    }

    /// @param wholeTokens Human-readable SKC amount, e.g. 150 means 150 SKC.
    function setReward(string calldata achievementType_, uint256 wholeTokens) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(achievementType_).length > 0, "Missing type");
        require(wholeTokens <= type(uint256).max / TOKEN_UNIT, "Reward too large");
        rewardAmount[achievementType_] = wholeTokens * TOKEN_UNIT;
    }

    /// @notice Manual authorized review; `proofURI` is evidence, not proof of issuer authenticity by itself.
    function approveAchievement(address student, string calldata achievementType_, string calldata proofURI)
        external onlyRole(VERIFIER_ROLE)
    {
        _approve(student, achievementType_, proofURI, bytes32(0));
    }

    /// @notice Certificate-hash path. Hash must have been registered by the trusted issuer/admin after checking authenticity.
    function approveAchievementWithHash(address student, string calldata achievementType_, string calldata proofURI, bytes32 certificateHash)
        external onlyRole(VERIFIER_ROLE)
    {
        require(certificateHash != bytes32(0), "Empty certificate hash");
        require(certificateRegistry.verifyCertificate(certificateHash), "Certificate hash not issuer-registered");
        _approve(student, achievementType_, proofURI, certificateHash);
    }

    function _approve(address student, string calldata achievementType_, string calldata proofURI, bytes32 certificateHash) private {
        require(student != address(0), "Invalid student");
        uint256 reward = rewardAmount[achievementType_];
        require(reward > 0, "Unknown achievement type");
        
        // Increment claim count (allows multiple claims of same type)
        claimCount[student][achievementType_]++;
        uint256 claimNumber = claimCount[student][achievementType_];
        
        skillCoin.mint(student, reward);
        uint256 badgeId = skillBadge.mintBadge(student, achievementType_, proofURI);
        emit AchievementApproved(student, achievementType_, reward, badgeId, certificateHash, claimNumber);
    }
}
