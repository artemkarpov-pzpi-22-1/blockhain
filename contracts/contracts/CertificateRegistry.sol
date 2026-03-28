// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Реєстр сертифікатів: у ланцюзі лише метадані (без файлу сертифіката)
contract CertificateRegistry is Ownable {
    struct Certificate {
        string certificateId;
        string ownerName;
        string courseName;
        string issueDate;
        bytes32 documentHash;
        address issuer;
        bool exists;
        bool revoked;
    }

    mapping(string => Certificate) private _certificates;
    mapping(address => bool) public authorizedIssuers;

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event CertificateRegistered(string indexed certificateId, address indexed issuer, bytes32 documentHash);
    event CertificateRevoked(string indexed certificateId, address indexed revokedBy);

    error EmptyCertificateId();
    error ZeroAddressIssuer();
    error NotOwnerOrAuthorizedIssuer();
    error CertificateAlreadyExists(string certificateId);
    error CertificateNotFound(string certificateId);
    error CertificateAlreadyRevoked(string certificateId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyOwnerOrAuthorizedIssuer() {
        if (msg.sender != owner() && !authorizedIssuers[msg.sender]) revert NotOwnerOrAuthorizedIssuer();
        _;
    }

    /// @notice Дозволити адресі випускати та відкликати сертифікати (лише власник контракту)
    function authorizeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddressIssuer();
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /// @notice Зняти повноваження емітента
    function revokeIssuerAuthorization(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    /// @notice Нова реєстрація; поле `issuer` у записі — адреса викликача (msg.sender)
    function registerCertificate(
        string calldata certificateId,
        string calldata ownerName,
        string calldata courseName,
        string calldata issueDate,
        bytes32 documentHash
    ) external onlyOwnerOrAuthorizedIssuer {
        if (bytes(certificateId).length == 0) revert EmptyCertificateId();
        if (_certificates[certificateId].exists) revert CertificateAlreadyExists(certificateId);

        _certificates[certificateId] = Certificate({
            certificateId: certificateId,
            ownerName: ownerName,
            courseName: courseName,
            issueDate: issueDate,
            documentHash: documentHash,
            issuer: msg.sender,
            exists: true,
            revoked: false
        });

        emit CertificateRegistered(certificateId, msg.sender, documentHash);
    }

    function getCertificate(string calldata certificateId) external view returns (Certificate memory) {
        if (!_certificates[certificateId].exists) revert CertificateNotFound(certificateId);
        return _certificates[certificateId];
    }

    /// @notice Перевірка: запис є, не відкликаний, hash збігається
    function verifyCertificateHash(string calldata certificateId, bytes32 documentHash)
        external
        view
        returns (bool)
    {
        Certificate memory c = _certificates[certificateId];
        if (!c.exists || c.revoked) return false;
        return c.documentHash == documentHash;
    }

    function revokeCertificate(string calldata certificateId) external onlyOwnerOrAuthorizedIssuer {
        Certificate storage c = _certificates[certificateId];
        if (!c.exists) revert CertificateNotFound(certificateId);
        if (c.revoked) revert CertificateAlreadyRevoked(certificateId);
        c.revoked = true;
        emit CertificateRevoked(certificateId, msg.sender);
    }
}
