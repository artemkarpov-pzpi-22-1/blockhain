import { Contract, type InterfaceAbi, type Signer } from "ethers";
import artifact from "../abi/CertificateRegistry.json";
import { getContractAddress } from "../config";
import type { CertificateStruct } from "./contractTypes";

/** Артефакт Hardhat (ABI + bytecode); для викликів потрібен лише `abi`. */
type HardhatArtifact = {
  abi: InterfaceAbi;
};

const { abi } = artifact as HardhatArtifact;

export function getRegistry(signer: Signer): Contract {
  return new Contract(getContractAddress(), abi, signer);
}

/** Зчитати сертифікат і привести до зручного для UI типу. */
export async function fetchCertificate(
  registry: Contract,
  certificateId: string
): Promise<CertificateStruct> {
  const row = await registry.getCertificate(certificateId);
  return {
    certificateId: row.certificateId,
    ownerName: row.ownerName,
    courseName: row.courseName,
    issueDate: row.issueDate,
    documentHash: row.documentHash,
    issuer: row.issuer,
    exists: row.exists,
    revoked: row.revoked,
  };
}
