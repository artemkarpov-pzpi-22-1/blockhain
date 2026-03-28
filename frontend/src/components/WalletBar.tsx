import type { JSX } from "react";
import type { MetaMaskState } from "../hooks/useMetaMask";
import { isContractConfigured } from "../config";

export type WalletBarProps = {
  metaMask: MetaMaskState;
};

/** Підключення MetaMask, відображення акаунту, мережі та помилок. */
export function WalletBar({ metaMask }: WalletBarProps): JSX.Element {
  const contractOk = isContractConfigured();

  return (
    <section className="card">
      <h2 className="section-title">Connect Wallet</h2>

      {!contractOk && (
        <p className="msg msg-error" role="alert">
          Додайте у файл <code>.env</code> валідну адресу контракту <code>VITE_CONTRACT_ADDRESS</code> після
          деплою з каталогу <code>contracts</code>.
        </p>
      )}

      {!metaMask.hasEthereum && (
        <p className="msg msg-error" role="alert">
          Розширення MetaMask не знайдено (немає <code>window.ethereum</code>).
        </p>
      )}

      <p className="msg msg-info">
        <strong>Статус:</strong> {metaMask.statusMessage}
      </p>

      {metaMask.account && (
        <p className="mono">
          <strong>Поточний акаунт:</strong> {metaMask.account}
        </p>
      )}

      {metaMask.error && (
        <p className="msg msg-error" role="alert">
          {metaMask.error}
        </p>
      )}

      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void metaMask.connect()} disabled={!metaMask.hasEthereum}>
          Підключити MetaMask
        </button>
        {(metaMask.status === "wrong_network" || (metaMask.account && !metaMask.isCorrectNetwork)) && (
          <button type="button" className="btn btn-secondary" onClick={() => void metaMask.switchToHardhatLocal()}>
            Перемкнути на Hardhat Local (chainId {metaMask.expectedChainId})
          </button>
        )}
      </div>
    </section>
  );
}
