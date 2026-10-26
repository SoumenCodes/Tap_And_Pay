# API Integration & Data Handling Rules for AI Agents & Developers

This document defines the strict engineering standards for backend API integrations within the **SE PAY** mobile application. Any AI agent or developer implementing API endpoints must adhere to these rules without exception.

---

## 1. Complete Response Schema Mapping
- **Audit Every Parameter**: Whenever an API endpoint is integrated, analyze the entire response JSON payload provided by the backend.
- **Strict TypeScript Definitions**: Define comprehensive TypeScript interfaces matching every returned object, nested object, and array element.
- **Proactive Parameter Reporting**: Explicitly notify the user if any parameter present in the API response is currently unused or missing in the UI presentation.

---

## 2. Zero Hardcoded Fallback Values
- **No Mock / Dummy Fallbacks in Production Code**:
  - Never use hardcoded strings (e.g., `"Harpreet Singh"`, `"M6022"`, `"Zafar Ansari"`, `"0400 555 320"`).
  - Never use hardcoded financial amounts (e.g., `$485`, `$320`, `$165`).
  - Never use hardcoded shift IDs, timestamps, or bank account numbers.
- **Pure State Initialization**:
  - String state variables must initialize to `''`.
  - Numeric amounts must initialize to `0`.
  - Object state variables must initialize to `null`.
  - Array collections must initialize to `[]`.
- **Pure Data Rendering**:
  - Data displayed on screen must come directly from the API response payload.
  - If an optional field is missing or null, render `'--'`, empty space, or omit the row using conditional rendering (`Boolean(value) && <Component />`). Never display fabricated data.

---

## 3. Dynamic Lists & Menus
- Arrays returned by the backend (such as `menu_options`, `transactions`, `breakdowns`) must be mapped dynamically.
- Do not provide a fallback mock array if the backend returns an empty array `[]`. Render an empty state or the exact items sent by the server.

---

## 4. Automatic Token Handling & Logging
- All authenticated API calls must go through `apiClient` (`src/services/apiClient.ts`).
- `apiClient` automatically injects `Authorization: Bearer <token>` from encrypted storage (`tokenStorage`).
- Request and response payloads must be cleanly logged to the console (URL, Method, Payload, Response Data, HTTP Status).

---

## 5. Verification
- Run `npx tsc --noEmit` to ensure zero type errors.
- Run `npx expo lint` to ensure zero lint warnings or errors.
