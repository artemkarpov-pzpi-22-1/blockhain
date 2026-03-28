// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Навчальний реєстр сертифікатів: у ланцюзі лише метадані, без файлу
contract CertificateRegistry {
    enum CertificateStatus {
        Active,
        Revoked
    }

    struct Certificate {
        string certificateId;
        string ownerName;
        string courseName;
        uint256 issueDate;
        bytes32 documentHash;
        string issuer;
        CertificateStatus status;
        address registeredBy;
    }

    mapping(string => Certificate) private _certificates;

    event CertificateRegistered(
        string indexed certificateId,
        bytes32 documentHash,
        address indexed registeredBy
    );

    event CertificateRevoked(string indexed certificateId, address indexed revokedBy);

    error CertificateAlreadyExists(string certificateId);
    error CertificateNotFound(string certificateId);
    error CertificateNotActive(string certificateId);
    error UnauthorizedRevoke(string certificateId, address caller);
    error EmptyCertificateId();

    /// @notice Реєстрація нового сертифіката (статус Active)
    function registerCertificate(
        string calldata certificateId,
        string calldata ownerName,
        string calldata courseName,
        uint256 issueDate,
        bytes32 documentHash,
        string calldata issuer
    ) external {
        if (bytes(certificateId).length == 0) revert EmptyCertificateId();
        if (_isStored(certificateId)) revert CertificateAlreadyExists(certificateId);

        _certificates[certificateId] = Certificate({
            certificateId: certificateId,
            ownerName: ownerName,
            courseName: courseName,
            issueDate: issueDate,
            documentHash: documentHash,
            issuer: issuer,
            status: CertificateStatus.Active,
            registeredBy: msg.sender
        });

        emit CertificateRegistered(certificateId, documentHash, msg.sender);
    }

    /// @notice Відкликання (тільки той, хто зареєстрував запис у контракті)
    function revokeCertificate(string calldata certificateId) external {
        if (!_isStored(certificateId)) revert CertificateNotFound(certificateId);

        Certificate storage cert = _certificates[certificateId];
        if (cert.status != CertificateStatus.Active) revert CertificateNotActive(certificateId);
        if (cert.registeredBy != msg.sender) revert UnauthorizedRevoke(certificateId, msg.sender);

        cert.status = CertificateStatus.Revoked;
        emit CertificateRevoked(certificateId, msg.sender);
    }

    /// @notice Повертає поля сертифіката за id; якщо запису немає — помилка CertificateNotFound
    function getCertificate(string calldata certificateId)
        external
        view
        returns (
            string memory ownerName,
            string memory courseName,
            uint256 issueDate,
            bytes32 documentHash,
            string memory issuer,
            CertificateStatus status,
            address registeredBy
        )
    {
        if (!_isStored(certificateId)) revert CertificateNotFound(certificateId);
        Certificate storage c = _certificates[certificateId];
        return (
            c.ownerName,
            c.courseName,
            c.issueDate,
            c.documentHash,
            c.issuer,
            c.status,
            c.registeredBy
        );
    }

    /// @notice Перевірка існування id
    function certificateExists(string calldata certificateId) external view returns (bool) {
        return _isStored(certificateId);
    }

    /// @notice Перевірка: існує id і статус Active
    function verifyById(string calldata certificateId) external view returns (bool) {
        if (!_isStored(certificateId)) return false;
        return _certificates[certificateId].status == CertificateStatus.Active;
    }

    /// @notice Перевірка: Active і hash збігається зі збереженим
    function verifyByIdAndHash(string calldata certificateId, bytes32 documentHash)
        external
        view
        returns (bool)
    {
        if (!_isStored(certificateId)) return false;
        Certificate storage c = _certificates[certificateId];
        return c.status == CertificateStatus.Active && c.documentHash == documentHash;
    }

    /// @dev Перевірка наявності запису: після реєстрації registeredBy завжди ненульова адреса
    function _isStored(string calldata certificateId) private view returns (bool) {
        return _certificates[certificateId].registeredBy != address(0);
    }
}
