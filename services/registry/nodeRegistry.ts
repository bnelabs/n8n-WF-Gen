/**
 * N8N Node Registry
 * Comprehensive database of n8n node types with their parameters, categories, and connection rules
 */

export interface NodeParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'json' | 'collection' | 'fixedCollection';
  required: boolean;
  default?: any;
  description: string;
  options?: { name: string; value: string }[];
  placeholder?: string;
}

export interface NodeDefinition {
  type: string;
  displayName: string;
  category: 'trigger' | 'action' | 'integration' | 'data' | 'logic' | 'utility';
  description: string;
  parameters: NodeParameter[];
  outputs: string[]; // e.g., ['main'] or ['output_0', 'output_1'] for conditional nodes
  inputs: string[];  // e.g., ['main']
  examples?: string[];
  keywords?: string[]; // For better search/matching
}

// Core Trigger Nodes
export const TRIGGER_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.start',
    displayName: 'Start',
    category: 'trigger',
    description: 'Manual workflow start trigger',
    parameters: [],
    outputs: ['main'],
    inputs: [],
    keywords: ['manual', 'start', 'begin'],
  },
  {
    type: 'n8n-nodes-base.webhook',
    displayName: 'Webhook',
    category: 'trigger',
    description: 'Receives HTTP requests and triggers workflow',
    parameters: [
      {
        name: 'httpMethod',
        type: 'options',
        required: true,
        default: 'GET',
        description: 'HTTP method to listen for',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        name: 'path',
        type: 'string',
        required: true,
        default: '',
        description: 'Webhook path',
        placeholder: 'my-webhook',
      },
      {
        name: 'responseMode',
        type: 'options',
        required: false,
        default: 'onReceived',
        description: 'When to respond to webhook',
        options: [
          { name: 'On Received', value: 'onReceived' },
          { name: 'Last Node', value: 'lastNode' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: [],
    keywords: ['webhook', 'http', 'api', 'endpoint', 'receive'],
    examples: ['Receive webhook from external service', 'Listen for POST requests'],
  },
  {
    type: 'n8n-nodes-base.cron',
    displayName: 'Cron',
    category: 'trigger',
    description: 'Triggers workflow on a schedule',
    parameters: [
      {
        name: 'triggerTimes',
        type: 'fixedCollection',
        required: true,
        default: {},
        description: 'Schedule configuration',
      },
      {
        name: 'mode',
        type: 'options',
        required: true,
        default: 'everyMinute',
        description: 'Schedule mode',
        options: [
          { name: 'Every Minute', value: 'everyMinute' },
          { name: 'Every Hour', value: 'everyHour' },
          { name: 'Every Day', value: 'everyDay' },
          { name: 'Every Week', value: 'everyWeek' },
          { name: 'Every Month', value: 'everyMonth' },
          { name: 'Custom', value: 'custom' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: [],
    keywords: ['schedule', 'cron', 'timer', 'interval', 'recurring'],
    examples: ['Run every Monday at 9 AM', 'Execute daily at midnight', 'Trigger every hour'],
  },
  {
    type: 'n8n-nodes-base.scheduleTrigger',
    displayName: 'Schedule Trigger',
    category: 'trigger',
    description: 'Triggers workflow on a schedule (user-friendly)',
    parameters: [
      {
        name: 'rule',
        type: 'fixedCollection',
        required: true,
        default: {},
        description: 'Schedule rule configuration',
      },
    ],
    outputs: ['main'],
    inputs: [],
    keywords: ['schedule', 'time', 'recurring', 'periodic'],
  },
];

// HTTP & API Nodes
export const HTTP_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.httpRequest',
    displayName: 'HTTP Request',
    category: 'action',
    description: 'Makes HTTP requests to external APIs',
    parameters: [
      {
        name: 'url',
        type: 'string',
        required: true,
        default: '',
        description: 'The URL to make the request to',
        placeholder: 'https://api.example.com/endpoint',
      },
      {
        name: 'method',
        type: 'options',
        required: true,
        default: 'GET',
        description: 'The HTTP method to use',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        ],
      },
      {
        name: 'authentication',
        type: 'options',
        required: false,
        default: 'none',
        description: 'Authentication method',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Basic Auth', value: 'basicAuth' },
          { name: 'Header Auth', value: 'headerAuth' },
          { name: 'OAuth2', value: 'oAuth2' },
        ],
      },
      {
        name: 'sendHeaders',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Send custom headers',
      },
      {
        name: 'sendBody',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Send request body',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['http', 'api', 'rest', 'request', 'fetch', 'call'],
    examples: ['Call external API', 'Fetch data from REST endpoint', 'POST data to webhook'],
  },
];

// Logic & Control Flow Nodes
export const LOGIC_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.if',
    displayName: 'IF',
    category: 'logic',
    description: 'Conditional routing based on comparison',
    parameters: [
      {
        name: 'conditions',
        type: 'fixedCollection',
        required: true,
        default: {},
        description: 'Conditions to check',
      },
      {
        name: 'combineOperation',
        type: 'options',
        required: false,
        default: 'all',
        description: 'How to combine multiple conditions',
        options: [
          { name: 'ALL (AND)', value: 'all' },
          { name: 'ANY (OR)', value: 'any' },
        ],
      },
    ],
    outputs: ['main', 'main'], // output_0 (true), output_1 (false)
    inputs: ['main'],
    keywords: ['if', 'condition', 'conditional', 'branch', 'split'],
    examples: ['Route based on status field', 'Check if value exists', 'Conditional logic'],
  },
  {
    type: 'n8n-nodes-base.switch',
    displayName: 'Switch',
    category: 'logic',
    description: 'Routes items to different branches based on rules',
    parameters: [
      {
        name: 'mode',
        type: 'options',
        required: true,
        default: 'rules',
        description: 'Switch mode',
        options: [
          { name: 'Rules', value: 'rules' },
          { name: 'Expression', value: 'expression' },
        ],
      },
      {
        name: 'rules',
        type: 'fixedCollection',
        required: false,
        default: {},
        description: 'Routing rules',
      },
    ],
    outputs: ['main', 'main', 'main', 'main'], // Multiple outputs
    inputs: ['main'],
    keywords: ['switch', 'route', 'multiple', 'branch', 'case'],
    examples: ['Route by status value', 'Multiple conditional branches'],
  },
  {
    type: 'n8n-nodes-base.merge',
    displayName: 'Merge',
    category: 'data',
    description: 'Merges data from multiple branches',
    parameters: [
      {
        name: 'mode',
        type: 'options',
        required: true,
        default: 'append',
        description: 'How to merge data',
        options: [
          { name: 'Append', value: 'append' },
          { name: 'Keep Key Matches', value: 'keepKeyMatches' },
          { name: 'Merge By Index', value: 'mergeByIndex' },
          { name: 'Merge By Key', value: 'mergeByKey' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main', 'main'], // Two inputs
    keywords: ['merge', 'combine', 'join', 'union'],
    examples: ['Combine results from multiple sources', 'Join two data streams'],
  },
];

// Data Manipulation Nodes
export const DATA_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.set',
    displayName: 'Set',
    category: 'data',
    description: 'Sets values on items',
    parameters: [
      {
        name: 'mode',
        type: 'options',
        required: true,
        default: 'manual',
        description: 'How to set values',
        options: [
          { name: 'Manual', value: 'manual' },
          { name: 'Expression', value: 'expression' },
        ],
      },
      {
        name: 'values',
        type: 'fixedCollection',
        required: false,
        default: {},
        description: 'Values to set',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['set', 'assign', 'modify', 'update', 'change'],
    examples: ['Add new fields to items', 'Transform data structure', 'Set variables'],
  },
  {
    type: 'n8n-nodes-base.code',
    displayName: 'Code',
    category: 'data',
    description: 'Run custom JavaScript code',
    parameters: [
      {
        name: 'mode',
        type: 'options',
        required: true,
        default: 'runOnceForAllItems',
        description: 'Execution mode',
        options: [
          { name: 'Run Once for All Items', value: 'runOnceForAllItems' },
          { name: 'Run Once for Each Item', value: 'runOnceForEachItem' },
        ],
      },
      {
        name: 'jsCode',
        type: 'string',
        required: true,
        default: '// Add your code here\nreturn items;',
        description: 'JavaScript code to execute',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['code', 'javascript', 'function', 'script', 'custom'],
    examples: ['Custom data transformation', 'Complex calculations', 'Custom logic'],
  },
  {
    type: 'n8n-nodes-base.filter',
    displayName: 'Filter',
    category: 'data',
    description: 'Filters items based on conditions',
    parameters: [
      {
        name: 'conditions',
        type: 'fixedCollection',
        required: true,
        default: {},
        description: 'Filter conditions',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['filter', 'where', 'remove', 'exclude', 'include'],
    examples: ['Filter by status', 'Remove empty items', 'Keep only matching records'],
  },
  {
    type: 'n8n-nodes-base.itemLists',
    displayName: 'Item Lists',
    category: 'data',
    description: 'Manipulate lists of items (split, aggregate, sort)',
    parameters: [
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'splitOutItems',
        description: 'Operation to perform',
        options: [
          { name: 'Split Out Items', value: 'splitOutItems' },
          { name: 'Aggregate Items', value: 'aggregateItems' },
          { name: 'Sort Items', value: 'sortItems' },
          { name: 'Limit Items', value: 'limit' },
          { name: 'Remove Duplicates', value: 'removeDuplicates' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['list', 'array', 'split', 'aggregate', 'sort', 'limit'],
    examples: ['Split array into items', 'Aggregate results', 'Sort by field'],
  },
];

// Integration Nodes - E-commerce
export const ECOMMERCE_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.shopify',
    displayName: 'Shopify',
    category: 'integration',
    description: 'Work with Shopify store data',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'order',
        description: 'Resource to operate on',
        options: [
          { name: 'Order', value: 'order' },
          { name: 'Product', value: 'product' },
          { name: 'Customer', value: 'customer' },
          { name: 'Inventory', value: 'inventory' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'get',
        description: 'Operation to perform',
        options: [
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['shopify', 'ecommerce', 'store', 'order', 'product', 'customer'],
    examples: ['Get order details', 'Create new product', 'Update inventory'],
  },
  {
    type: 'n8n-nodes-base.shopifyTrigger',
    displayName: 'Shopify Trigger',
    category: 'trigger',
    description: 'Triggers on Shopify events (orders, products, etc.)',
    parameters: [
      {
        name: 'topic',
        type: 'options',
        required: true,
        default: 'orders/create',
        description: 'Event to listen for',
        options: [
          { name: 'Order Created', value: 'orders/create' },
          { name: 'Order Updated', value: 'orders/updated' },
          { name: 'Product Created', value: 'products/create' },
          { name: 'Customer Created', value: 'customers/create' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: [],
    keywords: ['shopify', 'trigger', 'webhook', 'order', 'product'],
    examples: ['When new order is created', 'When product is updated'],
  },
  {
    type: 'n8n-nodes-base.wooCommerce',
    displayName: 'WooCommerce',
    category: 'integration',
    description: 'Work with WooCommerce store data',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'order',
        description: 'Resource to operate on',
        options: [
          { name: 'Order', value: 'order' },
          { name: 'Product', value: 'product' },
          { name: 'Customer', value: 'customer' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'get',
        description: 'Operation to perform',
        options: [
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['woocommerce', 'wordpress', 'ecommerce', 'order', 'product'],
  },
];

// Integration Nodes - CRM
export const CRM_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.hubspot',
    displayName: 'HubSpot',
    category: 'integration',
    description: 'Work with HubSpot CRM',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'contact',
        description: 'Resource to operate on',
        options: [
          { name: 'Contact', value: 'contact' },
          { name: 'Company', value: 'company' },
          { name: 'Deal', value: 'deal' },
          { name: 'Ticket', value: 'ticket' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'get',
        description: 'Operation to perform',
        options: [
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['hubspot', 'crm', 'contact', 'deal', 'company', 'customer'],
    examples: ['Get contact details', 'Create new deal', 'Update company information'],
  },
  {
    type: 'n8n-nodes-base.salesforce',
    displayName: 'Salesforce',
    category: 'integration',
    description: 'Work with Salesforce CRM',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'lead',
        description: 'Resource to operate on',
        options: [
          { name: 'Lead', value: 'lead' },
          { name: 'Contact', value: 'contact' },
          { name: 'Account', value: 'account' },
          { name: 'Opportunity', value: 'opportunity' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'get',
        description: 'Operation to perform',
        options: [
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['salesforce', 'crm', 'lead', 'opportunity', 'account'],
    examples: ['Create new lead', 'Get opportunity details', 'Update account'],
  },
];

// Integration Nodes - Communication
export const COMMUNICATION_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.slack',
    displayName: 'Slack',
    category: 'integration',
    description: 'Send messages and interact with Slack',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'message',
        description: 'Resource to operate on',
        options: [
          { name: 'Message', value: 'message' },
          { name: 'Channel', value: 'channel' },
          { name: 'User', value: 'user' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'post',
        description: 'Operation to perform',
        options: [
          { name: 'Post', value: 'post' },
          { name: 'Update', value: 'update' },
          { name: 'Get', value: 'get' },
        ],
      },
      {
        name: 'channel',
        type: 'string',
        required: false,
        default: '',
        description: 'Channel to send message to',
        placeholder: '#general',
      },
      {
        name: 'text',
        type: 'string',
        required: false,
        default: '',
        description: 'Message text',
        placeholder: 'Hello from n8n!',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['slack', 'message', 'chat', 'notification', 'communicate'],
    examples: ['Send message to channel', 'Post notification', 'Update message'],
  },
  {
    type: 'n8n-nodes-base.gmail',
    displayName: 'Gmail',
    category: 'integration',
    description: 'Send and manage Gmail emails',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'message',
        description: 'Resource to operate on',
        options: [
          { name: 'Message', value: 'message' },
          { name: 'Draft', value: 'draft' },
          { name: 'Label', value: 'label' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'send',
        description: 'Operation to perform',
        options: [
          { name: 'Send', value: 'send' },
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Delete', value: 'delete' },
        ],
      },
      {
        name: 'to',
        type: 'string',
        required: false,
        default: '',
        description: 'Recipient email address',
        placeholder: 'user@example.com',
      },
      {
        name: 'subject',
        type: 'string',
        required: false,
        default: '',
        description: 'Email subject',
        placeholder: 'Subject line',
      },
      {
        name: 'message',
        type: 'string',
        required: false,
        default: '',
        description: 'Email body',
        placeholder: 'Email content',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['gmail', 'email', 'mail', 'send', 'message'],
    examples: ['Send email', 'Get emails from inbox', 'Create draft'],
  },
  {
    type: 'n8n-nodes-base.sendGrid',
    displayName: 'SendGrid',
    category: 'integration',
    description: 'Send emails via SendGrid',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'mail',
        description: 'Resource to operate on',
        options: [
          { name: 'Mail', value: 'mail' },
          { name: 'Contact', value: 'contact' },
          { name: 'List', value: 'list' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'send',
        description: 'Operation to perform',
        options: [
          { name: 'Send', value: 'send' },
        ],
      },
      {
        name: 'to',
        type: 'string',
        required: true,
        default: '',
        description: 'Recipient email',
        placeholder: 'recipient@example.com',
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        default: '',
        description: 'Email subject',
      },
      {
        name: 'content',
        type: 'string',
        required: true,
        default: '',
        description: 'Email content',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['sendgrid', 'email', 'send', 'mail'],
    examples: ['Send transactional email', 'Send welcome email'],
  },
];

// Integration Nodes - Productivity
export const PRODUCTIVITY_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.googleSheets',
    displayName: 'Google Sheets',
    category: 'integration',
    description: 'Read from and write to Google Sheets',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'spreadsheet',
        description: 'Resource to operate on',
        options: [
          { name: 'Spreadsheet', value: 'spreadsheet' },
          { name: 'Sheet', value: 'sheet' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'append',
        description: 'Operation to perform',
        options: [
          { name: 'Append', value: 'append' },
          { name: 'Read', value: 'read' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
      },
      {
        name: 'documentId',
        type: 'string',
        required: false,
        default: '',
        description: 'Google Sheets document ID',
        placeholder: '1234567890abcdef',
      },
      {
        name: 'sheetName',
        type: 'string',
        required: false,
        default: '',
        description: 'Sheet name',
        placeholder: 'Sheet1',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['google', 'sheets', 'spreadsheet', 'excel', 'data', 'table'],
    examples: ['Append row to sheet', 'Read all rows', 'Update specific row'],
  },
  {
    type: 'n8n-nodes-base.airtable',
    displayName: 'Airtable',
    category: 'integration',
    description: 'Read from and write to Airtable bases',
    parameters: [
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'list',
        description: 'Operation to perform',
        options: [
          { name: 'List', value: 'list' },
          { name: 'Read', value: 'read' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
      },
      {
        name: 'baseId',
        type: 'string',
        required: false,
        default: '',
        description: 'Airtable base ID',
        placeholder: 'appXXXXXXXXXXXXXX',
      },
      {
        name: 'table',
        type: 'string',
        required: false,
        default: '',
        description: 'Table name',
        placeholder: 'Table 1',
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['airtable', 'database', 'table', 'record', 'base'],
    examples: ['List all records', 'Create new record', 'Update record'],
  },
  {
    type: 'n8n-nodes-base.notion',
    displayName: 'Notion',
    category: 'integration',
    description: 'Work with Notion databases and pages',
    parameters: [
      {
        name: 'resource',
        type: 'options',
        required: true,
        default: 'page',
        description: 'Resource to operate on',
        options: [
          { name: 'Page', value: 'page' },
          { name: 'Database', value: 'database' },
          { name: 'Block', value: 'block' },
        ],
      },
      {
        name: 'operation',
        type: 'options',
        required: true,
        default: 'get',
        description: 'Operation to perform',
        options: [
          { name: 'Get', value: 'get' },
          { name: 'Get All', value: 'getAll' },
          { name: 'Create', value: 'create' },
          { name: 'Update', value: 'update' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['notion', 'database', 'page', 'notes', 'wiki'],
    examples: ['Create page', 'Query database', 'Update page properties'],
  },
];

// Utility Nodes
export const UTILITY_NODES: NodeDefinition[] = [
  {
    type: 'n8n-nodes-base.noOp',
    displayName: 'No Operation',
    category: 'utility',
    description: 'Does nothing, useful as placeholder',
    parameters: [],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['noop', 'placeholder', 'pass', 'empty'],
  },
  {
    type: 'n8n-nodes-base.wait',
    displayName: 'Wait',
    category: 'utility',
    description: 'Pauses workflow execution',
    parameters: [
      {
        name: 'amount',
        type: 'number',
        required: true,
        default: 1,
        description: 'Amount of time to wait',
      },
      {
        name: 'unit',
        type: 'options',
        required: true,
        default: 'seconds',
        description: 'Time unit',
        options: [
          { name: 'Seconds', value: 'seconds' },
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' },
          { name: 'Days', value: 'days' },
        ],
      },
    ],
    outputs: ['main'],
    inputs: ['main'],
    keywords: ['wait', 'delay', 'pause', 'sleep'],
    examples: ['Wait 5 seconds', 'Delay 1 hour', 'Pause 2 minutes'],
  },
  {
    type: 'n8n-nodes-base.stopAndError',
    displayName: 'Stop and Error',
    category: 'utility',
    description: 'Stops workflow execution with error',
    parameters: [
      {
        name: 'message',
        type: 'string',
        required: false,
        default: 'Workflow stopped',
        description: 'Error message',
      },
    ],
    outputs: [],
    inputs: ['main'],
    keywords: ['stop', 'error', 'halt', 'terminate'],
  },
];

// Master node registry
export const NODE_REGISTRY = [
  ...TRIGGER_NODES,
  ...HTTP_NODES,
  ...LOGIC_NODES,
  ...DATA_NODES,
  ...ECOMMERCE_NODES,
  ...CRM_NODES,
  ...COMMUNICATION_NODES,
  ...PRODUCTIVITY_NODES,
  ...UTILITY_NODES,
];

// Helper functions
export function getNodeByType(type: string): NodeDefinition | undefined {
  return NODE_REGISTRY.find(node => node.type === type);
}

export function getNodesByCategory(category: string): NodeDefinition[] {
  return NODE_REGISTRY.filter(node => node.category === category);
}

export function searchNodes(query: string): NodeDefinition[] {
  const lowerQuery = query.toLowerCase();
  return NODE_REGISTRY.filter(node => {
    return (
      node.displayName.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.keywords?.some(k => k.includes(lowerQuery)) ||
      node.type.toLowerCase().includes(lowerQuery)
    );
  });
}

export function getTriggerNodes(): NodeDefinition[] {
  return getNodesByCategory('trigger');
}

export function getIntegrationNodes(): NodeDefinition[] {
  return getNodesByCategory('integration');
}

export function getNodeOutputs(type: string): string[] {
  const node = getNodeByType(type);
  return node?.outputs || ['main'];
}

export function getNodeInputs(type: string): string[] {
  const node = getNodeByType(type);
  return node?.inputs || ['main'];
}
