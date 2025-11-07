/**
 * Intent Detection
 * Analyzes user description to detect services, triggers, and actions
 */

export interface DetectedIntent {
  services: DetectedService[];
  trigger: DetectedTrigger;
  actions: DetectedAction[];
  dataOperations: string[];
  conditions: DetectedCondition[];
}

export interface DetectedService {
  name: string;
  type: 'ecommerce' | 'crm' | 'communication' | 'productivity' | 'database' | 'api';
  confidence: number;
  keywords: string[];
}

export interface DetectedTrigger {
  type: 'manual' | 'webhook' | 'schedule' | 'event';
  description: string;
  keywords: string[];
}

export interface DetectedAction {
  type: string;
  service?: string;
  operation?: string;
  description: string;
}

export interface DetectedCondition {
  type: 'if' | 'switch' | 'filter';
  description: string;
}

// Service detection patterns
const SERVICE_PATTERNS: Record<string, { keywords: string[]; type: DetectedService['type'] }> = {
  shopify: {
    keywords: ['shopify', 'shop', 'store order', 'shopify order', 'shopify product'],
    type: 'ecommerce',
  },
  woocommerce: {
    keywords: ['woocommerce', 'woo commerce', 'wordpress store', 'woo'],
    type: 'ecommerce',
  },
  hubspot: {
    keywords: ['hubspot', 'hub spot', 'hubspot crm', 'hubspot contact', 'hubspot deal'],
    type: 'crm',
  },
  salesforce: {
    keywords: ['salesforce', 'sfdc', 'sales force', 'salesforce lead', 'salesforce opportunity'],
    type: 'crm',
  },
  slack: {
    keywords: ['slack', 'slack message', 'slack channel', 'slack notification'],
    type: 'communication',
  },
  gmail: {
    keywords: ['gmail', 'google mail', 'gmail email', 'send gmail'],
    type: 'communication',
  },
  sendgrid: {
    keywords: ['sendgrid', 'send grid', 'sendgrid email'],
    type: 'communication',
  },
  googleSheets: {
    keywords: ['google sheets', 'google sheet', 'spreadsheet', 'gsheet', 'google spreadsheet'],
    type: 'productivity',
  },
  airtable: {
    keywords: ['airtable', 'air table', 'airtable base', 'airtable table'],
    type: 'database',
  },
  notion: {
    keywords: ['notion', 'notion database', 'notion page'],
    type: 'productivity',
  },
  http: {
    keywords: ['api', 'http', 'rest', 'endpoint', 'web service', 'fetch data', 'call api'],
    type: 'api',
  },
};

// Trigger detection patterns
const TRIGGER_PATTERNS = {
  manual: ['manually', 'manual start', 'when i run', 'when triggered', 'on demand'],
  webhook: ['webhook', 'http request', 'api call', 'when receives', 'incoming request', 'http endpoint'],
  schedule: [
    'every',
    'daily',
    'weekly',
    'monthly',
    'hourly',
    'schedule',
    'cron',
    'at 9 am',
    'every monday',
    'every hour',
    'recurring',
  ],
  event: ['when', 'on', 'arrives', 'created', 'updated', 'new', 'trigger'],
};

// Action detection patterns
const ACTION_PATTERNS = {
  send: ['send', 'email', 'message', 'notify', 'post'],
  get: ['get', 'fetch', 'retrieve', 'read', 'find', 'load'],
  create: ['create', 'add', 'insert', 'new', 'make'],
  update: ['update', 'modify', 'change', 'edit', 'set'],
  delete: ['delete', 'remove', 'clear'],
  transform: ['transform', 'convert', 'map', 'parse', 'format'],
  filter: ['filter', 'where', 'only', 'exclude', 'include'],
};

// Condition detection patterns
const CONDITION_PATTERNS = {
  if: ['if', 'when', 'check if', 'if condition', 'based on'],
  switch: ['switch', 'multiple conditions', 'different cases', 'route by'],
  filter: ['filter', 'only', 'where', 'that match', 'exclude'],
};

export function detectIntent(description: string): DetectedIntent {
  const lowerDesc = description.toLowerCase();

  return {
    services: detectServices(lowerDesc),
    trigger: detectTrigger(lowerDesc),
    actions: detectActions(lowerDesc),
    dataOperations: detectDataOperations(lowerDesc),
    conditions: detectConditions(lowerDesc),
  };
}

function detectServices(description: string): DetectedService[] {
  const detected: DetectedService[] = [];

  Object.entries(SERVICE_PATTERNS).forEach(([serviceName, pattern]) => {
    const matchedKeywords: string[] = [];
    let matches = 0;

    pattern.keywords.forEach(keyword => {
      if (description.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    });

    if (matches > 0) {
      detected.push({
        name: serviceName,
        type: pattern.type,
        confidence: matches / pattern.keywords.length,
        keywords: matchedKeywords,
      });
    }
  });

  // Sort by confidence
  detected.sort((a, b) => b.confidence - a.confidence);

  return detected;
}

function detectTrigger(description: string): DetectedTrigger {
  let bestMatch: DetectedTrigger = {
    type: 'manual',
    description: 'Manual start',
    keywords: [],
  };

  let maxMatches = 0;

  Object.entries(TRIGGER_PATTERNS).forEach(([triggerType, keywords]) => {
    const matchedKeywords: string[] = [];
    let matches = 0;

    keywords.forEach(keyword => {
      if (description.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    });

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = {
        type: triggerType as DetectedTrigger['type'],
        description: `Detected ${triggerType} trigger`,
        keywords: matchedKeywords,
      };
    }
  });

  return bestMatch;
}

function detectActions(description: string): DetectedAction[] {
  const actions: DetectedAction[] = [];

  Object.entries(ACTION_PATTERNS).forEach(([actionType, keywords]) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = description.match(regex);

      if (matches) {
        // Try to extract what comes after the action keyword
        const contextRegex = new RegExp(`${keyword}\\s+([\\w\\s]+?)(?:,|\\.|to|from|and|then|$)`, 'i');
        const contextMatch = description.match(contextRegex);

        actions.push({
          type: actionType,
          description: contextMatch ? contextMatch[0] : keyword,
        });
      }
    });
  });

  return actions;
}

function detectDataOperations(description: string): string[] {
  const operations: string[] = [];

  const dataOpPatterns = {
    transform: ['transform', 'convert', 'map', 'format', 'parse'],
    filter: ['filter', 'where', 'only items', 'exclude'],
    merge: ['merge', 'combine', 'join', 'concat'],
    split: ['split', 'separate', 'divide', 'break up'],
    aggregate: ['aggregate', 'sum', 'count', 'group', 'total'],
    sort: ['sort', 'order', 'arrange'],
  };

  Object.entries(dataOpPatterns).forEach(([operation, keywords]) => {
    if (keywords.some(keyword => description.includes(keyword))) {
      operations.push(operation);
    }
  });

  return operations;
}

function detectConditions(description: string): DetectedCondition[] {
  const conditions: DetectedCondition[] = [];

  Object.entries(CONDITION_PATTERNS).forEach(([condType, keywords]) => {
    keywords.forEach(keyword => {
      if (description.includes(keyword)) {
        // Try to extract the condition details
        const contextRegex = new RegExp(`${keyword}\\s+([^,\\.]+)`, 'i');
        const match = description.match(contextRegex);

        conditions.push({
          type: condType as DetectedCondition['type'],
          description: match ? match[0] : keyword,
        });
      }
    });
  });

  return conditions;
}

export function getIntentSummary(intent: DetectedIntent): string {
  const lines: string[] = [];

  if (intent.services.length > 0) {
    lines.push('Detected Services:');
    intent.services.forEach(service => {
      lines.push(`  • ${service.name} (${service.type}) - confidence: ${(service.confidence * 100).toFixed(0)}%`);
    });
  }

  lines.push(`\nTrigger Type: ${intent.trigger.type}`);

  if (intent.actions.length > 0) {
    lines.push('\nActions:');
    intent.actions.slice(0, 5).forEach(action => {
      lines.push(`  • ${action.type}: ${action.description}`);
    });
  }

  if (intent.dataOperations.length > 0) {
    lines.push(`\nData Operations: ${intent.dataOperations.join(', ')}`);
  }

  if (intent.conditions.length > 0) {
    lines.push(`\nConditional Logic: ${intent.conditions.map(c => c.type).join(', ')}`);
  }

  return lines.join('\n');
}
