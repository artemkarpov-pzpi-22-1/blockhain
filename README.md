# Децентралізована платформа для зберігання та верифікації сертифікатів

## Короткий опис

Навчальний **fullstack** прототип: смарт-контракт у мережі Ethereum-стилю (Hardhat) зберігає **метадані** сертифіката та **хеш** документа; веб-інтерфейс (React + Vite + TypeScript + ethers.js + MetaMask) дозволяє реєструвати, перевіряти та відкликати записи.

## Мета проєкту

Продемонструвати для лабораторної роботи базовий цикл: **деплой контракту → підключення гаманця → запис у блокчейн → читання та верифікація даних** без окремого backend-сервера.

## Стек технологій

| Частина | Технології |
|--------|------------|
| Контракти | Solidity `^0.8.x`, OpenZeppelin `Ownable`, Hardhat |
| Скрипти й тести | TypeScript, ethers v6, Mocha/Chai |
| Фронтенд | React 18, Vite 5, TypeScript, ethers.js |
| Гаманець | MetaMask |

## Структура репозиторію

```
blockhain/
├── contracts/                 # Hardhat-проєкт
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── CertificateRegistry.test.ts
│   ├── hardhat.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── abi/               # копія артефакту JSON після compile
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Основні можливості

- **Ролі:** власник контракту (`owner`) і **authorized issuers** (призначаються через `authorizeIssuer`).
- **Реєстрація сертифіката:** `certificateId`, ПІБ власника, курс, дата випуску (рядок), `documentHash` (на фронті обчислюється як `keccak256` від UTF-8 тексту).
- **Перегляд за ID:** `getCertificate` — усі поля запису.
- **Перевірка хеша:** `verifyCertificateHash` — для активного (не відкликаного) запису.
- **Відкликання:** `revokeCertificate` (лише `owner` або authorized issuer).

## Запуск локально (крок за кроком)

### Вимоги

- [Node.js](https://nodejs.org/) (LTS)
- [MetaMask](https://metamask.io/) у браузері

### 1. Залежності

```bash
cd contracts && npm install
cd ../frontend && npm install
```

### 2. Локальна мережа Hardhat

У **окремому** терміналі:

```bash
cd contracts
npx hardhat node
```

Залишити процес запущеним. За замовчуванням: `http://127.0.0.1:8545`, **chainId `31337`**.

### 3. Деплой контракту

У **іншому** терміналі:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Скопіюйте з консолі адресу контракту (`CertificateRegistry deployed to: 0x...`).

### 4. Синхронізація ABI у фронтенд

Після змін у Solidity або першого клонування:

```bash
cd contracts
npx hardhat compile
```

Скопіюйте файл:

`contracts/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json`

→ у **`frontend/src/abi/CertificateRegistry.json`** (замініть існуючий).

### 5. Налаштування `frontend/.env`

У каталозі `frontend` створіть файл `.env` (можна орієнтуватися на `.env.example`):

```env
VITE_CONTRACT_ADDRESS=0xВАША_АДРЕСА_ПІСЛЯ_DEPLOY
VITE_CHAIN_ID=31337
```

Після зміни `.env` перезапустіть dev-сервер Vite.

### 6. Запуск фронтенду

```bash
cd frontend
npm run dev
```

Відкрийте URL з консолі (зазвичай `http://localhost:5173`).

### 7. MetaMask

- Імпортуйте один із тестових акаунтів (приватні ключі з виводу `npx hardhat node`) **або** використовуйте акаунт #0, який був деплоєром — у нього є тестовий ETH.
- Перемкніть мережу на **localhost** з chainId **31337** (у UI застосунку є кнопка перемикання на Hardhat Local, якщо мережа ще не додана).

## Сценарії для ручної перевірки

1. **Connect Wallet** — підключення, відображення адреси та коректної мережі.
2. **Register Certificate** — реєстрація з полем тексту для локального хешу; успішна транзакція.
3. **Verify by ID** — перегляд усіх полів збереженого сертифіката.
4. **Verify by ID + Hash** — збіг тексту з зареєстрованим хешем (успіх) та навмисна помилка (невдача).
5. **Revoke Certificate** — відкликання з акаунта `owner` або **authorized issuer** (інший акаунт має отримати помилку).

Опційно: `owner` викликає `authorizeIssuer` через **Etherscan не використовується** — за потреби тест можна виконати скриптом або тимчасовою кнопкою; у базовій лабораторній достатньо деплойера як `owner`.

## Тести смарт-контракту

```bash
cd contracts
npx hardhat test
```

Додаткова перевірка типів TypeScript:

```bash
cd contracts
npm run typecheck
```

## Примітка щодо ML / OCR

У коді передбачено **заглушку** `frontend/src/services/mlOcrStub.ts` як можливе майбутнє розширення (розпізнавання документів). У поточній навчальній версії **основний акцент — блокчейн-верифікація та робота з MetaMask**, без реальної ML/OCR моделі.


---
