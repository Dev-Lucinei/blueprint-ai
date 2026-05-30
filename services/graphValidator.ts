import type { GraphNode, GraphLink } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_TYPES: GraphNode['type'][] = ['file', 'entity', 'endpoint', 'tech'];

export function validateGraphData(nodes: GraphNode[], links: GraphLink[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(nodes)) {
    errors.push('nodes must be an array');
    return { valid: false, errors, warnings };
  }
  if (!Array.isArray(links)) {
    errors.push('links must be an array');
    return { valid: false, errors, warnings };
  }

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n.id || typeof n.id !== 'string') errors.push(`nodes[${i}].id is required and must be a string`);
    if (!n.label || typeof n.label !== 'string') errors.push(`nodes[${i}].label is required and must be a string`);
    if (!n.type || !VALID_TYPES.includes(n.type)) {
      errors.push(`nodes[${i}].type must be one of: ${VALID_TYPES.join(', ')}`);
    }
  }

  const nodeIds = new Set(nodes.map(n => n.id));

  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    if (!l.source || typeof l.source !== 'string') errors.push(`links[${i}].source is required and must be a string`);
    if (!l.target || typeof l.target !== 'string') errors.push(`links[${i}].target is required and must be a string`);
    if (!l.type || typeof l.type !== 'string') errors.push(`links[${i}].type is required and must be a string`);

    if (l.source && !nodeIds.has(l.source)) warnings.push(`links[${i}].source "${l.source}" has no matching node`);
    if (l.target && !nodeIds.has(l.target)) warnings.push(`links[${i}].target "${l.target}" has no matching node`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
