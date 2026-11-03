# JWT Security Architecture & Token Storage Strategy

This document outlines the security posture, threat model, and migration roadmap for JSON Web Token (JWT) storage and authentication lifecycle in MentorOS.

---

## 1. Current State: Client-Side Storage (`localStorage`)

### Implementation
- The client application receives an `access_token` from `/api/v1/auth/login` or `/api/v1/auth/register`.
- The token is persisted in browser storage under `localStorage.getItem('mentor_token')`.
- All outgoing API calls attach the token via an HTTP authorization header:
  ```http
  Authorization: Bearer <token>
  ```

### Vulnerability Analysis (Threat Model)
- **XSS Susceptibility**: Browser `localStorage` is accessible to any JavaScript running within the same origin (`window.localStorage`).
- If an attacker succeeds in exploiting a Cross-Site Scripting (XSS) vulnerability (e.g., via third-party dependencies, unsanitized user content, or script injection), the access token can be exfiltrated silently.
- Once extracted, the attacker can impersonate the authenticated user until the token expires.

---

## 2. Target Architecture: `httpOnly` Cookie Authentication

The recommended mitigation is migrating authentication tokens from client-accessible storage to hardened, server-managed HTTP cookies.

### Key Cookie Attributes
When issuing authentication cookies from the backend (`Set-Cookie`), enforce:
- **`HttpOnly`**: Blocks all client-side JavaScript (`document.cookie`) from reading the cookie, completely mitigating token theft via XSS.
- **`Secure`**: Enforces transmission strictly over TLS/HTTPS connections (in production environments).
- **`SameSite=Lax` or `SameSite=Strict`**: Restricts cookie transmission across origins, mitigating Cross-Site Request Forgery (CSRF).

### Architectural Requirements
1. **Backend (`FastAPI`)**:
   - Issue tokens via `response.set_cookie(key="mentor_session", value=token, httponly=True, secure=is_production, samesite="lax")`.
   - Clear cookies on logout via `response.delete_cookie("mentor_session")`.
   - Validate incoming requests by extracting credentials from `request.cookies`.
2. **Frontend (`React + Axios`)**:
   - Configure HTTP client with `withCredentials: true` so the browser automatically handles cookie transmission.
   - Remove all references to `localStorage.setItem('mentor_token')`.
3. **CORS Configuration**:
   - `allow_credentials=True` in CORS middleware.
   - Origin cannot be a wildcard `*`; must specify exact client domains.

---

## 3. Interim Hardening Strategy

While transitioning to `httpOnly` cookies, MentorOS adopts a layered defense-in-depth posture:

### A. Short Token TTL (15 Minutes)
- Reduce the primary access token lifespan to **15 minutes** (`ACCESS_TOKEN_EXPIRE_MINUTES=15`).
- **Impact**: Dramatically limits the blast radius and time window during which an exfiltrated token remains valid.

### B. Refresh Token Rotation (RTR)
- **Dual-Token Architecture**:
  - **Access Token**: Short-lived (15 minutes), used for stateless API access.
  - **Refresh Token**: Longer-lived (e.g., 7 days), stored securely and used exclusively to request a fresh access token.
- **Single-Use Rotation**:
  - Every time a refresh token is exchanged, it is invalidated and replaced with a newly generated refresh token.
- **Automatic Family Revocation**:
  - If an expired or already-used refresh token is presented, the system treats it as token compromise, immediately invalidating all tokens belonging to that session family.

### C. Content Security Policy (CSP) Headers
- Enforce strict CSP headers via reverse proxy or web server configuration to prevent unauthorized script execution and exfiltration:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000; frame-ancestors 'none'; object-src 'none'; base-uri 'self';
  ```
- Disallow `unsafe-inline` scripts and `unsafe-eval` to eliminate primary XSS attack vectors.

### D. Input Sanitization & UI Hardening
- Strictly sanitize all dynamic markdown and user-provided HTML before rendering (via `DOMPurify` with an explicit whitelist of safe tags and attributes).
- Keep all client-side dependencies up-to-date to prevent supply-chain vulnerabilities.

---

## 4. Implementation Roadmap

| Phase | Milestone | Description | Status |
|---|---|---|---|
| **Phase 1** | **Interim Hardening** | Shorten token TTL to 15m, enforce DOMPurify sanitization, and define strict CSP rules. | **Active / In Progress** |
| **Phase 2** | **Refresh Token Rotation** | Implement dual-token flow with rotation and reuse detection. | **Planned** |
| **Phase 3** | **`httpOnly` Cookie Migration** | Move tokens to `HttpOnly`, `Secure`, `SameSite=Lax` cookies with `withCredentials: true`. | **Planned** |
