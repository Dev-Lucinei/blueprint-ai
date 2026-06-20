#!/usr/bin/env python3
"""Harness de validação — Ponto único de verificação de qualidade e segurança."""

import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str], description: str, should_fail: bool = False) -> bool:
    """Executa um comando e retorna True se bem-sucedido."""
    print(f"\n{'='*60}")
    print(f"🔍 {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, check=False)
        if result.returncode == 0:
            if should_fail:
                print(f"❌ {description} — FALHOU (vulnerabilidade detectada)")
                return False
            print(f"✅ {description} — PASSOU")
            return True
        else:
            if should_fail:
                print(f"✅ {description} — PASSOU (nenhum padrão inseguro encontrado)")
                return True
            print(f"❌ {description} — FALHOU (código: {result.returncode})")
            return False
    except FileNotFoundError:
        print(f"⚠️  Comando não encontrado: {cmd[0]}")
        return False


def main() -> int:
    """Executa todas as validações."""
    results = []

    # 1. TypeScript type check
    results.append(run_command(["npx", "tsc", "--noEmit"], "TypeScript Check"))

    # 2. Build (Vite)
    results.append(run_command(["npm", "run", "build"], "Vite Build"))

    # 3. Vitest (se configurado)
    results.append(run_command(["npx", "vitest", "run", "--reporter=verbose"], "Vitest"))

    # 4. Security — eval em src/
    results.append(run_command(
        ["grep", "-r", "eval(", "src/"],
        "Security (eval)",
        should_fail=True
    ))

    # Summary
    passed = sum(results)
    total = len(results)
    if all(results):
        print(f"\n✅ HARNESS PASSOU — {passed}/{total}")
        return 0
    else:
        print(f"\n❌ HARNESS FALHOU — {passed}/{total}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
