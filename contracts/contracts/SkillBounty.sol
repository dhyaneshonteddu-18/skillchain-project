// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SkillBadge.sol";

/// @notice Testnet bounty escrow: SKC is locked when a bounty is created and released after review.
contract SkillBounty is AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    IERC20 public immutable skillCoin;
    SkillBadge public immutable skillBadge;

    enum Status { Active, Completed, Cancelled }
    struct Bounty {
        address creator;
        uint256 reward;
        string title;
        string description;
        string requiredAchievementType;
        Status status;
        uint256 activeSubmissions;
        address winner;
    }
    struct Submission { string proofURI; bool exists; bool rejected; bool withdrawn; }

    uint256 public nextBountyId;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(address => Submission)) public submissions;
    mapping(uint256 => address[]) private _submitters;

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward, string requiredAchievementType);
    event WorkSubmitted(uint256 indexed bountyId, address indexed student, string proofURI);
    event SubmissionRejected(uint256 indexed bountyId, address indexed student);
    event SubmissionWithdrawn(uint256 indexed bountyId, address indexed student);
    event BountyCompleted(uint256 indexed bountyId, address indexed winner, uint256 reward);
    event BountyCancelled(uint256 indexed bountyId, address indexed creator, uint256 refund);

    constructor(address admin, address skillCoinAddress, address skillBadgeAddress) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
        skillCoin = IERC20(skillCoinAddress);
        skillBadge = SkillBadge(skillBadgeAddress);
    }

    /// @dev `reward` is raw ERC-20 units; frontend should use parseUnits(amount, 18).
    function createBounty(string calldata title, string calldata description, string calldata requiredAchievementType, uint256 reward)
        external returns (uint256 bountyId)
    {
        require(bytes(title).length > 0, "Missing title");
        require(bytes(description).length > 0, "Missing description");
        require(bytes(requiredAchievementType).length > 0, "Missing required badge type");
        require(reward > 0, "Reward must be positive");
        skillCoin.safeTransferFrom(msg.sender, address(this), reward);
        bountyId = nextBountyId++;
        bounties[bountyId] = Bounty(msg.sender, reward, title, description, requiredAchievementType, Status.Active, 0, address(0));
        emit BountyCreated(bountyId, msg.sender, reward, requiredAchievementType);
    }

    function submitWork(uint256 bountyId, string calldata proofURI) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "Unknown bounty");
        require(bounty.status == Status.Active, "Bounty not active");
        require(msg.sender != bounty.creator, "Creator cannot submit");
        require(!submissions[bountyId][msg.sender].exists, "Already submitted");
        require(bytes(proofURI).length > 0, "Missing proof URI");
        require(skillBadge.hasAchievementType(msg.sender, bounty.requiredAchievementType), "Required skill badge missing");
        submissions[bountyId][msg.sender] = Submission(proofURI, true, false, false);
        _submitters[bountyId].push(msg.sender);
        bounty.activeSubmissions++;
        emit WorkSubmitted(bountyId, msg.sender, proofURI);
    }

    /// @notice Creator or an authorized verifier can approve work. Payment is atomic with status update.
    function approveSubmission(uint256 bountyId, address student) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Active, "Bounty not active");
        require(msg.sender == bounty.creator || hasRole(VERIFIER_ROLE, msg.sender), "Not reviewer");
        Submission storage submission = submissions[bountyId][student];
        require(submission.exists && !submission.rejected && !submission.withdrawn, "No active submission");
        bounty.status = Status.Completed;
        bounty.winner = student;
        skillCoin.safeTransfer(student, bounty.reward);
        emit BountyCompleted(bountyId, student, bounty.reward);
    }

    function rejectSubmission(uint256 bountyId, address student) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Active, "Bounty not active");
        require(msg.sender == bounty.creator || hasRole(VERIFIER_ROLE, msg.sender), "Not reviewer");
        Submission storage submission = submissions[bountyId][student];
        require(submission.exists && !submission.rejected && !submission.withdrawn, "No active submission");
        submission.rejected = true;
        bounty.activeSubmissions--;
        emit SubmissionRejected(bountyId, student);
    }

    function withdrawSubmission(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == Status.Active, "Bounty not active");
        Submission storage submission = submissions[bountyId][msg.sender];
        require(submission.exists && !submission.rejected && !submission.withdrawn, "No active submission");
        submission.withdrawn = true;
        bounty.activeSubmissions--;
        emit SubmissionWithdrawn(bountyId, msg.sender);
    }

    function cancelBounty(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator");
        require(bounty.status == Status.Active, "Bounty not active");
        require(bounty.activeSubmissions == 0, "Resolve or withdraw submissions first");
        bounty.status = Status.Cancelled;
        skillCoin.safeTransfer(bounty.creator, bounty.reward);
        emit BountyCancelled(bountyId, bounty.creator, bounty.reward);
    }

    function getSubmissionCount(uint256 bountyId) external view returns (uint256) { return _submitters[bountyId].length; }
    function getSubmissionAt(uint256 bountyId, uint256 index) external view returns (address) { return _submitters[bountyId][index]; }

    function addVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(VERIFIER_ROLE, account); }
    function removeVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) { _revokeRole(VERIFIER_ROLE, account); }
}
