import { expect } from "chai";
import { ethers } from "hardhat";

describe("CertificateRegistry", function () {
  const certificateId = "LAB-2026-001";
  const ownerName = "Іван Петренко";
  const courseName = "Децентралізовані системи";
  const issueDate = 1711731600;
  const issuer = "Університет";

  async function docHash(value: string = "commitment"): Promise<string> {
    return ethers.keccak256(ethers.toUtf8Bytes(value));
  }

  it("реєструє сертифікат зі статусом Active", async function () {
    const [alice] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    const hash = await docHash();

    await expect(registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash, issuer))
      .to.emit(registry, "CertificateRegistered")
      .withArgs(certificateId, hash, alice.address);

    const v = await registry.verifyById(certificateId);
    expect(v).to.equal(true);

    const cert = await registry.getCertificate(certificateId);
    expect(cert.ownerName).to.equal(ownerName);
    expect(cert.courseName).to.equal(courseName);
    expect(cert.issueDate).to.equal(issueDate);
    expect(cert.documentHash).to.equal(hash);
    expect(cert.issuer).to.equal(issuer);
    expect(cert.status).to.equal(0n);
    expect(cert.registeredBy).to.equal(alice.address);
  });

  it("не дозволяє подвійну реєстрацію того ж certificateId", async function () {
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    const hash = await docHash();

    await registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash, issuer);
    await expect(
      registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash, issuer)
    ).to.be.revertedWithCustomError(registry, "CertificateAlreadyExists");
  });

  it("відкликає сертифікат і verifyById повертає false", async function () {
    const [alice] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    const hash = await docHash();

    await registry.registerCertificate(certificateId, ownerName, courseName, issueDate, hash, issuer);

    await expect(registry.revokeCertificate(certificateId))
      .to.emit(registry, "CertificateRevoked")
      .withArgs(certificateId, alice.address);

    expect(await registry.verifyById(certificateId)).to.equal(false);

    const cert = await registry.getCertificate(certificateId);
    expect(cert.status).to.equal(1n);
  });

  it("verifyByIdAndHash: істина лише за збігу hash і статусу Active", async function () {
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    const h1 = await docHash("doc-a");
    const h2 = await docHash("doc-b");

    await registry.registerCertificate(certificateId, ownerName, courseName, issueDate, h1, issuer);

    expect(await registry.verifyByIdAndHash(certificateId, h1)).to.equal(true);
    expect(await registry.verifyByIdAndHash(certificateId, h2)).to.equal(false);
  });

  it("відхиляє відкликання сертифіката чужим обліковим записом", async function () {
    const [alice, bob] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    const hash = await docHash();

    await registry.connect(alice).registerCertificate(certificateId, ownerName, courseName, issueDate, hash, issuer);

    await expect(registry.connect(bob).revokeCertificate(certificateId)).to.be.revertedWithCustomError(
      registry,
      "UnauthorizedRevoke"
    );
  });

  it("відхиляє реєстрацію з порожнім certificateId", async function () {
    const Registry = await ethers.getContractFactory("CertificateRegistry");
    const registry = await Registry.deploy();
    const hash = await docHash();

    await expect(
      registry.registerCertificate("", ownerName, courseName, issueDate, hash, issuer)
    ).to.be.revertedWithCustomError(registry, "EmptyCertificateId");
  });
});
