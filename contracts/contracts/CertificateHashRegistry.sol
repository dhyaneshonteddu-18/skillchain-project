// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Records certificate file hashes that a trusted issuer/admin has manually authenticated.
/// @dev A matching hash proves byte-for-byte integrity against the registered file, not real-world identity on its own.
contract CertificateHashRegistry is AccessControl {
    struct CertificateRecord { bool issued; string issuer; uint64 registeredAt; }
    mapping(bytes32 => CertificateRecord) private _records;
    event CertificateHashRegistered(bytes32 indexed certificateHash, string issuer, address indexed registrar);

    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerCertificate(bytes32 certificateHash, string calldata issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(certificateHash != bytes32(0), "Empty hash");
        require(bytes(issuer).length > 0, "Missing issuer");
        require(!_records[certificateHash].issued, "Hash already registered");
        _records[certificateHash] = CertificateRecord(true, issuer, uint64(block.timestamp));
        emit CertificateHashRegistered(certificateHash, issuer, msg.sender);
    }

    function verifyCertificate(bytes32 certificateHash) external view returns (bool) {
        return _records[certificateHash].issued;
    }

    function getCertificateRecord(bytes32 certificateHash) external view returns (bool issued, string memory issuer, uint64 registeredAt) {
        CertificateRecord memory record = _records[certificateHash];
        return (record.issued, record.issuer, record.registeredAt);
    }
}
