import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import requireTransform from 'vite-plugin-require-transform'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import eslintPlugin from 'vite-plugin-eslint'
import path from 'path'
import postcss from 'postcss-preset-env'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    requireTransform({
      fileRegex: /src\/.*\.[tj]sx?$/,
    }),
    nodePolyfills(),
    postcss({
      autoprefixer: false,
    }),
    svgr({ include: '**/*.svg?react' }),
    ...[process.env.DISABLE_ESLINT_PLUGIN === 'true' ? [] : [eslintPlugin()]],
  ],
  base: './',
  root: './',
  resolve: {
    alias: {
      electron: path.resolve(__dirname, './src/electron-modules'),
      components: path.resolve(__dirname, './src/components'),
      containers: path.resolve(__dirname, './src/containers'),
      exceptions: path.resolve(__dirname, './src/exceptions'),
      locales: path.resolve(__dirname, './src/locales'),
      services: path.resolve(__dirname, './src/services'),
      states: path.resolve(__dirname, './src/states'),
      stories: path.resolve(__dirname, './src/stories'),
      styles: path.resolve(__dirname, './src/styles'),
      tests: path.resolve(__dirname, './src/tests'),
      types: path.resolve(__dirname, './src/types'),
      utils: path.resolve(__dirname, './src/utils'),
      theme: path.resolve(__dirname, './src/theme'),
      router: path.resolve(__dirname, './src/router'),
      widgets: path.resolve(__dirname, './src/widgets'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    target: 'modules',
    minify: 'esbuild',
    manifest: false,
    sourcemap: false,
    outDir: 'build',
    rollupOptions: {},
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.js'],
    include: [...configDefaults.include, 'src/**/*.test.{ts,tsx}'],
  },
})
