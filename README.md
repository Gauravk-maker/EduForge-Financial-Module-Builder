# EduForge Studio — Interactive Financial Education Module Builder

A browser-based block editor prototype for creating interactive financial education modules. Built to the supplied Zetheta project brief with React 18, TypeScript strict mode, Zustand, TipTap, Tailwind CSS, Framer Motion, dnd-kit, Vitest and Playwright.

## Requirements
- Node.js 20 LTS or newer
- npm 10+

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## Quality checks
```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
```

## Included capabilities
- 15 block types: rich text, image, video, MCQ quiz, true/false quiz, EMI, SIP, compound interest, callout, divider, accordion/FAQ, progress tracker, achievement badge, code snippet and concept explainer.
- Block palette, search, keyboard shortcuts, block selection, duplication, deletion, lock/visibility, keyboard movement and drag-and-drop ordering.
- Zustand document state and snapshot undo/redo history capped at 50 entries, with redo-branch pruning.
- Live learner preview with desktop/tablet/mobile widths, theme toggle and interactive quiz/calculator blocks.
- EMI amortisation schedule and CSV export; SIP year-by-year growth and CSV export; compound-growth chart.
- JSON export with schema version and validation; JSON import with schema validation and fresh IDs.
- Creator guide, keyboard reference, validation feedback and responsive layout.

## Financial formulas
- EMI: standard reducing-balance monthly EMI formula; Indian currency formatting.
- SIP: annuity-due future value, assuming investments at the beginning of each month.
- Compound interest: `P × (1 + r/m)^(m×t)` for annual, half-yearly, quarterly and monthly compounding.

## Architecture
- `src/types`: strongly typed module and block document types.
- `src/lib`: financial formulas, block factory, validation and JSON portability.
- `src/store`: Zustand editor state and reversible snapshot history.
- `src/components`: calculator interfaces and charts.
- `src/App.tsx`: creator workspace, palette, editor canvas, preview and settings.
- `src/lib/*.test.ts`, `src/store/*.test.ts`: unit tests.
- `tests/e2e`: Playwright user journeys.

## Important implementation notes
This is a local-first assessment prototype. It does not include authentication, cloud persistence, a production media upload service, a backend API, or a production learner delivery system because these were not defined as required external integrations in the supplied brief. Image blocks accept URLs; base64 image handling can be added when a real upload flow is provisioned. The rich-text surface currently provides a lightweight text editing experience; TipTap is declared as the approved editor dependency for extension to full WYSIWYG authoring. The visual design and functional core are provided, but automated test/coverage results must be run in the target environment before claiming the required 90% coverage or WCAG conformance.

## Data and privacy
The project brief requires that the GitHub repository remain **private** and the work not be published or used in a portfolio without written permission. Keep this repository private and follow the organisation's transfer process. Do not commit secrets or personal data.
