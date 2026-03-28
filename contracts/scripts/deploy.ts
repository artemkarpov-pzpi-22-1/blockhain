import { ethers } from "hardhat";

// Розгортання контракту CertificateRegistry на обраній мережі (--network)
async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("CertificateRegistry");
  const registry = await factory.deploy();
  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("CertificateRegistry deployed to:", address);
  console.log("Deployer:", deployer.address);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});
