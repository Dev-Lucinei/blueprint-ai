import { describe, it, expect, vi } from 'vitest';
import { runPipeline, parseGraphFromAI } from './pipelineService';
import { aiClient } from './aiProvider';

vi.mock('./aiProvider', () => ({
  aiClient: {
    generate: vi.fn(),
  },
}));

describe('pipelineService', () => {
  describe('parseGraphFromAI', () => {
    it('should correctly parse a valid JSON graph from markdown', () => {
      const analysis = 'Some text\n```json\n{\n  "nodes": [{"id": "n1", "label": "Node 1"}],\n  "links": [{"source": "n1", "target": "n2"}]\n}\n```\nMore text';
      const result = parseGraphFromAI(analysis);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('n1');
      expect(result.links).toHaveLength(1);
      expect(result.links[0].source).toBe('n1');
    });

    it('should return empty arrays for invalid content', () => {
      const result = parseGraphFromAI('Invalid content');
      expect(result.nodes).toEqual([]);
      expect(result.links).toEqual([]);
    });
  });

  describe('runPipeline', () => {
    it('should run all steps successfully', async () => {
      vi.mocked(aiClient.generate).mockResolvedValue({ text: 'Step result' });

      const mockFile = new File(['console.log(1)'], 'test.ts', { type: 'text/plain' });
      const result = await runPipeline(
        'Project description',
        [{ file: mockFile, content: 'console.log(1)', status: 'success' }],
        { provider: 'gemini', model: 'gemini-pro' }
      );

      expect(result.results).toHaveLength(4);
      expect(result.results.every(r => r.status === 'done')).toBe(true);
      expect(result.isRunning).toBe(false);
    });

    it('should stop execution when signal is aborted', async () => {
      const controller = new AbortController();
      vi.mocked(aiClient.generate).mockImplementation(async () => {
        controller.abort();
        return { text: 'Result' };
      });

      const result = await runPipeline(
        'Project description',
        [],
        { provider: 'gemini', model: 'gemini-pro' },
        controller.signal
      );

      expect(result.isRunning).toBe(false);
      expect(result.results.some(r => r.status === 'running')).toBe(false);
    });
  });
});
