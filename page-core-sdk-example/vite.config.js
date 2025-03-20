import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import {NodeGlobalsPolyfillPlugin} from '@esbuild-plugins/node-globals-polyfill'
import {NodeModulesPolyfillPlugin} from '@esbuild-plugins/node-modules-polyfill'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@fksyuan/zktls-page-core-sdk/dist/algorithm/client_plugin.wasm',
          dest: './'
        },
        {
          src: 'node_modules/@fksyuan/zktls-page-core-sdk/dist/algorithm/client_plugin.worker.js',
          dest: './'
        },
        {
          src: 'node_modules/@fksyuan/zktls-page-core-sdk/dist/algorithm/client_plugin.js',
          dest: './'
        },
        {
          src: 'node_modules/@fksyuan/zktls-page-core-sdk/dist/algorithm/primus_zk.js',
          dest: './'
        }
      ]
    })
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
            // can't use this
            // https://github.com/intlify/vue-i18n-next/issues/970
            // global: "globalThis",
        },
        // Enable esbuild polyfill plugins
        plugins: [
            NodeGlobalsPolyfillPlugin({
                process: true,
                buffer: true
            }),
            NodeModulesPolyfillPlugin()
        ]
    },
    include: ['react', 'react-dom'],
    force: true,
  },
  resolve: {
    alias: {
        stream: 'src/script/stream-shim.js'
    },
    preserveSymlinks: true,
  },
})
