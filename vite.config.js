failed to load config from /vercel/path0/vite.config.js
error during build:
ReferenceError: defineConfig is not defined
    at file:///vercel/path0/vite.config.js.timestamp-1777033078354-a20e482716cc48.mjs:2:27
    at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:661:26)
    at async loadConfigFromBundledFile (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66975:15)
    at async loadConfigFromFile (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66816:24)
    at async resolveConfig (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66416:24)
    at async build (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65503:18)
    at async CAC.<anonymous> (file:///vercel/path0/node_modules/vite/dist/node/cli.js:829:5)
Error: Command "npm run build" exited with 1