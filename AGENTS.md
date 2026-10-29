# SE PAY Mobile Development Rules

Expo / React Native application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

---

## 1. Expo & React Native Standards
- **Expo Version Awareness**: Always verify `package.json` Expo major version before touching native/Expo APIs.
- **Documentation First**: Fetch versioned docs (`https://docs.expo.dev/versions/v<major>.0.0/`) or `https://docs.expo.dev/llms.txt`; never code from legacy memory.
- **Native Generation (CNG)**: Never edit `ios/` or `android/` directly. Configure native behaviors via `app.json` and config plugins.
- **Module Preference**: Prefer official Expo modules over third-party alternatives.

---

## 2. Essential Commands
Always use SDK-compatible commands (`bunx` if `bun.lock` exists, otherwise `npx`):

```bash
npx expo install <package>   # SDK-compatible installation
npx expo start               # Start development server
npx expo lint                # Lint codebase (Must pass before completion)
npx tsc --noEmit             # TypeScript typecheck (Must pass before completion)
npx expo-doctor              # Diagnose config & dependency health
```

---

## 3. Navigation & Routing (Expo Router)
- **File-Based Routing**: All screens live in `src/app/`.
- **Clean Separation**: Keep all components, hooks, services, and types outside `src/app/`.
- **Standard Navigation**: Use `router`, `Link`, and `useLocalSearchParams` from `expo-router`.

---

## 4. API Integration & Backend Architecture Rules
- **Complete Schema Mapping**: Inspect every response contract. Strictly type all returned parameters in TypeScript interfaces.
- **AI Backend Contract Review**:
  - Audit AI-generated APIs for missing functional parameters (e.g., filtering flags like `is_on_shift`).
  - Favor clean primitives over redundant pre-baked UI strings (e.g. raw counts instead of `"• On Shift 0"`).
  - Proactively report missing or redundant parameters to the team.
- **Zero Hardcoded Fallbacks**: Never fall back to fake names, synthetic amounts, hardcoded bank numbers, or dummy shifts.
- **Clean State Initialization**: Initialize state with empty primitives (`''`, `null`, `0`, `[]`).
- **Graceful Empty Rendering**: Display clean placeholder states (`'--'`), never synthetic mockups.
- **Dynamic Arrays**: Render lists directly from backend response arrays without fallback mock arrays.
- **Screen & API Tracking**: Maintain and update [`docs/API_SCREEN_MAPPING.md`](docs/API_SCREEN_MAPPING.md) whenever an endpoint is added, updated, or integrated.
