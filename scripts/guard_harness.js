#!/usr/bin/env node

/**
 * guard_harness.js — Gate Crítico: Verificação de Integridade do Projeto
 *
 * Verifica se a estrutura do projeto está íntegra:
 *   - Arquivos essenciais existem
 *   - Dependências mínimas no package.json
 *   - node_modules presente (opcional)
 *
 * Saída (stdout):
 *   "SEALED"      — tudo íntegro + node_modules presente
 *   "INTACT"      — tudo íntegro (mas sem node_modules)
 *   "COMPROMISED" — arquivo essencial ou dependência faltando
 *
 * Exit code: 0 para INTACT/SEALED, 1 para COMPROMISED
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Configuração ───────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');

const ESSENTIAL_FILES = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'index.tsx',
  'App.tsx',
];

const MINIMUM_DEPENDENCIES = ['react', 'react-dom'];

const MINIMUM_DEV_DEPENDENCIES = ['typescript', 'vite', '@vitejs/plugin-react'];

// ─── Verificações ───────────────────────────────────────────────────────────

const errors = [];
let allEssentialFilesExist = true;
let dependenciesValid = true;
let nodeModulesExists = false;

// 1. Verificar arquivos essenciais
for (const relPath of ESSENTIAL_FILES) {
  const absPath = path.join(BASE_DIR, relPath);
  if (!fs.existsSync(absPath)) {
    allEssentialFilesExist = false;
    errors.push(`Arquivo essencial ausente: ${relPath}`);
  }
}

// 2. Verificar node_modules
nodeModulesExists = fs.existsSync(path.join(BASE_DIR, 'node_modules'));

// 3. Verificar dependências mínimas no package.json
const packageJsonPath = path.join(BASE_DIR, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const dep of MINIMUM_DEPENDENCIES) {
      if (!allDeps[dep]) {
        dependenciesValid = false;
        errors.push(`Dependência ausente no package.json: ${dep}`);
      }
    }

    for (const dep of MINIMUM_DEV_DEPENDENCIES) {
      if (!allDeps[dep]) {
        dependenciesValid = false;
        errors.push(`DevDependência ausente no package.json: ${dep}`);
      }
    }
  } catch (e) {
    dependenciesValid = false;
    errors.push(`package.json inválido: ${e.message}`);
  }
} else {
  dependenciesValid = false;
  errors.push('package.json não encontrado');
}

// ─── Decisão e saída ────────────────────────────────────────────────────────

if (!allEssentialFilesExist || !dependenciesValid) {
  process.stderr.write('[guard_harness] Erros de integridade:\n');
  for (const err of errors) {
    process.stderr.write(`  - ${err}\n`);
  }
  process.stdout.write('COMPROMISED\n');
  process.exit(1);
}

if (nodeModulesExists) {
  process.stdout.write('SEALED\n');
} else {
  process.stdout.write('INTACT\n');
}

process.exit(0);
