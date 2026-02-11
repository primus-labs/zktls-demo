import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@primuslabs/zktls-page-core-sdk/dist/algorithm/client_plugin.wasm',
          dest: './'
        },
        {
          src: 'node_modules/@primuslabs/zktls-page-core-sdk/dist/algorithm/client_plugin.worker.js',
          dest: './'
        },
        {
          src: 'node_modules/@primuslabs/zktls-page-core-sdk/dist/algorithm/client_plugin.js',
          dest: './'
        },
        {
          src: 'node_modules/@primuslabs/zktls-page-core-sdk/dist/algorithm/primus_zk.js',
          dest: './'
        }
      ]
    })
  ],
  server: {
    headers: { // to support SharedArrayBuffer
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable esbuild polyfill plugins
      plugins: [
        NodeModulesPolyfillPlugin()
      ]
    },
    include: ['react', 'react-dom'],
    force: true,
  },
})
