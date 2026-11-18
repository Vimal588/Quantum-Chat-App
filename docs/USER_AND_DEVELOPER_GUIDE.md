# QuantumChat: User & Developer Operational Guide

**Application Title:** Implementation of a Quantum-Resistant Chat Application for Secure Digital Communication  
**Standards Compliance:** NIST FIPS 203 (ML-KEM-768), NIST FIPS 204 (ML-DSA-65), NIST SP 800-38D (AES-256-GCM), RFC 5869 (HKDF-SHA-256)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [How to Launch the Application](#2-how-to-launch-the-application)
3. [Step-by-Step User Walkthrough](#3-step-by-step-user-walkthrough)
   * [Step 1: Account Creation & Client-Side Key Generation](#step-1-account-creation--client-side-key-generation)
   * [Step 2: Authenticating & Local Keystore Activation](#step-2-authenticating--local-keystore-activation)
   * [Step 3: Finding Contacts & Building Your Directory](#step-3-finding-contacts--building-your-directory)
   * [Step 4: Out-of-Band Safety Number Verification (MITM Defense)](#step-4-out-of-band-safety-number-verification-mitm-defense)
   * [Step 5: Exchanging Real-Time Encrypted Messages](#step-5-exchanging-real-time-encrypted-messages)
   * [Step 6: Inspecting the Security Dashboard](#step-6-inspecting-the-security-dashboard)
   * [Step 7: Key Lifecycle & Rotation](#step-7-key-lifecycle--rotation)
4. [Testing Two Users Simultaneously (Demo Walkthrough)](#4-testing-two-users-simultaneously-demo-walkthrough)
5. [What Happens Under the Hood (Technical Deep Dive)](#5-what-happens-under-the-hood-technical-deep-dive)
6. [Automated Verification & Cryptographic Tests](#6-automated-verification--cryptographic-tests)

---

## 1. Introduction

QuantumChat protects your conversations against both current eavesdroppers and future quantum computers equipped with **Shor's Algorithm**. 

### The Core Problem: "Harvest Now, Decrypt Later" (HNDL)
Traditional apps (like standard Signal, WhatsApp, or TLS) establish shared secrets using classical elliptic curves (ECDH) or RSA. Adversaries currently intercept and archive this encrypted traffic. When a quantum computer arrives in 5–15 years, those old ciphertexts will be decrypted retrospectively.

### The QuantumChat Solution
QuantumChat replaces classical key exchange with **ML-KEM-768** (NIST FIPS 203), a module-lattice-based algorithm that quantum computers cannot crack. The messaging server acts as a **zero-knowledge relay**: it sees only Base64 ciphertext blobs and routing metadata. **Plaintext messages and private decryption keys never touch the server.**

---

## 2. How to Launch the Application

### Option A: Both Services Running Locally

1. **Start Backend (Spring Boot 3 + Java 21):**
   ```powershell
   cd "C:\Users\yadav\OneDrive\Desktop\quantum-chat-app\backend"
   mvn spring-boot:run -Dspring-boot.run.profiles=dev-h2
   ```
   *Runs on `http://localhost:8080`. Uses an in-memory database with zero database setup required.*

2. **Start Frontend (React 18 + Vite):**
   ```powershell
   cd "C:\Users\yadav\OneDrive\Desktop\quantum-chat-app\frontend"
   npm run dev
   ```
   *Runs on `http://localhost:5173`.*

---

## 3. Step-by-Step User Walkthrough

### Step 1: Account Creation & Client-Side Key Generation

1. Open your browser and navigate to **`http://localhost:5173/register`**.
2. Notice the green status badge: **`Relay Connected`** (verifies backend communication).
3. Enter your details:
   * **Full Name:** `Alice Smith`
   * **Email:** `alice@quantum.io`
   * **Master Password:** `Password123!` (minimum 8 characters)
4. Click **"Generate Identity & Register"**:
   * **What happens behind the scenes:**
     * The browser executes `@noble/post-quantum/ml-kem` to generate a fresh **ML-KEM-768** keypair (`publicKey` of 1,184 bytes and `secretKey` of 2,400 bytes).
     * It executes `@noble/post-quantum/ml-dsa` to generate an **ML-DSA-65** keypair.
     * The **private keys are stored on your device in IndexedDB** (`QuantumChatKeystore`).
     * Only the **public keys** are uploaded to the server directory over TLS.

---

### Step 2: Authenticating & Local Keystore Activation

1. If not automatically redirected, navigate to **`http://localhost:5173/login`**.
2. Enter your email (`alice@quantum.io`) and password (`Password123!`).
3. *(Optional)* Click the **"Test User"** quick-fill button to populate demo credentials.
4. Click **"Sign In Securely"**:
   * The server validates your password using **BCrypt (12 work factor)** and issues an access JWT (valid 24h) and refresh JWT (valid 7 days).
   * The frontend unlocks your local IndexedDB private key and establishes an authenticated native WebSocket connection to `ws://localhost:8080/ws`.

---

### Step 3: Finding Contacts & Building Your Directory

1. Click **"Contacts"** in the top navigation bar (or visit `/contacts`).
2. In the **"Search Registered Users"** input, type a contact's name or email (e.g., `bob` or `test.user@quantum.io`) and click **"Search"**.
3. In the search results card, click the **User Plus (+)** icon.
4. The user is now added to your verified contacts list. You will see:
   * Their avatar and online presence indicator.
   * Their active post-quantum key version (e.g., `Key v1`).
   * An **Unverified** badge (until Safety Numbers are compared).

---

### Step 4: Out-of-Band Safety Number Verification (MITM Defense)

To ensure that a malicious server or network proxy has not substituted your contact's public key, QuantumChat implements **Safety Numbers**:

1. On the Contacts page (or in an active Chat window), click **"Verify"** (or **"Safety Numbers"**).
2. A cryptographic modal appears showing a 64-character SHA-256 fingerprint formatted into 4-character blocks:
   ```
   A1B2 C3D4 E5F6 7890 1234 5678 9ABC DEF0
   ```
3. Contact the person via another channel (e.g., a phone call or in person) and confirm that their screen displays the exact same blocks.
4. Click **"Mark as Verified"**:
   * The contact status updates to **Verified** with a green shield icon.
   * A security audit event is logged on your account.

---

### Step 5: Exchanging Real-Time Encrypted Messages

1. Click **"Chat"** on any contact (or click a conversation in the **Chats** sidebar).
2. Type a message in the input box: `"Hello Bob, this message is quantum-safe!"`.
3. Press **Enter** or click **Send**:
   * **Sender Device:**
     1. Queries the recipient's ML-KEM-768 public key (1,184 bytes).
     2. Runs `ml_kem768.encapsulate()` to produce a 32-byte shared secret and a 1,088-byte ciphertext.
     3. Feeds the shared secret into `HKDF-SHA-256` to derive a 256-bit AES key.
     4. Encrypts the plaintext using `AES-256-GCM` with a fresh 96-bit CSPRNG IV/nonce.
     5. Packages `{ ciphertext, nonce, kemCiphertext }` and dispatches it over WebSocket.
   * **Server:**
     * Verifies that the sender is a member of the conversation.
     * Persists the encrypted envelope to PostgreSQL.
     * Relays the encrypted envelope to the recipient's WebSocket topic.
   * **Recipient Device:**
     1. Receives `{ ciphertext, nonce, kemCiphertext }`.
     2. Uses local private key from IndexedDB to decapsulate `kemCiphertext` $\rightarrow$ recovers the 32-byte shared secret.
     3. Derives the identical AES-256 key via `HKDF-SHA-256`.
     4. Decrypts `ciphertext` and verifies the 128-bit authentication tag.
     5. Displays the plaintext message on screen with a delivery checkmark.

---

### Step 6: Inspecting the Security Dashboard

Click **"Security"** in the top navigation bar (or visit `/security`):

* **Algorithm Specifications:**
  * **Key Encapsulation:** ML-KEM-768 (NIST FIPS 203)
  * **Digital Signatures:** ML-DSA-65 (NIST FIPS 204)
  * **Payload Cipher:** AES-256-GCM (128-bit Authentication Tag)
  * **Key Derivation:** HKDF-SHA-256 (RFC 5869)
* **Active Identity Fingerprint:** Inspect and copy your own 64-character public key fingerprint.
* **Security Event Audit Log:** View timestamped logs of registrations, logins, contact verifications, and key rotations.

---

### Step 7: Key Lifecycle & Rotation

Cryptographic best practices dictate rotating asymmetric identity keys periodically:

1. On the **Security Dashboard**, click **"Rotate Post-Quantum Keys"**.
2. Confirm the prompt:
   * The browser generates a brand new ML-KEM-768 and ML-DSA-65 keypair locally.
   * Updates on-device IndexedDB storage.
   * Registers the new public key on the server as `Key v2`.
   * Archives `Key v1` to the key rotation audit table.
   * Future messages will automatically use the new key version.

---

## 4. Testing Two Users Simultaneously (Demo Walkthrough)

To simulate a real conversation between two separate users on your computer:

1. **Window 1 (Alice):**
   * Open regular Chrome/Edge at `http://localhost:5173`.
   * Register with `alice@quantum.io` / `Password123!`.
2. **Window 2 (Bob):**
   * Open an **Incognito / Private Window** (so it gets its own separate IndexedDB storage).
   * Navigate to `http://localhost:5173/register`.
   * Register with `bob@quantum.io` / `Password123!`.
3. In Window 1 (Alice):
   * Go to **Contacts**, search `bob@quantum.io`, and click **Add Contact**.
   * Click **Chat** to open the chat window.
4. In Window 2 (Bob):
   * Go to **Contacts**, search `alice@quantum.io`, and click **Add Contact**.
   * Select Alice's chat.
5. **Send messages back and forth:**
   * Watch messages appear instantly in real-time over WebSocket.
   * Inspect browser DevTools (Network tab $\rightarrow$ WS) to verify that only Base64 ciphertext envelopes travel across the wire!

---

## 5. What Happens Under the Hood (Technical Deep Dive)

### Database Storage: What the Server Sees

If a database administrator or hacker inspects the `messages` table in PostgreSQL, this is all they see:

| Column | Value Stored on Server |
| :--- | :--- |
| `id` | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |
| `sender_id` | `7c650f42-2a32-4cdb-9214-f561fae27e17` |
| `ciphertext` | `xK82nF+z9sL1...==` *(AES-256-GCM ciphertext + 16-byte auth tag)* |
| `nonce` | `vN4qKx9L0PqZ==` *(96-bit CSPRNG IV)* |
| `kem_ciphertext` | `48aFc90...==` *(1,088-byte ML-KEM-768 encapsulation blob)* |
| `algorithm_version` | `MLKEM768-AES256GCM` |
| `key_version` | `1` |
| `delivery_status` | `READ` |

**Zero plaintext is stored.** Even with a court subpoena or physical hard drive seizure, messages cannot be decrypted without the recipient's private key residing in their browser's IndexedDB.

---

## 6. Automated Verification & Cryptographic Tests

The project includes unit and integration tests verifying algorithm compliance against NIST test vectors:

To run all tests:
```powershell
cd "C:\Users\yadav\OneDrive\Desktop\quantum-chat-app\backend"
mvn test
```

### Verified Test Suites:

1. **`PqcCryptoTest` (FIPS 203 & FIPS 204):**
   * Generates ML-KEM-768 keys; verifies public key size is exactly 1,184 bytes.
   * Encapsulates shared secret; verifies KEM ciphertext is exactly 1,088 bytes.
   * Decapsulates ciphertext; verifies sender and recipient recover the identical 32-byte secret.
   * Signs a payload with ML-DSA-65; verifies signature is 3,309 bytes and valid.
2. **`SymmetricCryptoTest` (AES-256-GCM & HKDF):**
   * Derives 256-bit AES key from secret using HKDF-SHA-256.
   * Encrypts and decrypts payload.
   * **Tamper Simulation:** Flips 1 bit in ciphertext; verifies that `AEADBadTagException` is thrown and corrupted messages are rejected.
3. **`ConversationAuthorizationTest`:**
   * Registers Alice, Bob, and an attacker (Eve).
   * Verifies that when Eve attempts to fetch Alice and Bob's conversation, the server rejects Eve with HTTP 400 (`BadRequestException`).
