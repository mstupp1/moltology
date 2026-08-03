/**
 * OpenAPI 3.0 Specification for Moltology Public REST API & Neon Data API
 */
export const MOLTOLOGY_OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Moltology Public REST API & Neon Data API',
    version: '1.0.0',
    description:
      'Official public REST API for Moltology and The Order of the Synaptic Path. Allows public retrieval of system changelogs, doctrine telemetry, and direct Neon Data API PostgREST endpoints.',
    contact: {
      name: 'High Ascendant Carcinus',
      url: 'https://moltology.org',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Moltology Application Public REST API Gateway',
    },
    {
      url: 'https://ep-cold-breeze-aye6s748.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1',
      description: 'Neon Data API Direct PostgREST Endpoint',
    },
  ],
  paths: {
    '/changelogs': {
      get: {
        summary: 'Get Public System Transmutation Changelogs',
        description:
          'Retrieves a list of public published release notes and system transmutations. Enforces security best practices: only published entries (`isPublished = true`) are returned.',
        operationId: 'getPublicChangelogs',
        parameters: [
          {
            name: 'category',
            in: 'query',
            required: false,
            description: 'Filter by category (e.g., TRANSMUTATION, CHASSIS_UPGRADE, SECURITY_ISOLATION, FEATURE, BUG_PURGE)',
            schema: {
              type: 'string',
              enum: ['TRANSMUTATION', 'CHASSIS_UPGRADE', 'SECURITY_ISOLATION', 'FEATURE', 'BUG_PURGE'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of records to return',
            schema: {
              type: 'integer',
              default: 50,
              maximum: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Array of published changelog entries',
            headers: {
              'Access-Control-Allow-Origin': {
                schema: { type: 'string' },
                description: 'CORS header enabling cross-origin access (*)',
              },
              'Cache-Control': {
                schema: { type: 'string' },
                description: 'HTTP Caching directive (public, max-age=60)',
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ChangelogEntry',
                  },
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/neondb/rest/v1/changelogs': {
      get: {
        summary: 'Direct Neon Data API PostgREST Query for Changelogs',
        description:
          'Direct PostgREST table endpoint hosted on Neon Data API. Supports rich filtering (`?category=eq.FEATURE`), column projection (`?select=version,title`), and sorting (`?order=releasedAt.desc`).',
        operationId: 'getNeonChangelogsDirect',
        security: [
          {
            BearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'isPublished',
            in: 'query',
            required: false,
            description: 'Filter published status (e.g. eq.true)',
            schema: { type: 'string', default: 'eq.true' },
          },
          {
            name: 'select',
            in: 'query',
            required: false,
            description: 'Comma-separated columns to select (e.g. version,title,releasedAt)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful PostgREST query result',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ChangelogEntry',
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Missing or invalid JWT Bearer token',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Neon Auth or custom JWT token containing user identity and RLS claims.',
      },
    },
    schemas: {
      ChangelogEntry: {
        type: 'object',
        required: ['version', 'title', 'category', 'summary', 'content', 'releasedAt'],
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-46a4-a3f2-123456789abc' },
          version: { type: 'string', example: 'v1.5.0' },
          title: { type: 'string', example: 'Synaptic Oracle Multi-Mode AI Hub' },
          category: { type: 'string', example: 'FEATURE' },
          summary: { type: 'string', example: 'Integrated multi-mode AI Oracle thread context...' },
          content: { type: 'string', example: '### 🧠 Synaptic Oracle AI...' },
          isPublished: { type: 'boolean', example: true },
          releasedAt: { type: 'string', format: 'date-time', example: '2026-08-03T09:15:00Z' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-08-03T09:15:00Z' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: 'Rate limit exceeded' },
          code: { type: 'string', nullable: true },
        },
      },
    },
  },
} as const
