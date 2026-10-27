// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice SkillChain's in-app test token. Amounts use standard ERC-20 18 decimals.
contract SkillCoin is ERC20, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    constructor(address admin) ERC20("SkillCoin", "SKC") {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    /// @dev `amount` is in the smallest ERC-20 units; use ethers.parseUnits("150", 18).
    function mint(address to, uint256 amount) external onlyRole(VERIFIER_ROLE) {
        _mint(to, amount);
    }

    function addVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, account);
    }

    function removeVerifier(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, account);
    }
}
