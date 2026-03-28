import type { JSX } from "react";
import { RegisterCertificateForm } from "./components/RegisterCertificateForm";
import { RevokeCertificateSection } from "./components/RevokeCertificateSection";
import { VerifyByIdAndHashSection } from "./components/VerifyByIdAndHashSection";
import { VerifyByIdSection } from "./components/VerifyByIdSection";
import { WalletBar } from "./components/WalletBar";
import { useMetaMask } from "./hooks/useMetaMask";

export default function App(): JSX.Element {
  const metaMask = useMetaMask();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Certificate Registry</h1>
        <p className="subtitle">Децентралізована верифікація метаданих сертифікатів (лабораторна робота)</p>
      </header>

      <section className="card how-to">
        <h2 className="section-title">How to test</h2>
        <ol className="how-to-list">
          <li>
            Термінал 1: <code>cd contracts</code> → <code>npx hardhat node</code> (локальна мережа, chainId 31337).
          </li>
          <li>
            Термінал 2: <code>cd contracts</code> → <code>npx hardhat run scripts/deploy.ts --network localhost</code> —
            скопіюйте адресу контракту.
          </li>
          <li>
            У <code>frontend/</code> створіть <code>.env</code> з <code>VITE_CONTRACT_ADDRESS</code> та за потреби{" "}
            <code>VITE_CHAIN_ID=31337</code> (див. <code>.env.example</code>).
          </li>
          <li>
            Після зміни контракту: <code>npx hardhat compile</code> і скопіюйте{" "}
            <code>artifacts/.../CertificateRegistry.json</code> у <code>frontend/src/abi/</code>.
          </li>
          <li>
            Термінал 3: <code>cd frontend</code> → <code>npm run dev</code>. У MetaMask імпортуйте тестовий акаунт
            Hardhat і перемкніть мережу на Localhost 31337 (кнопка в застосунку або вручну).
          </li>
        </ol>
      </section>

      <WalletBar metaMask={metaMask} />
      <RegisterCertificateForm metaMask={metaMask} />
      <VerifyByIdSection metaMask={metaMask} />
      <VerifyByIdAndHashSection metaMask={metaMask} />
      <RevokeCertificateSection metaMask={metaMask} />
    </div>
  );
}
