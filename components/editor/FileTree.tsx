import { useMemo } from 'react';
import { FileObject } from '../../types';

interface FileTreeProps {
  files: FileObject[];
  max_height?: string;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: FileObject[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach(({ file }) => {
    const parts = file.name.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const existing = current.find(n => n.name === part);
      const isDir = index < parts.length - 1;

      if (existing) {
        current = existing.children;
      } else {
        const newNode: TreeNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          isDir,
          children: [],
        };
        current.push(newNode);
        if (isDir) {
          current = newNode.children;
        }
      }
    });
  });

  return root;
}

function TreeNodeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const indent = depth * 16;

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-slate-700/30 rounded px-1"
        style={{ paddingLeft: `${indent}px` }}
      >
        <span className="text-xs">
          {node.isDir ? '📁' : '📄'}
        </span>
        <span className="text-xs text-slate-300 truncate">{node.name}</span>
      </div>
      {node.children.map((child, i) => (
        <TreeNodeItem key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FileTree({ files, max_height = '200px' }: FileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-y-auto"
      style={{ maxHeight: max_height }}
    >
      <div className="p-2">
        <div className="text-xs text-slate-400 mb-1 font-medium">Arquivos carregados</div>
        {tree.map((node, i) => (
          <TreeNodeItem key={i} node={node} />
        ))}
      </div>
    </div>
  );
}
