import type { JSX } from "react";
import { RegisterCertificateForm } from "./components/RegisterCertificateForm";
import { RevokeCertificateSection } from "./components/RevokeCertificateSection";
import { VerifyByIdAndHashSection } from "./components/VerifyByIdAndHashSection";
import { VerifyByIdSection } from "./components/VerifyByIdSection";
import { WalletBar } from "./components/WalletBar";
import { useMetaMask } from "./hooks/useMetaMask";

/**
 * Кореневий компонент додатку (каркас для лабораторної).
 */
export default function App(): JSX.Element {
  const metaMask = useMetaMask();

  return (
    <main style={{ padding: "1.5rem", maxWidth: "56rem" }}>
      <h1>Certificate Registry</h1>
      <WalletBar metaMask={metaMask} />
      <RegisterCertificateForm />
      <VerifyByIdSection />
      <VerifyByIdAndHashSection />
      <RevokeCertificateSection />
    </main>
  );
}
