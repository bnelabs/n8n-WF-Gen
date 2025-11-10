/**
 * Structure Validator Tests
 * Tests for workflow structure validation
 */

import { describe, it, expect } from 'vitest';
import { validateStructure } from '../structureValidator';

describe('structureValidator', () => {
  describe('validateStructure', () => {
    it('should reject non-object workflows', () => {
      const result = validateStructure(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_WORKFLOW');
    });

    it('should reject workflows without name', () => {
      const workflow = {
        nodes: [],
        connections: {},
      };

      const result = validateStructure(workflow);

      expect(result.errors.some((e) => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('should reject workflows without nodes', () => {
      const workflow = {
        name: 'Test',
        connections: {},
      };

      const result = validateStructure(workflow);

      expect(result.errors.some((e) => e.code === 'MISSING_NODES')).toBe(true);
    });

    it('should reject workflows with empty nodes array', () => {
      const workflow = {
        name: 'Test',
        nodes: [],
        connections: {},
      };

      const result = validateStructure(workflow);

      expect(result.errors.some((e) => e.code === 'EMPTY_NODES')).toBe(true);
    });

    it('should reject workflows without connections', () => {
      const workflow = {
        name: 'Test',
        nodes: [
          {
            id: 'node1',
            name: 'Node 1',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
        ],
      };

      const result = validateStructure(workflow);

      expect(result.errors.some((e) => e.code === 'MISSING_CONNECTIONS')).toBe(true);
    });

    it('should detect duplicate node IDs', () => {
      const workflow = {
        name: 'Test',
        nodes: [
          {
            id: 'duplicate',
            name: 'Node 1',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'duplicate',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
        ],
        connections: {},
      };

      const result = validateStructure(workflow);

      expect(result.errors.some((e) => e.code === 'DUPLICATE_NODE_ID')).toBe(true);
    });

    it('should warn about missing optional properties', () => {
      const workflow = {
        name: 'Test',
        nodes: [
          {
            id: 'node1',
            name: 'Node 1',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
        ],
        connections: {},
      };

      const result = validateStructure(workflow);

      expect(result.warnings.some((w) => w.code === 'MISSING_ACTIVE')).toBe(true);
      expect(result.warnings.some((w) => w.code === 'MISSING_SETTINGS')).toBe(true);
      expect(result.warnings.some((w) => w.code === 'MISSING_ID')).toBe(true);
    });

    it('should validate a complete, valid workflow', () => {
      const workflow = {
        name: 'Valid Workflow',
        nodes: [
          {
            id: 'node1',
            name: 'Start Node',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
        ],
        connections: {},
        active: false,
        settings: {},
        id: 'workflow-123',
      };

      const result = validateStructure(workflow);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect nodes missing required properties', () => {
      const workflow = {
        name: 'Test',
        nodes: [
          {
            // Missing id
            name: 'Node 1',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'node2',
            // Missing name
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
          {
            id: 'node3',
            name: 'Node 3',
            // Missing type
            typeVersion: 1,
            position: [650, 300],
            parameters: {},
          },
        ],
        connections: {},
        active: false,
        settings: {},
        id: 'workflow-123',
      };

      const result = validateStructure(workflow);

      expect(result.errors.some((e) => e.code === 'MISSING_NODE_ID')).toBe(true);
      expect(result.warnings.some((w) => w.code === 'MISSING_NODE_NAME')).toBe(true);
      expect(result.errors.some((e) => e.code === 'MISSING_NODE_TYPE')).toBe(true);
    });
  });
});
