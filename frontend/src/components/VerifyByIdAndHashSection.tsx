import type { FormEvent, JSX } from "react";
import { useState } from "react";
import { isContractConfigured } from "../config";
import type { MetaMaskState } from "../hooks/useMetaMask";
import { tryFetchCertificate } from "../services/blockchain";
import { hashUtf8 } from "../utils/hash";

export type VerifyByIdAndHashSectionProps = {
  metaMask: MetaMaskState;
};

type VerifyOutcome =
  | null
  | { kind: "notfound" }
  | { kind: "revoked" }
  | { kind: "result"; passed: boolean };

/** Перевірка commitment: verifyCertificateHash + окремі повідомлення для не знайдено / відкликано. */
export function VerifyByIdAndHashSection({ metaMask }: VerifyByIdAndHashSectionProps): JSX.Element {
  const [certificateId, setCertificateId] = useState("");
  const [rawDocumentText, setRawDocumentText] = useState("");
  const [outcome, setOutcome] = useState<VerifyOutcome>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canQuery =
    isContractConfigured() && metaMask.hasEthereum && metaMask.isCorrectNetwork && !busy;

  async function onVerify(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setOutcome(null);
    setComputedHash(null);

    if (!isContractConfigured()) {
      setError("Немає адреси контракту в .env");
      return;
    }
    if (!metaMask.hasEthereum || !metaMask.isCorrectNetwork) {
      setError("Підключіть гаманець і оберіть потрібну мережу.");
      return;
    }

    const id = certificateId.trim();
    if (!id) {
      setError("Введіть certificateId.");
      return;
    }

    const localHash = hashUtf8(rawDocumentText);
    setComputedHash(localHash);
    setBusy(true);

    try {
      const registry = metaMask.getReadOnlyRegistry();
      const cert = await tryFetchCertificate(registry, id);

      if (!cert || !cert.exists) {
        setOutcome({ kind: "notfound" });
        return;
      }
      if (cert.revoked) {
        setOutcome({ kind: "revoked" });
        return;
      }

      const ok = (await registry.verifyCertificateHash(id, localHash)) as boolean;
      setOutcome({ kind: "result", passed: Boolean(ok) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!isContractConfigured()) {
    return (
      <section className="card">
        <h2 className="section-title">Verify by ID + Hash</h2>
        <p className="msg msg-error">Налаштуйте .env</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Verify by ID + Hash</h2>
      <p className="hint">
        Локальний хеш від <code>rawDocumentText</code> порівнюється через <code>verifyCertificateHash</code>.
      </p>

      <form onSubmit={(e) => void onVerify(e)} className="form">
        <label className="field">
          <span>certificateId</span>
          <input value={certificateId} onChange={(e) => setCertificateId(e.target.value)} required />
        </label>
        <label className="field">
          <span>rawDocumentText</span>
          <textarea
            value={rawDocumentText}
            onChange={(e) => setRawDocumentText(e.target.value)}
            required
            rows={4}
          />
        </label>
        <button type="submit" className="btn" disabled={!canQuery}>
          {busy ? "…" : "Перевірити"}
        </button>
      </form>

      {computedHash && (
        <p className="mono small">
          Обчислений documentHash: <strong>{computedHash}</strong>
        </p>
      )}

      {outcome?.kind === "notfound" && (
        <p className="msg msg-warn">Сертифікат не знайдено або не існує.</p>
      )}
      {outcome?.kind === "revoked" && (
        <p className="msg msg-error">Сертифікат відкликаний (revoked). Верифікація недоступна.</p>
      )}
      {outcome?.kind === "result" && outcome.passed && (
        <p className="msg msg-success" role="status">
          Verification passed: хеш збігається, запис активний.
        </p>
      )}
      {outcome?.kind === "result" && !outcome.passed && (
        <p className="msg msg-error" role="status">
          Verification failed: хеш не збігається або запис неактивний.
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
