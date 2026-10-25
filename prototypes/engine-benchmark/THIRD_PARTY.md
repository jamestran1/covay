# Third-party code and data

## web-katrain (MIT)

The KataGo model parser and TensorFlow.js network in `src/katago/` come from
[Sir-Teo/web-katrain](https://github.com/Sir-Teo/web-katrain):

| File here | Upstream file | Changes |
|---|---|---|
| `src/katago/binModelParser.ts` | `src/engine/katago/binModelParser.ts` | none |
| `src/katago/loadModelV8.ts` | `src/engine/katago/loadModelV8.ts` | none |
| `src/katago/modelV8.ts` | `src/engine/katago/modelV8.ts` | imports `@tensorflow/tfjs-core`, drops unused forward variants |
| `src/katago/features.ts` | `src/engine/katago/featuresV7.ts` | rewritten smaller: any board size, Chinese rules, no history, ko, ladder or area planes |
| `scripts/prepare-assets.mjs` | `scripts/copy-tfjs-wasm.mjs`, `scripts/fetch-katago-small-model.mjs` | merged into one script |

```
MIT License

Copyright (c) 2026 Web KatRain Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## KataGo network g170-b6c96 (CC0)

`public/models/g170-b6c96.bin.gz` is downloaded at build time from
[lightvector/KataGo](https://github.com/lightvector/KataGo)
(`cpp/tests/models/g170-b6c96-s175395328-d26788732.bin.gz`). The g170 networks are
released under CC0 (public domain dedication).

## TensorFlow.js (Apache-2.0)

`@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-wasm` and `@tensorflow/tfjs-backend-webgpu`
are npm dependencies; the WASM binaries are copied into `public/tfjs/` at build time.
