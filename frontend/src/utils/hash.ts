import { ethers } from "ethers";

/** Навчальний commitment для documentHash у контракті. */
export function hashUtf8(text: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(text));
}
