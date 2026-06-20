import JSZip from 'jszip';
import { unpackTar } from 'modern-tar';

interface ExtractedFile {
  name: string;
  content: string;
}

export async function extractArchive(file: File): Promise<ExtractedFile[]> {
  const ext = file.name.toLowerCase();

  if (ext.endsWith('.zip')) {
    return extractZip(file);
  }

  if (ext.endsWith('.tar') || ext.endsWith('.tgz') || ext.endsWith('.tar.gz')) {
    return extractTar(file);
  }

  throw new Error(`Formato nao suportado para extracao: ${ext}`);
}

async function extractZip(file: File): Promise<ExtractedFile[]> {
  const zip = await JSZip.loadAsync(file);
  const files: ExtractedFile[] = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (!zipEntry.dir) {
      try {
        const content = await zipEntry.async('text');
        files.push({ name: path, content });
      } catch {
        files.push({ name: path, content: `[Arquivo binario: ${path}]` });
      }
    }
  }

  return files;
}

async function extractTar(file: File): Promise<ExtractedFile[]> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  const entries = await unpackTar(uint8Array);
  const files: ExtractedFile[] = [];

  for (const entry of entries) {
    if (entry.type === 'file' && entry.body) {
      try {
        const decoder = new TextDecoder();
        const content = decoder.decode(entry.body);
        files.push({ name: entry.name, content });
      } catch {
        files.push({ name: entry.name, content: `[Arquivo binario: ${entry.name}]` });
      }
    }
  }

  return files;
}

export function isCompressedFile(fileName: string): boolean {
  const ext = fileName.toLowerCase();
  return (
    ext.endsWith('.zip') ||
    ext.endsWith('.tar') ||
    ext.endsWith('.tgz') ||
    ext.endsWith('.tar.gz')
  );
}

export function getUnsupportedCompressedFormats(): string[] {
  return ['.rar', '.7z'];
}
