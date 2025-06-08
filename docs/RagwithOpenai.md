# Complete RAG System Documentation: OpenAI Assistants API with Vector Stores

## Building production-ready RAG systems in JavaScript

This comprehensive guide provides everything needed to build a Retrieval Augmented Generation (RAG) system using OpenAI's Assistants API with vector stores in JavaScript/Node.js. The documentation covers implementation details, best practices, performance optimization, and cost management strategies based on the latest 2024-2025 developments.

## 1. Complete JavaScript/Node.js Implementation Guide

### Initial Setup and Installation

```bash
npm install openai multer express cors helmet express-rate-limit
```

### Core Implementation Structure

```javascript
import OpenAI from 'openai';
import fs from 'fs';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create assistant with file search capability
const assistant = await client.beta.assistants.create({
  name: "Technical Documentation Assistant",
  instructions: "You are an expert assistant that searches through technical documentation to provide accurate, detailed responses with proper citations.",
  model: "gpt-4o",
  tools: [{"type": "file_search"}]
});
```

### Production-Ready RAG System Class

```javascript
class RAGSystem {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
    this.assistant = null;
    this.vectorStore = null;
    this.rateLimiter = new RateLimiter();
  }

  async initialize() {
    // Create assistant
    this.assistant = await this.client.beta.assistants.create({
      name: "RAG Assistant",
      instructions: "Answer questions based on uploaded documents. Provide specific citations and code examples where relevant.",
      model: "gpt-4o",
      tools: [{"type": "file_search"}]
    });

    // Create vector store with optimized chunking
    this.vectorStore = await this.client.beta.vectorStores.create({
      name: "Technical Books Knowledge Base",
      chunking_strategy: {
        type: "static",
        static: {
          max_chunk_size_tokens: 1000,  // Optimal for technical content
          chunk_overlap_tokens: 200      // Moderate overlap for context
        }
      }
    });

    // Link vector store to assistant
    await this.client.beta.assistants.update(this.assistant.id, {
      tool_resources: {
        file_search: {
          vector_store_ids: [this.vectorStore.id]
        }
      }
    });
  }

  async addDocuments(filePaths) {
    const fileStreams = filePaths.map(path => fs.createReadStream(path));
    
    const fileBatch = await this.client.beta.vectorStores.fileBatches.uploadAndPoll(
      this.vectorStore.id,
      { files: fileStreams }
    );

    console.log(`Added ${fileBatch.file_counts.completed} documents`);
    return fileBatch;
  }

  async query(question, threadId = null) {
    await this.rateLimiter.checkLimit();

    // Create or reuse thread
    if (!threadId) {
      const thread = await this.client.beta.threads.create();
      threadId = thread.id;
    }

    // Add message
    await this.client.beta.threads.messages.create(threadId, {
      role: "user",
      content: question
    });

    // Create and wait for run
    const run = await this.client.beta.threads.runs.createAndPoll(
      threadId,
      { 
        assistant_id: this.assistant.id,
        max_prompt_tokens: 20000,
        max_completion_tokens: 4000
      }
    );

    // Get response
    const messages = await this.client.beta.threads.messages.list(threadId);
    const response = messages.data[0];
    
    return {
      answer: response.content[0].text.value,
      citations: this.extractCitations(response),
      threadId,
      usage: run.usage
    };
  }

  extractCitations(message) {
    const citations = [];
    const annotations = message.content[0].text.annotations || [];
    
    annotations.forEach((annotation, index) => {
      if (annotation.file_citation) {
        citations.push({
          index: index + 1,
          fileId: annotation.file_citation.file_id,
          quote: annotation.file_citation.quote,
          text: annotation.text
        });
      }
    });
    
    return citations;
  }
}
```

## 2. Step-by-Step Setup Instructions

### Creating and Managing Vector Stores

```javascript
// Step 1: Create vector store with custom configuration
const vectorStore = await client.beta.vectorStores.create({
  name: "Technical Documentation",
  expires_after: {
    anchor: "last_active_at",
    days: 30  // Auto-delete after 30 days of inactivity
  },
  chunking_strategy: {
    type: "static",
    static: {
      max_chunk_size_tokens: 1000,
      chunk_overlap_tokens: 200
    }
  },
  metadata: {
    "project": "rag_system",
    "version": "1.0"
  }
});

// Step 2: Upload files with batch processing
const fileStreams = [
  fs.createReadStream('javascript_guide.pdf'),
  fs.createReadStream('nodejs_handbook.pdf'),
  fs.createReadStream('api_reference.txt')
];

const fileBatch = await client.beta.vectorStores.fileBatches.uploadAndPoll(
  vectorStore.id,
  { files: fileStreams }
);

// Step 3: Monitor upload status
console.log(`Upload status: ${fileBatch.status}`);
console.log(`Files processed: ${fileBatch.file_counts.completed}/${fileBatch.file_counts.total}`);

// Step 4: Attach to assistant
await client.beta.assistants.update(assistant.id, {
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.id]
    }
  }
});
```

## 3. Processing Large Technical Books (400+ Pages)

### Handling Large Documents

```javascript
async function uploadLargeTechnicalBook(bookPath, bookMetadata) {
  try {
    // Validate file size (max 512MB)
    const stats = fs.statSync(bookPath);
    if (stats.size > 512 * 1024 * 1024) {
      throw new Error('File exceeds 512MB limit');
    }

    // Upload file
    const bookFile = await client.files.create({
      file: fs.createReadStream(bookPath),
      purpose: 'assistants'
    });

    // Create dedicated vector store for large books
    const vectorStore = await client.beta.vectorStores.create({
      name: `Technical Book: ${bookMetadata.title}`,
      chunking_strategy: {
        type: "static",
        static: {
          max_chunk_size_tokens: 1200,  // Larger chunks for books
          chunk_overlap_tokens: 400     // More overlap for context
        }
      }
    });

    // Add file to vector store
    const vectorStoreFile = await client.beta.vectorStores.files.createAndPoll(
      vectorStore.id,
      { file_id: bookFile.id }
    );

    console.log(`Book processing status: ${vectorStoreFile.status}`);
    return { vectorStore, file: bookFile };
    
  } catch (error) {
    console.error('Error uploading book:', error);
    throw error;
  }
}
```

### Token and Size Estimations
- **400-page book**: ~200,000-400,000 tokens
- **Maximum tokens per file**: 5,000,000 tokens
- **Recommended chunk size for technical content**: 1000-1200 tokens
- **Overlap for code examples**: 400-500 tokens

## 4. Best Practices for Chunking Technical Documentation

### Optimized Chunking Strategy

```javascript
const technicalContentChunkingStrategy = {
  type: "static",
  static: {
    max_chunk_size_tokens: 1000,  // Balance between context and precision
    chunk_overlap_tokens: 400      // Preserve code blocks and context
  }
};

// For different content types
const chunkingStrategies = {
  code_heavy: {
    max_chunk_size_tokens: 1200,
    chunk_overlap_tokens: 500  // More overlap for code continuity
  },
  conceptual: {
    max_chunk_size_tokens: 800,
    chunk_overlap_tokens: 300  // Less overlap for narrative content
  },
  reference: {
    max_chunk_size_tokens: 600,
    chunk_overlap_tokens: 200  // Smaller chunks for quick lookups
  }
};
```

## 5. Querying for Code Examples and Concepts

### Advanced Query Implementation

```javascript
async function queryTechnicalContent(query, queryType = 'general') {
  const queryOptimizations = {
    code_example: {
      prefix: "Find code examples for: ",
      instructions: "Focus on complete, runnable code examples with proper syntax"
    },
    conceptual: {
      prefix: "Explain the concept of: ",
      instructions: "Provide clear explanations with practical examples"
    },
    debugging: {
      prefix: "Debug issue: ",
      instructions: "Identify potential causes and provide solutions with code"
    }
  };

  const optimization = queryOptimizations[queryType] || { prefix: "", instructions: "" };
  const optimizedQuery = optimization.prefix + query;

  // Create thread with specific instructions
  const thread = await client.beta.threads.create({
    messages: [{
      role: "user",
      content: optimizedQuery
    }]
  });

  // Run with custom parameters
  const run = await client.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant.id,
    additional_instructions: optimization.instructions,
    temperature: queryType === 'code_example' ? 0.1 : 0.7,
    max_completion_tokens: 4000
  });

  // Get and format response
  const messages = await client.beta.threads.messages.list(thread.id);
  const response = messages.data[0];
  
  return formatTechnicalResponse(response);
}
```

## 6. Error Handling and Edge Cases

### Comprehensive Error Management

```javascript
class RAGSystemError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'RAGSystemError';
    this.type = type;
    this.details = details;
  }
}

async function robustAPICall(apiFunction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (error instanceof RateLimitError) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${delay}ms before retry ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (error instanceof AuthenticationError) {
        throw new RAGSystemError('Authentication failed', 'AUTH_ERROR', { error });
      }
      
      if (attempt === maxRetries) {
        throw new RAGSystemError('Max retries exceeded', 'RETRY_EXHAUSTED', { 
          attempts: maxRetries, 
          lastError: error 
        });
      }
    }
  }
}

// Edge case handlers
const edgeCaseHandlers = {
  emptyQuery: (query) => {
    if (!query || query.trim().length === 0) {
      throw new RAGSystemError('Query cannot be empty', 'INVALID_QUERY');
    }
  },
  
  oversizedQuery: (query) => {
    const maxTokens = 8000;
    const estimatedTokens = Math.ceil(query.length / 4);
    if (estimatedTokens > maxTokens) {
      throw new RAGSystemError('Query exceeds token limit', 'QUERY_TOO_LONG', {
        estimatedTokens,
        maxTokens
      });
    }
  },
  
  noResults: (results) => {
    if (!results || results.length === 0) {
      return {
        answer: "I couldn't find relevant information in the documentation for your query.",
        citations: [],
        fallback: true
      };
    }
  }
};
```

## 7. Performance Optimization

### Caching and Performance Strategies

```javascript
import NodeCache from 'node-cache';

class CachedRAGSystem extends RAGSystem {
  constructor(apiKey) {
    super(apiKey);
    this.queryCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.embeddingCache = new NodeCache({ stdTTL: 86400 }); // 24 hour cache
  }

  async query(question, threadId = null) {
    // Check cache first
    const cacheKey = this.generateCacheKey(question);
    const cachedResult = this.queryCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Cache hit for query');
      return cachedResult;
    }

    // Perform actual query
    const result = await super.query(question, threadId);
    
    // Cache successful results
    if (result && !result.error) {
      this.queryCache.set(cacheKey, result);
    }
    
    return result;
  }

  generateCacheKey(query) {
    // Normalize query for better cache hits
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}

// Parallel processing for multiple queries
async function batchQuery(queries) {
  const batchSize = 5; // Process 5 queries in parallel
  const results = [];
  
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(query => ragSystem.query(query))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queryTimes: [],
      cacheHitRate: 0,
      errorRate: 0,
      tokenUsage: {
        input: 0,
        output: 0
      }
    };
  }

  async trackQuery(queryFunction) {
    const startTime = Date.now();
    let error = null;
    
    try {
      const result = await queryFunction();
      this.metrics.tokenUsage.input += result.usage?.prompt_tokens || 0;
      this.metrics.tokenUsage.output += result.usage?.completion_tokens || 0;
      return result;
    } catch (e) {
      error = e;
      this.metrics.errorRate++;
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.queryTimes.push(duration);
      
      console.log(`Query completed in ${duration}ms`, {
        avgTime: this.getAverageQueryTime(),
        errorRate: this.metrics.errorRate,
        tokenUsage: this.metrics.tokenUsage
      });
    }
  }

  getAverageQueryTime() {
    const sum = this.metrics.queryTimes.reduce((a, b) => a + b, 0);
    return sum / this.metrics.queryTimes.length || 0;
  }
}
```

## 8. Cost Management

### Cost Estimation and Tracking

```javascript
class CostTracker {
  constructor() {
    this.pricing = {
      'gpt-4o': { input: 2.50, output: 10.00 }, // per 1M tokens
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'storage': 0.10 // per GB per day
    };
    this.usage = {
      tokens: { input: 0, output: 0 },
      storage: 0, // in GB
      queries: 0
    };
  }

  trackUsage(result, model = 'gpt-4o') {
    this.usage.tokens.input += result.usage?.prompt_tokens || 0;
    this.usage.tokens.output += result.usage?.completion_tokens || 0;
    this.usage.queries++;
  }

  calculateCosts(model = 'gpt-4o') {
    const inputCost = (this.usage.tokens.input / 1_000_000) * this.pricing[model].input;
    const outputCost = (this.usage.tokens.output / 1_000_000) * this.pricing[model].output;
    const storageCost = this.usage.storage * this.pricing.storage * 30; // monthly
    
    return {
      input: inputCost.toFixed(2),
      output: outputCost.toFixed(2),
      storage: storageCost.toFixed(2),
      total: (inputCost + outputCost + storageCost).toFixed(2),
      details: this.usage
    };
  }
}

// Cost optimization strategies
const costOptimizationConfig = {
  useModelRouter: true, // Route simple queries to cheaper models
  enableCaching: true,
  maxTokensPerQuery: 4000,
  compressionEnabled: true,
  
  modelSelection: (query) => {
    const complexity = estimateQueryComplexity(query);
    return complexity > 0.7 ? 'gpt-4o' : 'gpt-4o-mini';
  }
};
```

### Cost Projections for Multiple Books

For 10 technical books (400 pages each):
- **Storage**: ~20MB = $0.06/month (within free tier)
- **Light usage** (100 queries/day): ~$0.40/month with GPT-4o-mini
- **Medium usage** (500 queries/day): ~$2.00/month with GPT-4o-mini
- **Heavy usage** (2000 queries/day): ~$127.50/month with GPT-4o

## 9. Complete API Reference

### Core API Methods

```javascript
// Assistant Management
const assistant = await client.beta.assistants.create({
  name: "string",
  description: "string",
  instructions: "string",
  model: "gpt-4o",
  tools: [{"type": "file_search"}, {"type": "code_interpreter"}],
  tool_resources: {
    file_search: {
      vector_store_ids: ["vs_123"],
      new_vector_stores: [{
        name: "New Store",
        file_ids: ["file_123"]
      }]
    }
  },
  metadata: {},
  temperature: 0.7,
  top_p: 1.0,
  response_format: "auto"
});

// Vector Store Operations
const vectorStore = await client.beta.vectorStores.create({
  name: "string",
  file_ids: ["file_1", "file_2"],
  expires_after: {
    anchor: "last_active_at",
    days: 30
  },
  chunking_strategy: {
    type: "static",
    static: {
      max_chunk_size_tokens: 800,
      chunk_overlap_tokens: 400
    }
  },
  metadata: {}
});

// Thread and Run Management
const run = await client.beta.threads.runs.createAndPoll(thread.id, {
  assistant_id: assistant.id,
  instructions: "Additional context",
  tools: [{"type": "file_search"}],
  metadata: {},
  temperature: 0.7,
  max_prompt_tokens: 20000,
  max_completion_tokens: 4000,
  truncation_strategy: {
    type: "auto",
    last_messages: 10
  },
  tool_choice: "auto",
  parallel_tool_calls: true
});
```

## 10. Testing Strategies

### Comprehensive Testing Framework

```javascript
import { describe, it, expect } from '@jest/globals';

describe('RAG System Tests', () => {
  let ragSystem;
  
  beforeAll(async () => {
    ragSystem = new RAGSystem(process.env.OPENAI_API_KEY);
    await ragSystem.initialize();
  });

  describe('Document Processing', () => {
    it('should successfully upload and index documents', async () => {
      const result = await ragSystem.addDocuments(['test-doc.pdf']);
      expect(result.file_counts.completed).toBeGreaterThan(0);
    });

    it('should handle large files correctly', async () => {
      const largeFile = 'large-technical-book.pdf';
      const result = await uploadLargeTechnicalBook(largeFile, {
        title: 'Test Book'
      });
      expect(result.file).toBeDefined();
    });
  });

  describe('Query Processing', () => {
    it('should retrieve relevant information', async () => {
      const query = 'What is async/await in JavaScript?';
      const result = await ragSystem.query(query);
      
      expect(result.answer).toBeTruthy();
      expect(result.answer.toLowerCase()).toContain('async');
    });

    it('should provide citations', async () => {
      const query = 'Explain Node.js event loop';
      const result = await ragSystem.query(query);
      
      expect(result.citations).toBeDefined();
      expect(Array.isArray(result.citations)).toBe(true);
    });

    it('should handle edge cases gracefully', async () => {
      const emptyQuery = '';
      await expect(ragSystem.query(emptyQuery)).rejects.toThrow('Query cannot be empty');
    });
  });

  describe('Performance Tests', () => {
    it('should complete queries within acceptable time', async () => {
      const startTime = Date.now();
      await ragSystem.query('Simple test query');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it('should handle concurrent queries', async () => {
      const queries = Array(5).fill('Concurrent test query');
      const results = await Promise.all(
        queries.map(q => ragSystem.query(q))
      );
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.answer).toBeTruthy();
      });
    });
  });
});
```

### Integration Testing

```javascript
// End-to-end test scenario
async function runIntegrationTest() {
  const testScenarios = [
    {
      name: 'Code Search',
      query: 'Show me an example of Promise.all in JavaScript',
      expectedContent: ['Promise.all', 'array', 'promises']
    },
    {
      name: 'Concept Explanation',
      query: 'Explain the concept of closures',
      expectedContent: ['closure', 'scope', 'function']
    },
    {
      name: 'Debugging Help',
      query: 'Why am I getting "undefined is not a function" error?',
      expectedContent: ['undefined', 'function', 'error']
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`Running test: ${scenario.name}`);
    const result = await ragSystem.query(scenario.query);
    
    // Verify expected content
    const hasExpectedContent = scenario.expectedContent.every(
      term => result.answer.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log(`Test ${scenario.name}: ${hasExpectedContent ? 'PASSED' : 'FAILED'}`);
  }
}
```

## 11. Complete Working Example

### Full Express.js Application

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { RAGSystem } from './ragSystem.js';
import { CostTracker } from './costTracker.js';
import { PerformanceMonitor } from './performanceMonitor.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Initialize services
const ragSystem = new RAGSystem(process.env.OPENAI_API_KEY);
const costTracker = new CostTracker();
const perfMonitor = new PerformanceMonitor();

// Initialize system on startup
async function initializeSystem() {
  try {
    await ragSystem.initialize();
    console.log('RAG System initialized successfully');
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// Upload endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const filePaths = req.files.map(f => f.path);
    const result = await ragSystem.addDocuments(filePaths);
    
    // Clean up uploaded files
    filePaths.forEach(path => fs.unlinkSync(path));
    
    res.json({
      success: true,
      filesProcessed: result.file_counts.completed,
      message: 'Documents uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { question, threadId } = req.body;
    
    const result = await perfMonitor.trackQuery(
      () => ragSystem.query(question, threadId)
    );
    
    costTracker.trackUsage(result);
    
    res.json({
      success: true,
      ...result,
      costs: costTracker.calculateCosts()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Streaming query endpoint
app.post('/api/query/stream', async (req, res) => {
  const { question } = req.body;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  try {
    const thread = await ragSystem.client.beta.threads.create();
    
    await ragSystem.streamingQuery(thread.id, question, (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      
      if (event.type === 'complete' || event.type === 'error') {
        res.end();
      }
    });
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  res.json({
    performance: {
      averageResponseTime: perfMonitor.getAverageQueryTime(),
      totalQueries: perfMonitor.metrics.queryTimes.length,
      errorRate: perfMonitor.metrics.errorRate
    },
    costs: costTracker.calculateCosts(),
    health: 'operational'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
initializeSystem().then(() => {
  app.listen(PORT, () => {
    console.log(`RAG API Server running on port ${PORT}`);
  });
});
```

## 12. Code Formatting and Syntax Highlighting

### Response Formatter Implementation

```javascript
import hljs from 'highlight.js';
import { marked } from 'marked';

class ResponseFormatter {
  constructor() {
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {
            console.error('Highlighting error:', err);
          }
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true
    });
  }

  formatResponse(response, citations = []) {
    // Process citations inline
    let formattedResponse = response;
    citations.forEach((citation, index) => {
      const citationMark = `[${index + 1}]`;
      if (citation.text) {
        formattedResponse = formattedResponse.replace(
          citation.text,
          `${citation.text}${citationMark}`
        );
      }
    });

    // Extract and highlight code blocks
    const codeBlocks = this.extractCodeBlocks(formattedResponse);
    
    // Convert to HTML with syntax highlighting
    const htmlContent = marked(formattedResponse);

    return {
      html: htmlContent,
      markdown: formattedResponse,
      codeBlocks: codeBlocks,
      citations: citations.map((c, i) => ({
        index: i + 1,
        source: c.fileId,
        quote: c.quote
      }))
    };
  }

  extractCodeBlocks(text) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'javascript';
      const code = match[2].trim();
      
      blocks.push({
        language,
        code,
        highlighted: hljs.highlight(code, { language }).value,
        lineCount: code.split('\n').length
      });
    }

    return blocks;
  }
}
```

## 13. Search Quality Optimization

### Advanced Query Processing

```javascript
class QueryOptimizer {
  constructor() {
    this.queryTemplates = {
      code_search: {
        template: "Find code examples and implementation details for: {query}. Include complete, runnable code snippets.",
        model: "gpt-4o"
      },
      concept_explanation: {
        template: "Explain the concept of {query} with practical examples and use cases.",
        model: "gpt-4o-mini"
      },
      debugging: {
        template: "Debug this issue: {query}. Provide potential causes and solutions with code examples.",
        model: "gpt-4o"
      },
      api_reference: {
        template: "Provide API reference documentation for: {query}. Include parameters, return values, and examples.",
        model: "gpt-4o-mini"
      }
    };
  }

  optimizeQuery(query, type = 'general') {
    // Query expansion for better retrieval
    const expandedTerms = this.expandQueryTerms(query);
    
    // Apply template if available
    const template = this.queryTemplates[type];
    if (template) {
      return {
        query: template.template.replace('{query}', query),
        model: template.model,
        expandedTerms
      };
    }

    return { query, model: 'gpt-4o-mini', expandedTerms };
  }

  expandQueryTerms(query) {
    // Simple query expansion logic
    const synonyms = {
      'async': ['asynchronous', 'promise', 'await'],
      'function': ['method', 'procedure', 'routine'],
      'error': ['exception', 'bug', 'issue'],
      'array': ['list', 'collection', 'vector']
    };

    const terms = query.toLowerCase().split(' ');
    const expanded = new Set(terms);

    terms.forEach(term => {
      if (synonyms[term]) {
        synonyms[term].forEach(syn => expanded.add(syn));
      }
    });

    return Array.from(expanded);
  }
}
```

## 14. Rate Limiting and Quota Management

### Advanced Rate Limiting Implementation

```javascript
class RateLimiter {
  constructor() {
    this.limits = {
      tier1: { rpm: 3, rpd: 200, tpm: 30000 },
      tier2: { rpm: 50, rpd: 10000, tpm: 450000 },
      tier3: { rpm: 200, rpd: 100000, tpm: 4500000 },
      tier4: { rpm: 300, rpd: 300000, tpm: 10000000 },
      tier5: { rpm: 500, rpd: 1000000, tpm: 30000000 }
    };
    
    this.currentTier = process.env.OPENAI_TIER || 'tier2';
    this.requests = {
      minute: [],
      day: [],
      tokens: { minute: 0, timestamp: Date.now() }
    };
  }

  async checkLimit() {
    const now = Date.now();
    const limits = this.limits[this.currentTier];
    
    // Clean old entries
    this.requests.minute = this.requests.minute.filter(t => now - t < 60000);
    this.requests.day = this.requests.day.filter(t => now - t < 86400000);
    
    // Check minute limit
    if (this.requests.minute.length >= limits.rpm) {
      const waitTime = 60000 - (now - this.requests.minute[0]);
      throw new RateLimitError(`Rate limit exceeded. Wait ${waitTime}ms`, { 
        retryAfter: waitTime 
      });
    }
    
    // Check daily limit
    if (this.requests.day.length >= limits.rpd) {
      throw new RateLimitError('Daily limit exceeded', { 
        resetAt: new Date(now + 86400000) 
      });
    }
    
    // Update request tracking
    this.requests.minute.push(now);
    this.requests.day.push(now);
  }

  trackTokens(usage) {
    const now = Date.now();
    
    // Reset token counter every minute
    if (now - this.requests.tokens.timestamp > 60000) {
      this.requests.tokens = { minute: 0, timestamp: now };
    }
    
    this.requests.tokens.minute += (usage.prompt_tokens + usage.completion_tokens);
    
    // Check token limit
    const limits = this.limits[this.currentTier];
    if (this.requests.tokens.minute > limits.tpm) {
      throw new RateLimitError('Token limit exceeded for this minute', {
        tokensUsed: this.requests.tokens.minute,
        limit: limits.tpm
      });
    }
  }
}
```

## 15. Production Deployment Considerations

### Environment Configuration

```javascript
// config/production.js
export const productionConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    maxRetries: 3,
    timeout: 60000
  },
  
  vectorStore: {
    defaultExpiration: 30, // days
    maxFilesPerStore: 1000,
    chunkingStrategy: {
      maxChunkSize: 1000,
      overlap: 200
    }
  },
  
  performance: {
    cacheEnabled: true,
    cacheTTL: 3600,
    maxConcurrentRequests: 10,
    requestTimeout: 30000
  },
  
  monitoring: {
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info',
    metricsInterval: 60000
  },
  
  security: {
    enableRateLimit: true,
    maxRequestsPerMinute: 100,
    enableApiKeyRotation: true,
    apiKeyRotationInterval: 90 // days
  }
};
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "app.js"]
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-system
  template:
    metadata:
      labels:
        app: rag-system
    spec:
      containers:
      - name: rag-api
        image: your-registry/rag-system:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secrets
              key: api-key
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Summary

This comprehensive documentation provides everything needed to build a production-ready RAG system using OpenAI's Assistants API with vector stores. The implementation includes:

1. **Complete JavaScript/Node.js code examples** with error handling and edge cases
2. **Step-by-step setup instructions** for vector stores and file processing
3. **Optimized chunking strategies** for technical documentation
4. **Advanced query processing** for code examples and conceptual information
5. **Comprehensive error handling** with retry logic and fallbacks
6. **Performance optimization** including caching and monitoring
7. **Cost management** with detailed projections and tracking
8. **Production-ready architecture** with Docker and Kubernetes configurations
9. **Extensive testing strategies** for quality assurance
10. **Security best practices** including rate limiting and API key management

The system is designed to handle multiple 400+ page technical books efficiently while maintaining high performance and reasonable costs. With proper implementation of these patterns, you can build a robust RAG system capable of serving as an intelligent technical documentation assistant.