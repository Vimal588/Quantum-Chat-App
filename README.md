# QuantumChat: Quantum-Resistant Chat Application

[![Standard: FIPS 203](https://img.shields.io/badge/NIST_FIPS_203-ML--KEM--768-teal.svg)](https://csrc.nist.gov/pubs/fips/203/final)
[![Standard: FIPS 204](https://img.shields.io/badge/NIST_FIPS_204-ML--DSA--65-cyan.svg)](https://csrc.nist.gov/pubs/fips/204/final)
[![Cipher: AES-256-GCM](https://img.shields.io/badge/Authenticated_Cipher-AES--256--GCM-emerald.svg)](https://csrc.nist.gov/pubs/sp/800/38/d/final)
[![Backend: Spring Boot 3](https://img.shields.io/badge/Backend-Spring_Boot_3.3-green.svg)](https://spring.io)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React_18_+_Vite-blue.svg)](https://vitejs.dev)

A complete, production-grade end-to-end encrypted (E2EE) messaging web application designed to resist cryptanalytic attacks by future quantum computers running Shor's algorithm.

---

## 1. Architectural Highlights

* **Post-Quantum Key Encapsulation:** Implements **ML-KEM-768** (FIPS 203, Module-Lattice-based Key-Encapsulation Mechanism) providing NIST Security Category 3 protection against "Harvest Now, Decrypt Later" (HNDL) attacks.
* **Post-Quantum Digital Signatures:** Implements **ML-DSA-65** (FIPS 204, Module-Lattice-based Digital Signature Algorithm) for identity authentication.
* **Authenticated Symmetric Encryption:** **AES-256-GCM** with unique 96-bit CSPRNG nonces per message. Modified ciphertexts fail authentication and are dropped before UI presentation.
* **Key Derivation:** **HKDF-SHA-256** (RFC 5869) extracts and expands shared secrets into symmetric session keys.
* **Zero-Knowledge Message Relay:** The backend relay and PostgreSQL database store only Base64-encoded ciphertext blobs, nonces, and KEM encapsulation data. **Plaintext messages and private keys never touch the server.**
* **Client Keystore:** Private keys are generated in browser memory and persisted securely on-device using IndexedDB.
* **Out-of-Band Safety Numbers:** SHA-256 fingerprint verification protects users against Man-in-the-Middle (MITM) key substitution.
* **Dual Theme Engine (Quantum Navy & Light Mode):** Instant visual toggle bar in the navigation header and settings with local storage persistence and dynamic chart adaptation.

---

## 2. Technology Stack

* **Backend:** Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, WebSocket with STOMP, Bouncy Castle 1.79 (`bcprov-jdk18on`), JJWT 0.12.6, PostgreSQL / H2.
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Zustand, `@noble/post-quantum` (audited pure JS FIPS 203/204), native Web Cryptography API (`window.crypto.subtle`), `@stomp/stompjs`, `sockjs-client`.

---

## 3. Quick Start Guide

### Prerequisites
* **Java 21** or later (`java -version`)
* **Maven 3.8+** (`mvn -v`)
* **Node.js 18+** & **npm** (`node -v`)
* **PostgreSQL 14+** (Optional: application includes automatic in-memory fallback profile `dev-h2`)

---

### Step 1: Start the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run tests to verify cryptographic compatibility:
   ```bash
   mvn test
   ```

3. Start the Spring Boot application:
   * **Option A: With Local In-Memory Database (Zero Setup):**
     ```bash
     mvn spring-boot:run -Dspring-boot.run.profiles=dev-h2
     ```
   * **Option B: With PostgreSQL:**
     Ensure your PostgreSQL database `quantum_chat_db` exists and run:
     ```bash
     mvn spring-boot:run
     ```
   *Backend will start on `http://localhost:8080`.*

---

### 🐳 Option C: One-Click Docker Deployment (Recommended)

Run the entire full-stack application (PostgreSQL + Spring Boot Backend + React/Nginx Frontend) in isolated Docker containers with zero manual environment configuration:

1. **Launch Containers:**
   * **Windows:** Double-click `docker-start.bat` or run:
     ```cmd
     docker-start.bat
     ```
   * **Linux / macOS / Shell:** Run:
     ```bash
     chmod +x docker-start.sh docker-stop.sh
     ./docker-start.sh
     ```
   * **Or standard Docker Compose:**
     ```bash
     docker compose --env-file .env.docker up --build -d
     ```

2. **Access QuantumChat:**
   * **Frontend Web Application:** [http://localhost](http://localhost) or [http://localhost:5173](http://localhost:5173)
   * **Backend REST API:** [http://localhost:8080/api](http://localhost:8080/api)
   * **PostgreSQL Database:** `localhost:5432` (database: `quantum_chat_db`)

3. **Stop Containers:**
   * **Windows:** Double-click `docker-stop.bat`
   * **Linux / macOS:** Run `./docker-stop.sh` or `docker compose down`

---

### Step 2: Start the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Launch Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend will be accessible at `http://localhost:5173`.*

---

## 4. Security Verification Checklist

| Test Case | Description | Result |
| :--- | :--- | :--- |
| **ML-KEM-768 Roundtrip** | Encapsulation & Decapsulation recovers 32-byte shared secret matching FIPS 203 sizes | **PASSED** (0.7s) |
| **ML-DSA-65 Sign & Verify** | 3309-byte signature generated and verified; tampered signatures rejected | **PASSED** |
| **AES-256-GCM Tampering** | 1-bit modification of ciphertext throws `AEADBadTagException` | **PASSED** |
| **Unauthorized Access** | Non-participant user receives HTTP 400 when attempting to read conversations | **PASSED** |
| **Zero Server Knowledge** | Database inspect reveals only Base64 ciphertext; zero plaintexts stored | **PASSED** |

---

## 5. Project Structure

```
quantum-chat-app/
├── backend/
│   ├── Dockerfile               # Multi-stage Eclipse Temurin 21 + Maven image
│   ├── .dockerignore
│   ├── src/main/java/com/quantumchat/
│   │   ├── config/              # Security, CORS, WebSocket STOMP
│   │   ├── controller/          # REST Endpoints (Auth, Keys, Users, Contacts, Chat)
│   │   ├── crypto/              # PqcCryptoService, Fingerprinting, BC integration
│   │   ├── dto/                 # Request/Response payloads
│   │   ├── entity/              # JPA Entities (User, Message, PublicKey, etc.)
│   │   ├── exception/           # Global exception handler & custom exceptions
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── security/            # JWT Token Provider, UserPrincipal, Filters
│   │   ├── service/             # Business & Key Management logic
│   │   └── websocket/           # STOMP broker controllers & presence listeners
│   └── src/test/java/           # FIPS 203/204 & Integration test suites
│
├── frontend/
│   ├── Dockerfile               # Multi-stage Node 20 build + Nginx Alpine runtime
│   ├── nginx.conf               # Nginx reverse proxy (/api, /ws) + SPA routing
│   ├── .dockerignore
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, ChatWindow, ContactInfoDrawer
│   │   ├── crypto/              # PQC (ML-KEM-768, ML-DSA-65), AES-GCM, Keystore
│   │   ├── pages/               # Login, Register, Chat, Contacts, Profile, Security, Benchmark
│   │   ├── services/            # Axios API client, STOMP WebSocket service
│   │   └── store/               # Zustand state stores (useAuthStore, useChatStore)
│   └── package.json
│
├── docker-compose.yml           # Full-stack orchestrator (PostgreSQL, Backend, Frontend)
├── .env.docker                  # Container environment configuration
├── docker-start.bat             # 1-Click Windows launcher
├── docker-stop.bat              # 1-Click Windows container stopper
├── docker-start.sh              # 1-Click Linux/macOS launcher
├── docker-stop.sh               # 1-Click Linux/macOS container stopper
├── docs/                        # Major Project Report & Architectural Diagrams
└── README.md
```

---

## 6. Cryptography Performance Comparison Dashboard

QuantumChat includes an interactive, empirical **Performance Comparison Dashboard** comparing **RSA-2048-OAEP**, **ECC NIST P-256**, and **ML-KEM-768 (FIPS 203)** on real message payloads (e.g., `"Hii"`):

* **Access:** Visit `http://localhost:5173/benchmark` or click **"Benchmark"** in the top navigation bar.
* **Empirical Monotonic Timing:** Zero mock or synthetic numbers; utilizes `System.nanoTime()` high-resolution instrumentation with warm-up cycles.
* **Comparison Matrix:** Evaluates Key Generation time, Encryption/Encapsulation time, Decryption/Decapsulation time, Key sizes (public/private), Wire ciphertext overhead, Quantum resistance status, and Authenticated Delivery.
* **Interactive Charts (Recharts):** Grouped bar charts for operation latencies (µs), wire overheads (bytes), and historical run trends.
* **Message Expiry Simulator:** Live countdown timer testing application-level message retention and scrub policies.
* **CSV Export:** Direct download of RFC-4180 compliant benchmark results for documentation and academic defense.
