import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const external = [
  ...Object.keys(pkg.peerDependencies || {})
];

// Plugin to copy and rename declaration files
const copyDeclarations = (format) => ({
  name: 'copy-declarations',
  writeBundle() {
    const extension = format === 'cjs' ? 'cts' : 'mts';
    
    // Copy main index declarations
    const srcPath = './dist/index.d.ts';
    const destPath = `./dist/index.d.${extension}`;
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
});

const createConfig = (input, outputBase) => {
  const outputName = outputBase.replace('dist/', '');
  
  return [
    // CommonJS build
    {
      input,
      external,
      output: {
        file: `${outputBase}.cjs`,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
        interop: 'auto'
      },
      plugins: [
        resolve({
          preferBuiltins: true,
          browser: true,
          extensions: ['.ts', '.tsx', '.js', '.jsx']
        }),
        commonjs(),
        typescript({
          typescript: require('typescript'),
          tsconfig: './tsconfig.json',
          clean: true,
          tsconfigOverride: {
            compilerOptions: {
              declaration: true,
              declarationDir: './dist',
              declarationMap: true,
              module: 'esnext', // Always use esnext for Rollup
              target: 'es2015'
            }
          }
        }),
        copyDeclarations('cjs')
      ]
    },
    
    // ES Module build
    {
      input,
      external,
      output: {
        file: `${outputBase}.mjs`,
        format: 'es',
        sourcemap: true
      },
      plugins: [
        resolve({
          preferBuiltins: true,
          browser: true,
          extensions: ['.ts', '.tsx', '.js', '.jsx']
        }),
        commonjs(),
        typescript({
          typescript: require('typescript'),
          tsconfig: './tsconfig.json',
          tsconfigOverride: {
            compilerOptions: {
              declaration: false, // Only generate once
              declarationMap: false,
              module: 'esnext',
              target: 'es2015'
            }
          }
        }),
        copyDeclarations('esm')
      ]
    }
  ];
};

export default [
  ...createConfig('src/index.ts', 'dist/index'),
  // Browser-ready bundle with all dependencies
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/browser.js',
      format: 'iife',
      name: 'OpenAIRealtimeWebRTC',
      sourcemap: true,
      globals: {}
    },
    plugins: [
      resolve({
        preferBuiltins: false,
        browser: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx']
      }),
      commonjs(),
      typescript({
        typescript: require('typescript'),
        tsconfig: './tsconfig.json',
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
            declarationMap: false,
            module: 'esnext',
            target: 'es2015'
          }
        }
      })
    ]
  }
];