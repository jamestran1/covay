# One package per layer, internal packages consumed as source

Clean architecture layers are enforced first by the package manager, not only by lint: `domain`, `application` and each `adapter-*` are separate pnpm workspace packages, so a layer can only import what its `package.json` declares (domain declares nothing). Adapters are split per technology (KataGo/TF.js, IndexedDB, SGF) so heavy dependencies stay isolated and each can be swapped behind its port. dependency-cruiser in CI adds the rules package boundaries cannot express (no adapter-to-adapter imports, only the composition root imports adapters, no cycles, no deep imports).

Internal packages are not built to `dist/`: Vite imports their TypeScript source directly and `tsc -b` with project references does type checking. This avoids a build step per package for a solo project; if a package is ever published to npm it will need its own build.

## Considered Options

- Single package with folders per layer, boundaries enforced only by lint: rejected, a missing lint rule silently allows a wrong import.
- Nx: rejected for now, heavier conventions than one developer and a few packages need.
