/** Очікуваний chainId для локальної мережі Hardhat за замовчуванням. */
export const DEFAULT_HARDHAT_CHAIN_ID = 31337;

/** Адреса розгорнутого CertificateRegistry (`frontend/.env` → Vite). */
export function getContractAddress(): string {
  const addr = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error(
      "Невірна або порожня VITE_CONTRACT_ADDRESS. Скопіюйте .env.example у .env і вставте адресу після deploy."
    );
  }
  return addr;
}

export function isContractConfigured(): boolean {
  const addr = import.meta.env.VITE_CONTRACT_ADDRESS;
  return Boolean(addr && /^0x[a-fA-F0-9]{40}$/.test(addr));
}

/** ChainId цільової мережі (localhost Hardhat = 31337), можна перевизначити в .env. */
export function getExpectedChainId(): number {
  const raw = import.meta.env.VITE_CHAIN_ID;
  if (raw === undefined || raw === "") {
    return DEFAULT_HARDHAT_CHAIN_ID;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return DEFAULT_HARDHAT_CHAIN_ID;
  }
  return n;
}
