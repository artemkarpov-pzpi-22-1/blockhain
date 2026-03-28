/**
 * Заглушка для можливої інтеграції OCR/ML (архітектурно, без реалізації).
 * У лабораторній — не використовується.
 */
export async function extractCertificateStub(_imageBytes: ArrayBuffer): Promise<null> {
  return null;
}
