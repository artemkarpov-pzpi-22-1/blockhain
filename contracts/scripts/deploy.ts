import { ethers } from "hardhat";

/**
 * Деплой контракту CertificateRegistry.
 * Перший параметр конструктора — initialOwner (адреса власника OpenZeppelin Ownable).
 * Запуск: npx hardhat run scripts/deploy.ts --network localhost
 * (потрібен окремо запущений `npx hardhat node`, якщо мережа localhost).
 */
async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy(deployer.address);

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();

  console.log("CertificateRegistry deployed to:", contractAddress);
  console.log("Owner (initialOwner):", deployer.address);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
