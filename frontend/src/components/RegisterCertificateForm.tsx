import type { FormEvent, JSX } from "react";
import { useState } from "react";
import { isContractConfigured } from "../config";
import type { MetaMaskState } from "../hooks/useMetaMask";
import { formatTxError, getRegistry } from "../services/blockchain";
import { hashUtf8 } from "../utils/hash";

export type RegisterCertificateFormProps = {
  metaMask: MetaMaskState;
};

const initial = {
  certificateId: "",
  ownerName: "",
  courseName: "",
  issueDate: "",
  rawDocumentText: "",
};

/** Реєстрація сертифіката: documentHash = keccak256(raw UTF-8 текст). */
export function RegisterCertificateForm({ metaMask }: RegisterCertificateFormProps): JSX.Element {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<string | null>(null);

  const canSubmit =
    isContractConfigured() &&
    metaMask.hasEthereum &&
    Boolean(metaMask.account) &&
    metaMask.isCorrectNetwork &&
    !busy;

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!canSubmit) {
      setError("Підключіть гаманець і перемкніть на потрібну мережу.");
      return;
    }
    const documentHash = hashUtf8(form.rawDocumentText);
    setBusy(true);
    try {
      const signer = await metaMask.getSigner();
      const registry = getRegistry(signer);
      const tx = await registry.registerCertificate(
        form.certificateId.trim(),
        form.ownerName.trim(),
        form.courseName.trim(),
        form.issueDate.trim(),
        documentHash
      );
      setMessage(`Транзакція надіслана… hash: ${tx.hash}`);
      const receipt = await tx.wait();
      setLastHash(documentHash);
      setMessage(`Успішно зареєстровано. Блок: ${receipt?.blockNumber ?? "—"}. Tx: ${tx.hash}`);
      setForm(initial);
    } catch (err) {
      setError(formatTxError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!isContractConfigured()) {
    return (
      <section className="card">
        <h2 className="section-title">Register Certificate</h2>
        <p className="msg msg-error">Спочатку налаштуйте адресу контракту в .env</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Register Certificate</h2>
      <p className="hint">Поле «текст документа» хешується локально (UTF-8) → <code>bytes32</code> в контракті.</p>

      <form onSubmit={(e) => void onSubmit(e)} className="form">
        <label className="field">
          <span>certificateId</span>
          <input
            value={form.certificateId}
            onChange={(e) => setForm((f) => ({ ...f, certificateId: e.target.value }))}
            required
            placeholder="Напр. LAB-CERT-001"
          />
        </label>
        <label className="field">
          <span>ownerName</span>
          <input
            value={form.ownerName}
            onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>courseName</span>
          <input
            value={form.courseName}
            onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>issueDate</span>
          <input
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
            required
          />
        </label>
        <label className="field">
          <span>rawDocumentText (для хешу)</span>
          <textarea
            value={form.rawDocumentText}
            onChange={(e) => setForm((f) => ({ ...f, rawDocumentText: e.target.value }))}
            required
            rows={4}
            placeholder="Довільний текст; від нього рахується documentHash"
          />
        </label>

        <button type="submit" className="btn" disabled={!canSubmit}>
          {busy ? "Очікування…" : "registerCertificate"}
        </button>
      </form>

      {message && (
        <p className="msg msg-success" role="status">
          {message}
        </p>
      )}
      {lastHash && !error && (
        <p className="mono small">
          Останній надісланий documentHash: <strong>{lastHash}</strong>
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
