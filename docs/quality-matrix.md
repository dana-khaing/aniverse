# Browser and multi-user quality matrix

The release-critical browser job runs on Chromium, Firefox, WebKit, Pixel 7
emulation, and iPhone 13 emulation.

| Area | Required evidence |
| --- | --- |
| Accessibility | Named landmarks and headings, no horizontal overflow, visible keyboard focus, reduced-motion navigation |
| Playback | Pointer and keyboard playback, speed, captions, seeking, quality fallback, audio fallback, subtitle sizing, autoplay |
| Multi-user concurrency | Separate browser contexts keep libraries isolated while tabs in one context synchronize changes |

The focused matrix runs with:

```sh
pnpm test:e2e:quality-matrix
```

The full browser suite remains available through `pnpm test:e2e:matrix`.
