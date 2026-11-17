# bot-signal-spoofer

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Hides the loudest automation tells so anti-bot scripts score you as a normal browser.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/bot-signal-spoofer-userscript/main/bot-signal-spoofer.user.js)

## What it patches

| Signal | Before (automated) | After |
|---|---|---|
| `navigator.webdriver` | `true` | `false` |
| `navigator.plugins` / `mimeTypes` | empty | 3 PDF viewers |
| `window.chrome` | missing in headless | runtime stub |
| `navigator.hardwareConcurrency` / `deviceMemory` | 2 / missing | 8 |
| `navigator.languages` | `[]` | `en-US, en` |
| `permissions.query('notifications')` | denied-by-automation | real permission |
| WebGL `UNMASKED_VENDOR/RENDERER` | `Google SwiftShader` | `Intel Inc.` |
| `document.__driver_evaluate` etc. | present | deleted |

## Limits

Cosmetic only. It does not change the TLS or JS fingerprint, does not patch `Function.prototype.toString` on the proxied natives, and does not fix a bad IP reputation. Sites that hash native functions can still spot it.

## License

MIT. See [LICENSE](../../LICENSE).
