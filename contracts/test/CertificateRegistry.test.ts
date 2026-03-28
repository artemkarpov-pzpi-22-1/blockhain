import { expect } from "chai";
import { ethers } from "hardhat";
import type { CertificateRegistry } from "../typechain-types";

/**
 * Тести реєстру CertificateRegistry (Hardhat + ethers v6).
 * Перевіряються ролі owner / authorized issuer, реєстрація, відкликання та verifyCertificateHash.
 */
describe("CertificateRegistry", function () {
  const certificateId = "LAB-2026-001";
  const ownerName = "Іван Петренко";
  const courseName = "Децентралізовані системи";
  const issueDate = "2026-03-28";

  /** Хеш «документа» поза ланцюгом (навчальний commitment). */
  async function documentHash(bytes: string = "commitment"): Promise<string> {
    return ethers.keccak256(ethers.toUtf8Bytes(bytes));
  }

  async function deployRegistry(ownerAddress: string): Promise<CertificateRegistry> {
    const Factory = await ethers.getContractFactory("CertificateRegistry");
    return Factory.deploy(ownerAddress);
  }

  describe("реєстрація та доступ", function () {
    it("власник контракту може зареєструвати сертифікат без authorizeIssuer", async function () {
      const [owner] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await expect(registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash))
        .to.emit(registry, "CertificateRegistered")
        .withArgs(certificateId, owner.address, hash);

      expect(await registry.verifyCertificateHash(certificateId, hash)).to.equal(true);

      const cert = await registry.getCertificate(certificateId);
      expect(cert.certificateId).to.equal(certificateId);
      expect(cert.ownerName).to.equal(ownerName);
      expect(cert.courseName).to.equal(courseName);
      expect(cert.issueDate).to.equal(issueDate);
      expect(cert.documentHash).to.equal(hash);
      expect(cert.issuer).to.equal(owner.address);
      expect(cert.exists).to.equal(true);
      expect(cert.revoked).to.equal(false);
    });

    it("authorized issuer реєструє; сторонній акаунт — ні", async function () {
      const [owner, issuer, stranger] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await expect(registry.connect(owner).authorizeIssuer(issuer.address))
        .to.emit(registry, "IssuerAuthorized")
        .withArgs(issuer.address);

      await expect(
        registry.connect(issuer).registerCertificate(certificateId, ownerName, courseName, issueDate, hash)
      ).to.emit(registry, "CertificateRegistered");

      await expect(
        registry.connect(stranger).registerCertificate("OTHER-1", ownerName, courseName, issueDate, hash)
      ).to.be.revertedWithCustomError(registry, "NotOwnerOrAuthorizedIssuer");
    });

    it("не дозволяє повторну реєстрацію того ж certificateId", async function () {
      const [owner] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash);
      await expect(
        registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash)
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyExists");
    });

    it("відхиляє реєстрацію з порожнім certificateId", async function () {
      const [owner] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await expect(
        registry.registerCertificate("", ownerName, courseName, issueDate, hash)
      ).to.be.revertedWithCustomError(registry, "EmptyCertificateId");
    });
  });

  describe("верифікація хеша", function () {
    it("verifyCertificateHash повертає false, якщо хеш не збігається", async function () {
      const [owner] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const stored = await documentHash("doc-a");
      const other = await documentHash("doc-b");

      await registry.registerCertificate(certificateId, ownerName, courseName, issueDate, stored);

      expect(await registry.verifyCertificateHash(certificateId, stored)).to.equal(true);
      expect(await registry.verifyCertificateHash(certificateId, other)).to.equal(false);
    });
  });

  describe("відкликання сертифіката", function () {
    it("після revokeCertificate verifyCertificateHash стає false", async function () {
      const [owner, issuer] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await registry.connect(owner).authorizeIssuer(issuer.address);
      await registry.connect(issuer).registerCertificate(certificateId, ownerName, courseName, issueDate, hash);

      expect(await registry.verifyCertificateHash(certificateId, hash)).to.equal(true);

      await expect(registry.connect(issuer).revokeCertificate(certificateId))
        .to.emit(registry, "CertificateRevoked")
        .withArgs(certificateId, issuer.address);

      expect(await registry.verifyCertificateHash(certificateId, hash)).to.equal(false);
      const cert = await registry.getCertificate(certificateId);
      expect(cert.revoked).to.equal(true);
    });

    it("сторонній не може відкликати сертифікат", async function () {
      const [owner, issuer, stranger] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await registry.connect(owner).authorizeIssuer(issuer.address);
      await registry.connect(issuer).registerCertificate(certificateId, ownerName, courseName, issueDate, hash);

      await expect(registry.connect(stranger).revokeCertificate(certificateId)).to.be.revertedWithCustomError(
        registry,
        "NotOwnerOrAuthorizedIssuer"
      );
    });
  });

  describe("керування емітентами", function () {
    it("revokeIssuerAuthorization забирає право реєстрації", async function () {
      const [owner, issuer] = await ethers.getSigners();
      const registry = await deployRegistry(owner.address);
      const hash = await documentHash();

      await registry.connect(owner).authorizeIssuer(issuer.address);
      await expect(registry.connect(owner).revokeIssuerAuthorization(issuer.address))
        .to.emit(registry, "IssuerRevoked")
        .withArgs(issuer.address);

      await expect(
        registry.connect(issuer).registerCertificate(certificateId, ownerName, courseName, issueDate, hash)
      ).to.be.revertedWithCustomError(registry, "NotOwnerOrAuthorizedIssuer");
    });
  });
});
