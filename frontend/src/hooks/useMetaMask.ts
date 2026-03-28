import { BrowserProvider, type Signer } from "ethers";
import { useCallback, useState } from "react";

/** Мінімальний інтерфейс провайдера MetaMask (EIP-1193) без зайвих залежностей від типів ethers. */
type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type MetaMaskState = {
  account: string | null;
  error: string | null;
  connect: () => Promise<void>;
  getSigner: () => Promise<Signer>;
};

/**
 * Спрощений хук для MetaMask (ethers v6 BrowserProvider).
 * Для лабораторної роботи без зайвих абстракцій.
 */
export function useMetaMask(): MetaMaskState {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getSigner = useCallback(async (): Promise<Signer> => {
    const eth = window.ethereum as EthereumProvider | undefined;
    if (!eth) {
      throw new Error("MetaMask не виявлено");
    }
    const provider = new BrowserProvider(eth);
    return provider.getSigner();
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const eth = window.ethereum as EthereumProvider | undefined;
      if (!eth) {
        setError("Встановіть MetaMask");
        return;
      }
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(accounts[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка підключення гаманця");
    }
  }, []);

  return { account, error, connect, getSigner };
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
