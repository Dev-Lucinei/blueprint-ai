/// <reference types="vite/client" />

// Declarações de módulos para imports com ?raw (Vite)
declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.css?raw' {
  const content: string;
  export default content;
}

// Declarações para webkitdirectory (HTML input attribute não padronizado)
declare namespace React {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
