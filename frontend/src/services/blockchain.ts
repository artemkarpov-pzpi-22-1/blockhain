import { Contract, type InterfaceAbi, type Provider, type Signer } from "ethers";
import artifact from "../abi/CertificateRegistry.json";
import { getContractAddress } from "../config";
import type { CertificateStruct } from "./contractTypes";

type HardhatArtifact = {
  abi: InterfaceAbi;
};

const { abi } = artifact as HardhatArtifact;

export function getRegistry(signer: Signer): Contract {
  return new Contract(getContractAddress(), abi, signer);
}

export function getRegistryReadOnly(provider: Provider): Contract {
  return new Contract(getContractAddress(), abi, provider);
}

export async function fetchCertificate(
  registry: Contract,
  certificateId: string
): Promise<CertificateStruct> {
  const row = await registry.getCertificate(certificateId);
  return normalizeCertificate(row);
}

/** Повертає null, якщо контракт кидає помилку (запис не знайдено). */
export async function tryFetchCertificate(
  registry: Contract,
  certificateId: string
): Promise<CertificateStruct | null> {
  try {
    return await fetchCertificate(registry, certificateId);
  } catch {
    return null;
  }
}

function normalizeCertificate(row: {
  certificateId: string;
  ownerName: string;
  courseName: string;
  issueDate: string;
  documentHash: string;
  issuer: string;
  exists: boolean;
  revoked: boolean;
}): CertificateStruct {
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

/** Коротке повідомлення для користувача з revert / RPC. */
export function formatTxError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}
