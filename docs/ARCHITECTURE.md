# Architecture Notes

## Document model
A module is a typed root document containing ordered blocks. Each block has an identifier, a discriminated block type, an order, type-specific content, and common visibility/lock/custom-style settings. The document is JSON serialisable.

## Block registry and factory
`BLOCK_TYPES` is the canonical block-type enum. `createBlock()` supplies defaults for all 15 required types. The editor palette is data-driven from a catalog of labels, descriptions, icons and searchable keywords.

## State and command history
Zustand owns the live document. Every editor operation captures a pre-mutation snapshot, caps the history at 50 entries and clears the redo branch when a new operation is made after undo. Undo and redo restore document snapshots. Calculator learner inputs are component-local and are not part of the authored module document.

## Rendering separation
The authoring canvas and learner preview render the same document model through separate component paths. The preview filters hidden blocks and offers viewport modes. Calculator and quiz preview controls own local interaction state rather than mutating the authored configuration.

## Portability
The JSON layer validates the module schema and block constraints before export. Imports are parsed defensively, schema-validated, and receive new module and block IDs to avoid collisions.

## Trade-offs and follow-up engineering
The current snapshot history is intentionally simple and deterministic for the 50-entry requirement. A future production release should batch text input within 500ms, persist recovery snapshots, isolate preview styles in an iframe or shadow root, implement a full TipTap extension for rich text, provide a secure media upload service, and add migration fixtures for older schema versions. The current preview is CSS-scoped rather than iframe-isolated.
