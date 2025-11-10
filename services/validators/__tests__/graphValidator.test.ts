/**
 * Graph Validator Tests
 * Tests for workflow graph validation and analysis
 */

import { describe, it, expect } from 'vitest';
import { validateGraph, analyzeGraph } from '../graphValidator';
import { N8nWorkflow } from '../../../types';

describe('graphValidator', () => {
  describe('analyzeGraph', () => {
    it('should detect trigger nodes correctly', () => {
      const workflow: N8nWorkflow = {
        name: 'Test Workflow',
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'action',
            name: 'Action',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
        ],
        connections: {
          start: {
            main: [[{ node: 'action', type: 'main' }]],
          },
        },
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const analysis = analyzeGraph(workflow);

      expect(analysis.hasTrigger).toBe(true);
      expect(analysis.triggerNodes).toContain('start');
      expect(analysis.triggerNodes).toHaveLength(1);
    });

    it('should detect orphaned nodes', () => {
      const workflow: N8nWorkflow = {
        name: 'Test Workflow',
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'orphan',
            name: 'Orphan',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
        ],
        connections: {},
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const analysis = analyzeGraph(workflow);

      expect(analysis.orphanedNodes).toContain('start');
      expect(analysis.orphanedNodes).toContain('orphan');
      expect(analysis.allNodesConnected).toBe(false);
    });

    it('should detect unreachable nodes', () => {
      const workflow: N8nWorkflow = {
        name: 'Test Workflow',
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'connected',
            name: 'Connected',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
          {
            id: 'unreachable',
            name: 'Unreachable',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [650, 300],
            parameters: {},
          },
        ],
        connections: {
          start: {
            main: [[{ node: 'connected', type: 'main' }]],
          },
        },
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const analysis = analyzeGraph(workflow);

      expect(analysis.unreachableNodes).toContain('unreachable');
      expect(analysis.unreachableNodes).not.toContain('connected');
    });

    it('should detect circular references', () => {
      const workflow: N8nWorkflow = {
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node1',
            name: 'Node 1',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'node2',
            name: 'Node 2',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
        ],
        connections: {
          node1: {
            main: [[{ node: 'node2', type: 'main' }]],
          },
          node2: {
            main: [[{ node: 'node1', type: 'main' }]],
          },
        },
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const analysis = analyzeGraph(workflow);

      expect(analysis.circularReferences).toBe(true);
    });

    it('should correctly analyze a valid sequential workflow', () => {
      const workflow: N8nWorkflow = {
        name: 'Valid Workflow',
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'process',
            name: 'Process',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
          {
            id: 'end',
            name: 'End',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [650, 300],
            parameters: {},
          },
        ],
        connections: {
          start: {
            main: [[{ node: 'process', type: 'main' }]],
          },
          process: {
            main: [[{ node: 'end', type: 'main' }]],
          },
        },
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const analysis = analyzeGraph(workflow);

      expect(analysis.hasTrigger).toBe(true);
      expect(analysis.orphanedNodes).toHaveLength(0);
      expect(analysis.unreachableNodes).toHaveLength(0);
      expect(analysis.circularReferences).toBe(false);
      expect(analysis.allNodesConnected).toBe(true);
    });
  });

  describe('validateGraph', () => {
    it('should return errors for workflow without trigger', () => {
      const workflow: N8nWorkflow = {
        name: 'No Trigger',
        nodes: [
          {
            id: 'action',
            name: 'Action',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
        ],
        connections: {},
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const result = validateGraph(workflow);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2); // No trigger + orphaned node
      expect(result.errors.some((e) => e.code === 'NO_TRIGGER')).toBe(true);
    });

    it('should return errors for orphaned nodes', () => {
      const workflow: N8nWorkflow = {
        name: 'Orphaned Node',
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'orphan',
            name: 'Orphan',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
        ],
        connections: {},
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const result = validateGraph(workflow);

      expect(result.errors.some((e) => e.code === 'ORPHANED_NODE')).toBe(true);
    });

    it('should validate a correct workflow without errors', () => {
      const workflow: N8nWorkflow = {
        name: 'Valid Workflow',
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
          },
          {
            id: 'action',
            name: 'Action',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {},
          },
        ],
        connections: {
          start: {
            main: [[{ node: 'action', type: 'main' }]],
          },
        },
        active: false,
        settings: {},
        id: 'test-workflow',
      };

      const result = validateGraph(workflow);

      expect(result.errors).toHaveLength(0);
    });
  });
});
