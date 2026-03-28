import type { JSX } from "react";
import type { MetaMaskState } from "../hooks/useMetaMask";

export type WalletBarProps = {
  metaMask: MetaMaskState;
};

/** Кнопка підключення гаманця (каркас). */
export function WalletBar({ metaMask }: WalletBarProps): JSX.Element {
  return (
    <section>
      <button type="button" onClick={() => void metaMask.connect()}>
        Підключити MetaMask
      </button>
      {metaMask.account && <p>Адреса: {metaMask.account}</p>}
      {metaMask.error && <p role="alert">{metaMask.error}</p>}
    </section>
  );
}
