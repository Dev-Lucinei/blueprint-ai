#!/usr/bin/env node

/**
 * harness.js — Gate Não-Crítico: Verificação de Qualidade
 *
 * Executa `npm run build`, captura a saída e traduz erros em diagnósticos
 * acionáveis (arquivo, linha, ação corretiva).
 *
 * Flags:
 *   --fast   Pula verificações pesadas (aqui executa só o build — mesmo
 *            comportamento que sem a flag, já que o build é a única etapa).
 *   --quiet  Apenas saída resumida: "healthy" ou "failed".
 *
 * Saída (quiet):
 *   "healthy"  — build passou sem erros
 *   "failed"   — build encontrou erros
 *
 * Saída (normal):
 *   FAILED: <arquivo>:<linha> — <descrição>
 *   AÇÃO: <ação corretiva>
 *
 * Exit code: 0 para healthy, 1 para failed
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Configuração ───────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');

const BUILD_TIMEOUT_MS = 120_000;

// ─── Parsers de erro ────────────────────────────────────────────────────────

/**
 * Tenta extrair um diagnóstico de cada linha de saída do build.
 * Retorna { file, line, col, message } ou null.
 */
function parseErrorLine(line) {
  const trimmed = line.trim();

  // ESBuild / Vite error format:
  //   ✘ [ERROR] src/file.ts:10:5: some error message
  //   error: src/file.ts:10:5 - error TS2345: message
  const esbuildMatch = trimmed.match(
    /(?:✘\s*\[ERROR\]|error):?\s*(.+?):(\d+):(\d+)\s*[-:]\s*(.+)/i
  );
  if (esbuildMatch) {
    return {
      file: esbuildMatch[1].trim(),
      line: parseInt(esbuildMatch[2], 10),
      col: parseInt(esbuildMatch[3], 10),
      message: esbuildMatch[4].trim(),
    };
  }

  // TypeScript compiler error (tsc):
  //   src/file.ts(10,5): error TS2345: message
  const tscMatch = trimmed.match(
    /(.+?)\((\d+),(\d+)\):\s*(error|warning)\s+(TS\d+):\s*(.+)/
  );
  if (tscMatch) {
    return {
      file: tscMatch[1].trim(),
      line: parseInt(tscMatch[2], 10),
      col: parseInt(tscMatch[3], 10),
      message: `${tscMatch[4].toUpperCase()} ${tscMatch[5]}: ${tscMatch[6].trim()}`,
    };
  }

  // Rollup error format:
  //   [!] RollupError: message
  //   src/file.ts:1:23
  const rollupMatch = trimmed.match(/^\[!\]\s*(RollupError|Error):\s*(.+)/);
  if (rollupMatch) {
    return {
      file: null,
      line: null,
      col: null,
      message: `${rollupMatch[1]}: ${rollupMatch[2].trim()}`,
    };
  }

  return null;
}

/**
 * Gera uma instrução de correção cirúrgica baseada na mensagem de erro.
 */
function generateFixInstruction(file, line, message) {
  const base = file
    ? `Em ${file}${line ? `:${line}` : ''}`
    : 'No build';

  // Cannot find name
  const nameMatch = message.match(/Cannot find name ['"](.+?)['"]/);
  if (nameMatch) {
    return (
      `${base} — ${message}. ` +
      `Importe ou declare '${nameMatch[1]}'. Verifique imports ausentes ou erros de digitação.`
    );
  }

  // Module not found
  if (message.includes('Module') && /not found|not exist|resolve/.test(message)) {
    const modMatch = message.match(/['"](.+?)['"]/);
    const modName = modMatch ? modMatch[1] : 'o módulo';
    return (
      `${base} — ${message}. ` +
      `Instale o módulo '${modName}' com \`npm install ${modName}\` ou corrija o caminho do import.`
    );
  }

  // Type not assignable
  if (/not assignable|Type.*is not/.test(message)) {
    return (
      `${base} — ${message}. ` +
      `Corrija a atribuição de tipo. Verifique se o tipo esperado corresponde ao tipo fornecido.`
    );
  }

  // Property does not exist
  const propMatch = message.match(/Property ['"](.+?)['"] does not exist/i);
  if (propMatch) {
    return (
      `${base} — ${message}. ` +
      `Adicione a propriedade '${propMatch[1]}' à definição de tipo ou remova a referência.`
    );
  }

  // Cannot find module or its type declarations
  if (/Cannot find module/.test(message)) {
    const modMatch2 = message.match(/['"](.+?)['"]/);
    const modName2 = modMatch2 ? modMatch2[1] : 'o módulo';
    return (
      `${base} — ${message}. ` +
      `Verifique se o pacote '${modName2}' está instalado ou se há um arquivo de declaração (.d.ts) para ele.`
    );
  }

  // Fallback genérico
  return (
    `${base} — ${message}. ` +
    `Revise o código na localização indicada e corrija o erro reportado.`
  );
}

// ─── Execução do build ──────────────────────────────────────────────────────

function runBuild() {
  try {
    const stdout = execSync('npm run build', {
      cwd: BASE_DIR,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: BUILD_TIMEOUT_MS,
    });
    return { success: true, stdout, stderr: '' };
  } catch (err) {
    return {
      success: false,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      status: err.status,
      message: err.message,
    };
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  // Parse flags
  const args = process.argv.slice(2);
  const isFast = args.includes('--fast');
  const isQuiet = args.includes('--quiet');

  // --fast é aceito mas não altera o comportamento (único gate é o build)
  if (isFast) {
    // No-op: build é a única verificação
  }

  const result = runBuild();

  if (result.success) {
    if (isQuiet) {
      process.stdout.write('healthy\n');
    } else {
      process.stdout.write('[PASSED] npm run build — compilação bem-sucedida\n');
    }
    process.exit(0);
  }

  // Build falhou — parsear erros
  const combinedOutput = result.stdout + '\n' + result.stderr;
  const lines = combinedOutput.split('\n');

  const diagnostics = [];

  for (const line of lines) {
    const parsed = parseErrorLine(line);
    if (parsed) {
      // Evitar duplicatas muito próximas
      const isDuplicate = diagnostics.some(
        (d) =>
          d.file === parsed.file &&
          d.line === parsed.line &&
          d.message === parsed.message
      );
      if (!isDuplicate) {
        const action = generateFixInstruction(parsed.file, parsed.line, parsed.message);
        diagnostics.push({ ...parsed, action });
      }
    }
  }

  if (isQuiet) {
    process.stdout.write('failed\n');
    process.exit(1);
  }

  // Saída detalhada
  process.stdout.write('[FAILED] npm run build — erros encontrados\n\n');

  if (diagnostics.length > 0) {
    process.stdout.write('─── Diagnósticos ──────────────────────────────────────\n\n');
    for (const d of diagnostics) {
      const loc = d.file && d.line ? `${d.file}:${d.line}` : d.file || '(build)';
      process.stdout.write(`FAILED: ${loc} — ${d.message}\n`);
      process.stdout.write(`AÇÃO: ${d.action}\n\n`);
    }
  } else {
    // Fallback: exibir saída bruta quando o parser não conseguiu extrair nada
    process.stdout.write('(Não foi possível extrair diagnósticos estruturados. Saída bruta abaixo:)\n\n');
    process.stdout.write(combinedOutput + '\n');
    process.stdout.write('\n─── AÇÃO ────────────────────────────────────────────\n');
    process.stdout.write('Analise a saída acima, identifique o erro e corrija o arquivo indicado.\n');
  }

  process.exit(1);
}

main();
