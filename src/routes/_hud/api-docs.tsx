import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Terminal,
  Code,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Download,
  Server,
  Layers,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  RefreshCw,
} from 'lucide-react'
import { getPublicChangelogsRestApiFn } from '@/lib/server/api'
import { MOLTOLOGY_OPENAPI_SPEC } from '@/lib/openapi'
import type { ChangelogEntry } from '@/lib/changelogs-data'

function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [limit, setLimit] = useState<number>(10)
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'ts' | 'python'>('curl')
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const [copiedSpec, setCopiedSpec] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [apiResponse, setApiResponse] = useState<{
    status: number
    headers: Record<string, string>
    data: ChangelogEntry[]
  } | null>(null)

  const [isSpecExpanded, setIsSpecExpanded] = useState(false)

  // Initial load execution
  useEffect(() => {
    handleRunQuery()
  }, [])

  const handleRunQuery = async () => {
    setIsExecuting(true)
    const startTime = performance.now()
    try {
      const res = await getPublicChangelogsRestApiFn({
        data: {
          category: selectedCategory,
          limit,
        },
      })
      const endTime = performance.now()
      setLatencyMs(Math.round(endTime - startTime))
      setApiResponse(res as any)
    } catch (err) {
      console.error('API Query Execution Error:', err)
    } finally {
      setIsExecuting(false)
    }
  }

  const getCodeSnippet = () => {
    const categoryParam = selectedCategory !== 'ALL' ? `?category=${selectedCategory}` : ''
    const limitParam = limit ? `${categoryParam ? '&' : '?'}limit=${limit}` : ''
    const queryParams = `${categoryParam}${limitParam}`
    const endpointUrl = `https://moltology.org/api/v1/changelogs${queryParams}`
    const neonDirectUrl = `https://ep-cold-breeze-aye6s748.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1/changelogs`

    switch (activeTab) {
      case 'curl':
        return `# 1. Public Application REST Endpoint (No Auth Required)
curl -X GET "${endpointUrl}" \\
  -H "Accept: application/json"

# 2. Direct Neon Data API Endpoint (With JWT Auth Token)
curl -X GET "${neonDirectUrl}${selectedCategory !== 'ALL' ? `?category=eq.${selectedCategory}` : ''}" \\
  -H "Authorization: Bearer <YOUR_NEON_JWT_TOKEN>" \\
  -H "Accept: application/json"`

      case 'js':
        return `// Public Fetch API Call
async function fetchChangelogs() {
  const response = await fetch('${endpointUrl}');
  if (!response.ok) {
    throw new Error(\`HTTP error! Status: \${response.status}\`);
  }
  const changelogs = await response.json();
  console.log('Fetched Changelogs:', changelogs);
  return changelogs;
}

fetchChangelogs();`

      case 'ts':
        return `import { NeonPostgrestClient } from '@neondatabase/postgrest-js';

// Direct Neon Data API Client Setup
const client = new NeonPostgrestClient({
  dataApiUrl: 'https://ep-cold-breeze-aye6s748.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1',
  token: 'YOUR_AUTH_JWT_TOKEN',
});

async function queryNeonDataApi() {
  const { data, error } = await client
    .from('changelogs')
    .select('version, title, category, summary, releasedAt')
    .eq('isPublished', true)
    .order('releasedAt', { ascending: false });

  if (error) console.error('PostgREST Error:', error);
  else console.log('Changelogs:', data);
}

queryNeonDataApi();`

      case 'python':
        return `import requests

# Query Public Moltology REST API
url = "${endpointUrl}"
headers = {
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    changelogs = response.json()
    print(f"Retrieved {len(changelogs)} changelog entries.")
    for entry in changelogs:
        print(f"[{entry['version']}] {entry['title']}")
else:
    print(f"Error {response.status_code}: {response.text}")`
    }
  }

  const handleCopyCode = (tab: string) => {
    const snippet = getCodeSnippet()
    navigator.clipboard.writeText(snippet)
    setCopiedTab(tab)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const handleCopyOpenApiSpec = () => {
    navigator.clipboard.writeText(JSON.stringify(MOLTOLOGY_OPENAPI_SPEC, null, 2))
    setCopiedSpec(true)
    setTimeout(() => setCopiedSpec(false), 2000)
  }

  const handleDownloadSpec = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(MOLTOLOGY_OPENAPI_SPEC, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', 'moltology_openapi_spec.json')
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-mono">
      {/* Header Banner */}
      <div className="bg-[#080d10]/90 border border-[#00c3ff]/50 p-6 shadow-[0_0_30px_rgba(0,195,255,0.15)] relative overflow-hidden chamfer-corner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c3ff]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00c3ff] font-bold tracking-widest uppercase mb-1">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span>PUBLIC REST API &amp; NEON DATA GATEWAY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-grotesk tracking-wide [text-shadow:0_0_15px_rgba(0,195,255,0.5)]">
              API DOCUMENTATION &amp; TELEMETRY
            </h1>
            <p className="text-xs text-[#839493] mt-1 max-w-2xl font-sans">
              Programmatic access to public system changelogs, doctrine telemetry, and direct Neon Data API (PostgREST) endpoints. Built with enterprise Row Level Security (RLS) enforcement.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-2.5 py-1 bg-[#00c3ff]/10 border border-[#00c3ff]/40 text-[#00c3ff] text-[10px] font-bold rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> RLS ENFORCED
            </span>
            <span className="px-2.5 py-1 bg-[#30d158]/10 border border-[#30d158]/40 text-[#30d158] text-[10px] font-bold rounded flex items-center gap-1">
              <Globe className="w-3 h-3" /> CORS ENABLED (*)
            </span>
            <span className="px-2.5 py-1 bg-[#ff9f0a]/10 border border-[#ff9f0a]/40 text-[#ff9f0a] text-[10px] font-bold rounded flex items-center gap-1">
              <Lock className="w-3 h-3" /> TLS 1.3 SSL
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Live Interactive Tester, Right Code Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Tester & Query Executor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#080d10]/80 border border-[#1e2d37] p-5 chamfer-corner">
            <div className="flex items-center justify-between border-b border-[#1e2d37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#ff5540]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  LIVE ENDPOINT TESTER
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-[#0f1414] text-[#00c3ff] px-2 py-0.5 border border-[#00c3ff]/30">
                GET /api/v1/changelogs
              </span>
            </div>

            {/* Query Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-[#839493] uppercase mb-1.5">
                  Category Filter
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#05080a] border border-[#1e2d37] focus:border-[#00c3ff] text-xs text-[#dfe3e3] px-3 py-2 outline-none font-mono transition-colors"
                >
                  <option value="ALL">ALL CATEGORIES</option>
                  <option value="TRANSMUTATION">TRANSMUTATION</option>
                  <option value="CHASSIS_UPGRADE">CHASSIS UPGRADE</option>
                  <option value="SECURITY_ISOLATION">SECURITY ISOLATION</option>
                  <option value="FEATURE">FEATURE</option>
                  <option value="BUG_PURGE">BUG PURGE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#839493] uppercase mb-1.5">
                  Result Limit
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full bg-[#05080a] border border-[#1e2d37] focus:border-[#00c3ff] text-xs text-[#dfe3e3] px-3 py-2 outline-none font-mono transition-colors"
                />
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunQuery}
              disabled={isExecuting}
              className="w-full py-2.5 bg-[#00c3ff]/15 hover:bg-[#00c3ff]/25 border border-[#00c3ff] text-[#00c3ff] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00c3ff]" />
                  <span>EXECUTING QUERY...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#ff5540]" />
                  <span>EXECUTE LIVE API REQUEST</span>
                </>
              )}
            </button>
          </div>

          {/* Response Telemetry Window */}
          <div className="bg-[#05080a] border border-[#1e2d37] p-4 chamfer-corner">
            <div className="flex items-center justify-between border-b border-[#1e2d37] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-[#00c3ff]" />
                <span className="text-xs font-bold text-[#dfe3e3]">RESPONSE TELEMETRY</span>
              </div>

              {apiResponse && (
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-[#30d158] font-bold bg-[#30d158]/10 px-2 py-0.5 border border-[#30d158]/30">
                    HTTP {apiResponse.status} OK
                  </span>
                  {latencyMs !== null && (
                    <span className="text-[#839493]">
                      LATENCY: <strong className="text-[#00c3ff]">{latencyMs}ms</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Headers Box */}
            {apiResponse?.headers && (
              <div className="bg-[#080d10] p-2.5 border border-[#1e2d37]/60 mb-3 text-[10px] text-[#839493] space-y-1 font-mono">
                <div>
                  <span className="text-[#00c3ff]">content-type:</span> {apiResponse.headers['Content-Type']}
                </div>
                <div>
                  <span className="text-[#00c3ff]">access-control-allow-origin:</span> {apiResponse.headers['Access-Control-Allow-Origin']}
                </div>
                <div>
                  <span className="text-[#00c3ff]">cache-control:</span> {apiResponse.headers['Cache-Control']}
                </div>
              </div>
            )}

            {/* Response Body JSON */}
            <div className="bg-[#030607] border border-[#1e2d37] p-3 max-h-72 overflow-y-auto font-mono text-[11px] text-[#a4b5b4] leading-relaxed select-text">
              {isExecuting ? (
                <div className="py-8 text-center text-[#839493] animate-pulse">
                  Querying database via server function...
                </div>
              ) : apiResponse ? (
                <pre>{JSON.stringify(apiResponse.data, null, 2)}</pre>
              ) : (
                <div className="py-8 text-center text-[#839493]">
                  Click "EXECUTE LIVE API REQUEST" to fetch payload.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippets & Auth Guidelines */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#080d10]/80 border border-[#1e2d37] p-5 chamfer-corner">
            <div className="flex items-center justify-between border-b border-[#1e2d37] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#00c3ff]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  CONSUMPTION CODE SNIPPETS
                </h2>
              </div>

              <button
                onClick={() => handleCopyCode(activeTab)}
                className="px-2.5 py-1 bg-[#152026] hover:bg-[#1e2d37] border border-[#00c3ff]/40 text-[#00c3ff] text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check className="w-3 h-3 text-[#30d158]" /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> COPY CODE
                  </>
                )}
              </button>
            </div>

            {/* Language Selector Tabs */}
            <div className="flex border-b border-[#1e2d37] mb-3 overflow-x-auto">
              {[
                { id: 'curl', label: 'cURL' },
                { id: 'js', label: 'JavaScript' },
                { id: 'ts', label: 'TypeScript (Neon SDK)' },
                { id: 'python', label: 'Python' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#00c3ff] text-[#00c3ff] bg-[#00c3ff]/10'
                      : 'border-transparent text-[#839493] hover:text-[#dfe3e3]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Block Container */}
            <div className="bg-[#030607] border border-[#1e2d37] p-3 text-[11px] font-mono text-[#00ffff]/90 leading-relaxed overflow-x-auto max-h-96">
              <pre>{getCodeSnippet()}</pre>
            </div>
          </div>

          {/* Security & Neon Data API Architecture Card */}
          <div className="bg-[#080d10]/80 border border-[#1e2d37] p-5 chamfer-corner">
            <div className="flex items-center gap-2 border-b border-[#1e2d37] pb-3 mb-3">
              <Database className="w-4 h-4 text-[#ff9f0a]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                DIRECT NEON DATA API ARCHITECTURE
              </h2>
            </div>

            <div className="space-y-3 text-xs text-[#839493] font-sans">
              <p>
                In addition to this application REST endpoint, your database is powered by the <strong>Neon Data API</strong> (built on PostgREST).
              </p>

              <div className="bg-[#040708] border border-[#1e2d37] p-3 font-mono text-[11px] text-[#dfe3e3] space-y-1.5">
                <div className="text-[#00c3ff] font-bold">Base Endpoint URL:</div>
                <div className="truncate text-[#30d158] select-all bg-[#0a1012] p-1 border border-[#1e2d37]">
                  https://ep-cold-breeze-aye6s748.apirest.c-5.us-east-2.aws.neon.tech/neondb/rest/v1
                </div>
              </div>

              <div className="bg-[#00c3ff]/5 border-l-2 border-[#00c3ff] p-3 text-xs text-[#dfe3e3] font-mono">
                <span className="text-[#00c3ff] font-bold block mb-1">🔐 SECURITY BEST PRACTICES:</span>
                • All requests to protected database tables (`profiles`, `user_stats`, `daily_routines`) require an `Authorization: Bearer &lt;JWT&gt;` header.<br />
                • PostgreSQL Row Level Security (RLS) automatically evaluates user JWT claims (`sub`) to restrict query scopes.<br />
                • Public tables (`changelogs`, `gallery_pins`, published `blog_posts`) enforce read-only policies.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: OpenAPI 3.0 Specification Inspector */}
      <div className="bg-[#080d10]/90 border border-[#1e2d37] p-6 chamfer-corner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2d37] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00c3ff]" />
            <div>
              <h2 className="text-base font-bold text-white font-grotesk tracking-wide uppercase">
                OPENAPI 3.0 SPECIFICATION SCHEMA
              </h2>
              <p className="text-xs text-[#839493] font-sans">
                Standard OpenAPI schema definition compatible with Swagger UI, Redoc, Postman, and Scalar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyOpenApiSpec}
              className="px-3 py-1.5 bg-[#152026] hover:bg-[#1e2d37] border border-[#00c3ff]/40 text-[#00c3ff] text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
            >
              {copiedSpec ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSpec ? 'COPIED!' : 'COPY SPEC JSON'}</span>
            </button>

            <button
              onClick={handleDownloadSpec}
              className="px-3 py-1.5 bg-[#00c3ff]/15 hover:bg-[#00c3ff]/25 border border-[#00c3ff] text-[#00c3ff] text-xs font-bold uppercase flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD JSON</span>
            </button>

            <button
              onClick={() => setIsSpecExpanded(!isSpecExpanded)}
              className="p-1.5 bg-[#152026] hover:bg-[#1e2d37] border border-[#1e2d37] text-[#dfe3e3]"
              title={isSpecExpanded ? 'Collapse Spec' : 'Expand Spec'}
            >
              {isSpecExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Spec Viewer */}
        {isSpecExpanded && (
          <div className="bg-[#030607] border border-[#1e2d37] p-4 font-mono text-[11px] text-[#00c3ff]/80 max-h-96 overflow-y-auto leading-relaxed">
            <pre>{JSON.stringify(MOLTOLOGY_OPENAPI_SPEC, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/api-docs')({
  component: ApiDocsPage,
})
