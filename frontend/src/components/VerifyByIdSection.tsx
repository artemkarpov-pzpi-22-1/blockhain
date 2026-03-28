import type { FormEvent, JSX } from "react";
import { useState } from "react";
import { isContractConfigured } from "../config";
import type { MetaMaskState } from "../hooks/useMetaMask";
import { tryFetchCertificate } from "../services/blockchain";
import type { CertificateStruct } from "../services/contractTypes";

export type VerifyByIdSectionProps = {
  metaMask: MetaMaskState;
};

function CertificateDetails({ c }: { c: CertificateStruct }): JSX.Element {
  return (
    <ul className="detail-list">
      <li>
        <strong>certificateId:</strong> <span className="mono">{c.certificateId}</span>
      </li>
      <li>
        <strong>ownerName:</strong> {c.ownerName}
      </li>
      <li>
        <strong>courseName:</strong> {c.courseName}
      </li>
      <li>
        <strong>issueDate:</strong> {c.issueDate}
      </li>
      <li>
        <strong>documentHash:</strong> <span className="mono">{c.documentHash}</span>
      </li>
      <li>
        <strong>issuer:</strong> <span className="mono">{c.issuer}</span>
      </li>
      <li>
        <strong>exists:</strong> {String(c.exists)}
      </li>
      <li>
        <strong>revoked:</strong> {String(c.revoked)}
      </li>
    </ul>
  );
}

/** Читання запису через getCertificate (view, без підпису). */
export function VerifyByIdSection({ metaMask }: VerifyByIdSectionProps): JSX.Element {
  const [certificateId, setCertificateId] = useState("");
  const [result, setResult] = useState<CertificateStruct | null | "notfound">(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canQuery =
    isContractConfigured() && metaMask.hasEthereum && metaMask.isCorrectNetwork && !busy;

  async function onSearch(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setResult(null);
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
    setBusy(true);
    try {
      const registry = metaMask.getReadOnlyRegistry();
      const cert = await tryFetchCertificate(registry, id);
      if (!cert) {
        setResult("notfound");
      } else {
        setResult(cert);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!isContractConfigured()) {
    return (
      <section className="card">
        <h2 className="section-title">Verify by ID</h2>
        <p className="msg msg-error">Налаштуйте .env</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Verify by ID</h2>
      <p className="hint">Виклик <code>getCertificate(certificateId)</code> — лише читання з ланцюга.</p>

      <form onSubmit={(e) => void onSearch(e)} className="form row-form">
        <label className="field grow">
          <span>certificateId</span>
          <input value={certificateId} onChange={(e) => setCertificateId(e.target.value)} required />
        </label>
        <button type="submit" className="btn" disabled={!canQuery}>
          {busy ? "…" : "Отримати"}
        </button>
      </form>

      {result === "notfound" && <p className="msg msg-warn">Сертифікат не знайдено (немає запису з таким id).</p>}
      {result && result !== "notfound" && <CertificateDetails c={result} />}
      {error && (
        <p className="msg msg-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
