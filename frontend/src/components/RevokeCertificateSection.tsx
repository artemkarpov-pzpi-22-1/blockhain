import type { FormEvent, JSX } from "react";
import { useState } from "react";
import { isContractConfigured } from "../config";
import type { MetaMaskState } from "../hooks/useMetaMask";
import { formatTxError, getRegistry } from "../services/blockchain";

export type RevokeCertificateSectionProps = {
  metaMask: MetaMaskState;
};

/**
 * Відкликання сертифіката. У контракті дозволено лише owner або authorized issuer.
 */
export function RevokeCertificateSection({ metaMask }: RevokeCertificateSectionProps): JSX.Element {
  const [certificateId, setCertificateId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    isContractConfigured() &&
    metaMask.hasEthereum &&
    Boolean(metaMask.account) &&
    metaMask.isCorrectNetwork &&
    !busy;

  async function onRevoke(e: FormEvent): Promise<void> {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!canSubmit) {
      setError("Підключіть гаманець і перемкніть мережу. Дія дозволена лише акаунту owner або authorized issuer.");
      return;
    }
    const id = certificateId.trim();
    if (!id) {
      setError("Введіть certificateId.");
      return;
    }
    setBusy(true);
    try {
      const signer = await metaMask.getSigner();
      const registry = getRegistry(signer);
      const tx = await registry.revokeCertificate(id);
      setMessage(`Транзакція: ${tx.hash}`);
      await tx.wait();
      setMessage(`Сертифікат відкликано. Tx: ${tx.hash}`);
      setCertificateId("");
    } catch (err) {
      setError(formatTxError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!isContractConfigured()) {
    return (
      <section className="card">
        <h2 className="section-title">Revoke Certificate</h2>
        <p className="msg msg-error">Налаштуйте .env</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Revoke Certificate</h2>
      <p className="hint">
        Виклик <code>revokeCertificate</code>. Доступно лише для <strong>власника контракту</strong> або{" "}
        <strong>authorized issuer</strong> (див. <code>authorizeIssuer</code> у контракті). Інакше транзакція
        буде відхилена.
      </p>

      <form onSubmit={(e) => void onRevoke(e)} className="form row-form">
        <label className="field grow">
          <span>certificateId</span>
          <input value={certificateId} onChange={(e) => setCertificateId(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-danger" disabled={!canSubmit}>
          {busy ? "…" : "revokeCertificate"}
        </button>
      </form>

      {message && (
        <p className="msg msg-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="msg msg-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
