/**
 * Структура сертифіката, яку повертає getCertificate (ethers розгортає tuple у об'єкт за іменами полів).
 * Для звітності зручно тримати окремий тип замість `any`.
 */
export type CertificateStruct = {
  certificateId: string;
  ownerName: string;
  courseName: string;
  issueDate: string;
  documentHash: string;
  issuer: string;
  exists: boolean;
  revoked: boolean;
};
