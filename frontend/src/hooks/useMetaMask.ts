import { BrowserProvider, type Contract, type Signer } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getExpectedChainId } from "../config";
import { getRegistryReadOnly } from "../services/blockchain";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type ConnectionStatus =
  | "no_wallet"
  | "disconnected"
  | "connecting"
  | "connected_ok"
  | "wrong_network";

export type MetaMaskState = {
  hasEthereum: boolean;
  account: string | null;
  chainId: number | null;
  expectedChainId: number;
  isCorrectNetwork: boolean;
  status: ConnectionStatus;
  statusMessage: string;
  error: string | null;
  connect: () => Promise<void>;
  switchToHardhatLocal: () => Promise<void>;
  getSigner: () => Promise<Signer>;
  getReadOnlyRegistry: () => Contract;
};

function getEth(): EthereumProvider | undefined {
  return window.ethereum as EthereumProvider | undefined;
}

/**
 * Підключення MetaMask, перевірка мережі (очікується Hardhat local за замовчуванням).
 */
export function useMetaMask(): MetaMaskState {
  const expectedChainId = useMemo(() => getExpectedChainId(), []);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const hasEthereum = typeof window !== "undefined" && Boolean(getEth());
  const isCorrectNetwork = chainId !== null && chainId === expectedChainId;

  const refreshNetwork = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      setChainId(null);
      return;
    }
    const provider = new BrowserProvider(eth);
    const net = await provider.getNetwork();
    setChainId(Number(net.chainId));
  }, []);

  const refreshAccounts = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      setAccount(null);
      return;
    }
    const provider = new BrowserProvider(eth);
    const accounts = (await provider.send("eth_accounts", [])) as string[];
    setAccount(accounts[0] ?? null);
  }, []);

  useEffect(() => {
    const eth = getEth();
    if (!eth?.on || !eth.removeListener) {
      return;
    }
    const onChainChanged = (): void => {
      window.location.reload();
    };
    const onAccountsChanged = (accs: unknown): void => {
      if (Array.isArray(accs) && typeof accs[0] === "string") {
        setAccount(accs[0]);
      } else {
        setAccount(null);
      }
    };
    eth.on("chainChanged", onChainChanged);
    eth.on("accountsChanged", onAccountsChanged as (...args: unknown[]) => void);
    return () => {
      eth.removeListener?.("chainChanged", onChainChanged);
      eth.removeListener?.("accountsChanged", onAccountsChanged as (...args: unknown[]) => void);
    };
  }, []);

  useEffect(() => {
    if (!hasEthereum) {
      return;
    }
    void refreshNetwork();
    void refreshAccounts();
  }, [hasEthereum, refreshNetwork, refreshAccounts]);

  const connect = useCallback(async () => {
    setError(null);
    const eth = getEth();
    if (!eth) {
      setError("Встановіть MetaMask.");
      return;
    }
    setIsConnecting(true);
    try {
      await eth.request({ method: "eth_requestAccounts" });
      await refreshAccounts();
      await refreshNetwork();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка підключення гаманця");
    } finally {
      setIsConnecting(false);
    }
  }, [refreshAccounts, refreshNetwork]);

  const switchToHardhatLocal = useCallback(async () => {
    setError(null);
    const eth = getEth();
    if (!eth) {
      setError("MetaMask недоступний.");
      return;
    }
    const chainIdHex = `0x${expectedChainId.toString(16)}`;
    const addParams = [
      {
        chainId: chainIdHex,
        chainName: "Hardhat / Localhost",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["http://127.0.0.1:8545"],
      },
    ];
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (e: unknown) {
      const code = typeof e === "object" && e !== null && "code" in e ? (e as { code: number }).code : null;
      if (code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: addParams,
        });
      } else {
        setError(e instanceof Error ? e.message : "Не вдалося перемкнути мережу");
      }
    }
    await refreshNetwork();
  }, [expectedChainId, refreshNetwork]);

  const getSigner = useCallback(async (): Promise<Signer> => {
    const eth = getEth();
    if (!eth) {
      throw new Error("MetaMask не виявлено");
    }
    const provider = new BrowserProvider(eth);
    return provider.getSigner();
  }, []);

  const getReadOnlyRegistry = useCallback((): Contract => {
    const eth = getEth();
    if (!eth) {
      throw new Error("MetaMask не виявлено");
    }
    return getRegistryReadOnly(new BrowserProvider(eth));
  }, []);

  let status: ConnectionStatus;
  if (!hasEthereum) {
    status = "no_wallet";
  } else if (isConnecting) {
    status = "connecting";
  } else if (!account) {
    status = "disconnected";
  } else if (!isCorrectNetwork) {
    status = "wrong_network";
  } else {
    status = "connected_ok";
  }

  const statusMessage = useMemo(() => {
    switch (status) {
      case "no_wallet":
        return "Розширення MetaMask не виявлено (немає window.ethereum).";
      case "connecting":
        return "Підключення…";
      case "disconnected":
        return "Гаманець не підключено.";
      case "wrong_network":
        return `Потрібна мережа з chainId ${expectedChainId} (локальний Hardhat). Зараз: ${chainId ?? "невідомо"}.`;
      case "connected_ok":
        return `Підключено. Мережа: chainId ${chainId}. Акаунт обрано.`;
      default:
        return "";
    }
  }, [status, expectedChainId, chainId]);

  return {
    hasEthereum,
    account,
    chainId,
    expectedChainId,
    isCorrectNetwork,
    status,
    statusMessage,
    error,
    connect,
    switchToHardhatLocal,
    getSigner,
    getReadOnlyRegistry,
  };
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
