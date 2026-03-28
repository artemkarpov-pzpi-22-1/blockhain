/** Адреса розгорнутого CertificateRegistry (з .env). */
export function getContractAddress(): string {
  const addr = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error("Вкажіть коректний VITE_CONTRACT_ADDRESS у файлі .env");
  }
  return addr;
}
