// ==UserScript==
// @name         Bot Signal Spoofer
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  Makes an automated browser look human to anti-bot scripts: clears navigator.webdriver, fakes plugins/mimeTypes, chrome runtime, hardware and WebGL strings, and answers permissions.query. ScriptCat switch, on by default.
// @author       chirag127
// @match        *://*/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/bot-signal-spoofer
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/bot-signal-spoofer/bot-signal-spoofer.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/bot-signal-spoofer/bot-signal-spoofer.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const site = location.hostname
  const enabled = GM_getValue(`on:${site}`, true)
  if (!enabled) return
  if (window.top !== window) return

  const log = (m) => {
    try {
      GM_log(`[botspoof] ${m}`)
    } catch {}
  }

  const define = (target, prop, value) => {
    try {
      Object.defineProperty(target, prop, { configurable: true, get: () => value })
      return true
    } catch {
      return false
    }
  }

  // navigator.webdriver
  define(W.Navigator.prototype, 'webdriver', false)

  // plugins + mimeTypes: headless Chrome reports none
  const pluginData = [
    { name: 'PDF Viewer', filename: 'internal-pdf-viewer', desc: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', desc: 'Portable Document Format' },
    { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', desc: 'Portable Document Format' },
  ]
  try {
    const make = (list) => {
      const arr = list.map((p) => {
        const plugin = Object.create(W.Plugin.prototype)
        define(plugin, 'name', p.name)
        define(plugin, 'filename', p.filename)
        define(plugin, 'description', p.desc)
        define(plugin, 'length', 1)
        return plugin
      })
      const collection = Object.create(W.PluginArray.prototype)
      arr.forEach((p, i) => {
        collection[i] = p
        collection[p.name] = p
      })
      define(collection, 'length', arr.length)
      define(collection, 'item', (i) => arr[i] || null)
      define(collection, 'namedItem', (n) => arr.find((p) => p.name === n) || null)
      return collection
    }
    if (!W.navigator.plugins?.length) {
      define(W.Navigator.prototype, 'plugins', make(pluginData))
      define(W.Navigator.prototype, 'mimeTypes', make([]))
    }
  } catch (e) {
    log(`plugins: ${e}`)
  }

  // chrome runtime stub
  if (!W.chrome) {
    define(W, 'chrome', { runtime: {}, app: { isInstalled: false }, csi: () => {}, loadTimes: () => {} })
  }

  // hardware that matches a normal desktop
  if (!W.navigator.hardwareConcurrency || W.navigator.hardwareConcurrency < 4) {
    define(W.Navigator.prototype, 'hardwareConcurrency', 8)
  }
  if (!W.navigator.deviceMemory) define(W.Navigator.prototype, 'deviceMemory', 8)
  define(W.Navigator.prototype, 'languages', ['en-US', 'en'])
  define(W.Navigator.prototype, 'language', 'en-US')

  // permissions.query: notifications must not look denied-by-automation
  try {
    const query = W.Permissions?.prototype?.query
    if (query) {
      W.Permissions.prototype.query = new W.Proxy(
        query,
        {
          apply(target, self, args) {
            const name = args[0]?.name
            if (name === 'notifications') {
              return Promise.resolve({ state: W.Notification?.permission || 'default', onchange: null })
            }
            return W.Reflect.apply(target, self, args)
          },
        }
      )
    }
  } catch (e) {
    log(`permissions: ${e}`)
  }

  // WebGL vendor/renderer: SwiftShader is a loud automation tell
  try {
    const patch = (proto) => {
      if (!proto?.getParameter) return
      const original = proto.getParameter
      proto.getParameter = new W.Proxy(original, {
        apply(target, self, args) {
          const id = args[0]
          if (id === 37445) return 'Intel Inc.'
          if (id === 37446) return 'Intel Iris OpenGL Engine'
          return W.Reflect.apply(target, self, args)
        },
      })
    }
    patch(W.WebGLRenderingContext?.prototype)
    patch(W.WebGL2RenderingContext?.prototype)
  } catch (e) {
    log(`webgl: ${e}`)
  }

  // remove the CDP-ish properties some detectors probe
  for (const prop of ['__driver_evaluate', '__webdriver_evaluate', '__selenium_evaluate', '__fxdriver_evaluate']) {
    if (prop in W.document) {
      try {
        delete W.document[prop]
      } catch {}
    }
  }

  const switchMenu = (label, key, value, title) => {
    const listener = (next) => {
      GM_setValue(key, next === undefined ? !value : !!next)
      location.reload()
    }
    if (typeof CAT_registerMenuInput === 'function') {
      CAT_registerMenuInput(label, listener, {
        id: `bsp:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    }
  }
  switchMenu(`Bot spoofing on ${site}`, `on:${site}`, enabled, 'Hide automation signals on this site')
})()
