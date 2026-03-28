/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS?: string;
  /** Локальна мережа Hardhat: 31337; для інших тестнетів — своє значення. */
  readonly VITE_CHAIN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
