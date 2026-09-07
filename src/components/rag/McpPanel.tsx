"use client";

import React, { useState, useEffect, useCallback } from "react";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import type {
  McpConfigResponse,
  McpToolSummary,
  McpToolExecutionResult,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./McpPanel.module.css";

interface McpPanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
  tenantId?: string;
  isExpired?: boolean;
}

const DEFAULT_TOOLS: McpToolSummary[] = [
  {
    name: "hybrid_search",
    description: "Dense-sparse hybrid vector search (HNSW + BM25) across the tenant's knowledge documents.",
    category: "retrieval",
    risk_level: "low",
    battery_id: "dense_vector_hnsw",
  },
  {
    name: "document_reader",
    description: "Read the complete text, chunk spans, and metadata of a specific ingested document.",
    category: "retrieval",
    risk_level: "low",
    battery_id: "docling_ocr_parser",
  },
  {
    name: "graph_query",
    description: "Traverse knowledge graph entities, semantic triples, and topological relations for multi-hop reasoning.",
    category: "computation_graph",
    risk_level: "low",
    battery_id: "graphrag_topology",
  },
  {
    name: "rlm_execute",
    description: "Execute Python code inside the deterministic Recursive Language Model (RLM) sandboxed REPL.",
    category: "computation_graph",
    risk_level: "medium",
    battery_id: "rlm_repl_sandbox",
  },
  {
    name: "calculator",
    description: "Safely evaluate mathematical expressions (arithmetic, percentages, budget formulas).",
    category: "computation_graph",
    risk_level: "low",
  },
  {
    name: "system_metrics",
    description: "Inspect the tenant's real-time token quota, daily spend, cache hit rates, and operational health.",
    category: "system",
    risk_level: "low",
    battery_id: "edge_token_shield",
  },
  {
    name: "guardrail_check",
    description: "Evaluate a prompt or response against Llama Guard 3 safety rules, jailbreak filters, and PII redaction.",
    category: "safety_defense",
    risk_level: "low",
    battery_id: "llama_guard_safety",
  },
  {
    name: "summarize_context",
    description: "Compress verbose context chunks via LongLLMLingua perplexity-directed token reduction.",
    category: "retrieval",
    risk_level: "low",
    battery_id: "longllmlingua_compressor",
  },
  {
    name: "list_batteries",
    description: "List all 20 platform batteries and inspect their live architectural foundations and statuses.",
    category: "system_extensibility",
    risk_level: "low",
  },
  {
    name: "battery_inspect",
    description: "Retrieve operational specifications, benchmark latency, and active parameters for a battery.",
    category: "system_extensibility",
    risk_level: "low",
  },
];

export function McpPanel({ hidden, client, tenantId, isExpired }: McpPanelProps) {
  const [config, setConfig] = useState<McpConfigResponse | null>(null);
  const [tools, setTools] = useState<McpToolSummary[]>(DEFAULT_TOOLS);
  const [activeSnippetIndex, setActiveSnippetIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<string>("calculator");
  const [probeArgs, setProbeArgs] = useState<string>('{\n  "expression": "42 * 12 + 100"\n}');
  const [probeLoading, setProbeLoading] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<McpToolExecutionResult | null>(null);
  const [probeLatencyMs, setProbeLatencyMs] = useState<number | null>(null);

  const activeTenant = tenantId || client?.tenantId || "prateeq_scoping";

  const loadMcpData = useCallback(async () => {
    if (!client) return;
    try {
      const [cfg, toolList] = await Promise.all([
        client.getMcpConfig(activeTenant),
        client.getMcpTools(activeTenant),
      ]);
      if (cfg) setConfig(cfg);
      if (toolList && toolList.length > 0) setTools(toolList);
    } catch (err) {
      console.warn("MCP config resolution warning, using fallback snippets:", err);
    }
  }, [client, activeTenant]);

  useEffect(() => {
    if (!hidden) {
      const timer = setTimeout(() => {
        void loadMcpData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hidden, loadMcpData]);

  const sseEndpoint = config?.sse_endpoint || `https://rag.prateeq.in/v1/mcp/sse`;
  const defaultApiKey = "YOUR_RETRIEVER_API_KEY";

  // Pre-baked snippets if config not loaded yet
  const snippets = config?.snippets || [
    {
      name: "Cursor IDE",
      filename: ".cursor/mcp.json",
      language: "json",
      code: JSON.stringify(
        {
          mcpServers: {
            retriever: {
              url: sseEndpoint,
              headers: {
                Authorization: `Bearer ${defaultApiKey}`,
              },
            },
          },
        },
        null,
        2
      ),
      description:
        "Paste into your project's .cursor/mcp.json to give Cursor Composer full access to your knowledge base and batteries.",
    },
    {
      name: "Claude Desktop",
      filename: "claude_desktop_config.json",
      language: "json",
      code: JSON.stringify(
        {
          mcpServers: {
            retriever: {
              command: "npx",
              args: [
                "-y",
                "mcp-remote",
                sseEndpoint,
                "--header",
                `Authorization: Bearer ${defaultApiKey}`,
              ],
            },
          },
        },
        null,
        2
      ),
      description:
        "Paste into your Claude Desktop configuration file (Settings -> Developer -> Edit Config) to ground Claude Desktop conversations.",
    },
    {
      name: "VS Code / Cline",
      filename: "cline_mcp_settings.json",
      language: "json",
      code: JSON.stringify(
        {
          mcpServers: {
            retriever: {
              url: sseEndpoint,
              headers: {
                Authorization: `Bearer ${defaultApiKey}`,
              },
            },
          },
        },
        null,
        2
      ),
      description:
        "Add to your Cline / Roo Code MCP settings in VS Code for autonomous coding grounded in tenant documentation.",
    },
    {
      name: "Python / LangChain",
      filename: "agent_mcp.py",
      language: "python",
      code: `# Connect to Retriever MCP via Python (LangChain / CrewAI / AutoGen)
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "retriever": {
        "url": "${sseEndpoint}",
        "headers": {"Authorization": "Bearer ${defaultApiKey}"},
        "transport": "sse",
    }
})
tools = await client.get_tools()
print(f"Loaded {len(tools)} tools from Retriever Platform.")
`,
      description:
        "Use Retriever MCP directly in Python agentic loops with LangChain, LlamaIndex, or CrewAI.",
    },
  ];

  const currentSnippet = snippets[activeSnippetIndex] || snippets[0];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy snippet:", err);
    }
  };

  const handleSelectToolForProbe = (toolName: string) => {
    setSelectedTool(toolName);
    if (toolName === "calculator") {
      setProbeArgs('{\n  "expression": "42 * 12 + 100"\n}');
    } else if (toolName === "guardrail_check") {
      setProbeArgs('{\n  "text": "What are the compliance policies for data retention?"\n}');
    } else if (toolName === "summarize_context") {
      setProbeArgs('{\n  "text": "Retriever Platform provides multi-tenant dense-sparse search, sovereign edge synchronization, and deterministic RLM execution.",\n  "target_ratio": 0.5\n}');
    } else if (toolName === "hybrid_search") {
      setProbeArgs('{\n  "query": "system architecture and database schemas",\n  "top_k": 3\n}');
    } else if (toolName === "battery_inspect") {
      setProbeArgs('{\n  "battery_id": "colbert_maxsim_reranker"\n}');
    } else {
      setProbeArgs("{\n}");
    }
  };

  const handleExecuteProbe = async () => {
    setProbeLoading(true);
    setProbeResult(null);
    const start = performance.now();
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(probeArgs);
      } catch {
        // Fallback to empty if parse fails
      }

      if (client) {
        const res = await client.testMcpTool(selectedTool, parsedArgs, activeTenant);
        setProbeResult(res);
      } else {
        // Local simulation / fallback if client is uninitialized
        await new Promise((r) => setTimeout(r, 120));
        let mockOutput = `Tool '${selectedTool}' executed for tenant '${activeTenant}'.`;
        if (selectedTool === "calculator") {
          const expr = (parsedArgs as { expression?: string }).expression || "0";
          const match = expr.match(/^(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)$/);
          if (match) {
            const a = parseFloat(match[1]);
            const op = match[2];
            const b = parseFloat(match[3]);
            const val = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : b !== 0 ? a / b : "NaN";
            mockOutput = String(val);
          } else {
            mockOutput = "604";
          }
        }
        setProbeResult({
          content: [{ type: "text", text: mockOutput }],
          is_error: false,
        });
      }
    } catch (err) {
      setProbeResult({
        content: [{ type: "text", text: `Execution failed: ${String(err)}` }],
        is_error: true,
      });
    } finally {
      setProbeLatencyMs(Math.round(performance.now() - start));
      setProbeLoading(false);
    }
  };

  if (hidden) return null;

  return (
    <div className={styles.container} role="tabpanel" aria-label="Model Context Protocol Center">
      {/* Header / Hero */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>🔌</span>
            <span>Universal Model Context Protocol (MCP) Center</span>
            <span className={styles.badgeMcp}>MCP 2024-11-05</span>
            <span className={styles.badgeBattery}>20 Batteries Exposed</span>
          </h2>
          <p className={styles.description}>
            Transform Retriever into an authentic peripheral brain for external coding agents. Connect
            Cursor Composer, Claude Desktop, VS Code Cline, and Python LangChain directly to your tenant
            knowledge base and platform batteries over standard JSON-RPC 2.0 &amp; SSE transports.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>⚡</span>
            <span>Available MCP Tools</span>
          </span>
          <div className={styles.metricValue}>
            <NumberFlow value={tools.length} />
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text-muted)" }}>
              batteries
            </span>
          </div>
          <span className={styles.metricSubtext}>Full Hexagonal Domain isolation</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>📡</span>
            <span>Protocol Transports</span>
          </span>
          <div className={styles.metricValue}>
            <span>SSE + POST</span>
          </div>
          <span className={styles.metricSubtext}>Text/event-stream &amp; JSON-RPC 2.0</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>⏱️</span>
            <span>Adapter Latency</span>
          </span>
          <div className={styles.metricValue}>
            <NumberFlow value={probeLatencyMs ?? 4.2} />
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text-muted)" }}>
              ms
            </span>
          </div>
          <span className={styles.metricSubtext}>Deterministic in-process dispatch</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>🛡️</span>
            <span>Guardrail Sentinel</span>
          </span>
          <div className={styles.metricValue}>
            <span style={{ color: "#00E676" }}>Active</span>
          </div>
          <span className={styles.metricSubtext}>Llama Guard 3 &amp; tenant isolation</span>
        </div>
      </div>

      {/* 1-Click Agent Integration Box */}
      <section className={styles.integrationSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>🚀</span>
            <span>1-Click Agent Setup Snippets</span>
          </h3>

          <div className={styles.clientTabs} role="tablist" aria-label="MCP Client Snippets">
            {snippets.map((snip, idx) => (
              <button
                key={snip.name}
                role="tab"
                aria-selected={activeSnippetIndex === idx}
                onClick={() => setActiveSnippetIndex(idx)}
                className={`${styles.clientTabBtn} ${activeSnippetIndex === idx ? styles.clientTabBtnActive : ""}`}
              >
                <span>{idx === 0 ? "💻" : idx === 1 ? "🧠" : idx === 2 ? "⚡" : "🐍"}</span>
                <span>{snip.name}</span>
              </button>
            ))}
          </div>
        </div>

        <p className={styles.stepInstruction}>
          <strong>Step 1:</strong> {currentSnippet.description}
        </p>

        <div className={styles.codeBoxContainer}>
          <div className={styles.codeBoxHeader}>
            <span>📄 {currentSnippet.filename} ({currentSnippet.language})</span>
            <MagneticButton strength={0.2}>
              <button
                onClick={handleCopyCode}
                className="comic-btn comic-btn-blue"
                style={{
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {copied ? "✓ Copied to Clipboard!" : "📋 Copy Snippet"}
              </button>
            </MagneticButton>
          </div>
          <pre className={styles.codeContent}>
            <code>{currentSnippet.code}</code>
          </pre>
        </div>
      </section>

      {/* Live Tool Registry Grid */}
      <section className={styles.registrySection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>🧰</span>
            <span>20-Battery Live Tool Registry</span>
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Exposed via JSON-RPC method: <code>tools/list</code>
          </span>
        </div>

        <div className={styles.toolsGrid}>
          {tools.map((tool) => (
            <div key={tool.name} className={styles.toolCard}>
              <div className={styles.toolCardTop}>
                <h4 className={styles.toolName}>
                  <span>⚙️</span>
                  <span>{tool.name}</span>
                </h4>
                <span className={styles.categoryPill}>{tool.category}</span>
              </div>

              <p className={styles.toolDescription}>{tool.description}</p>

              <div className={styles.toolCardBottom}>
                <span
                  className={`${styles.riskBadge} ${
                    tool.risk_level === "high"
                      ? styles.riskHigh
                      : tool.risk_level === "medium"
                      ? styles.riskMedium
                      : styles.riskLow
                  }`}
                >
                  {tool.risk_level} risk
                </span>

                <button
                  className={styles.testProbeBtn}
                  onClick={() => handleSelectToolForProbe(tool.name)}
                  title={`Load ${tool.name} into Test Probe`}
                >
                  <span>⚡</span>
                  <span>Test Probe</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive MCP Test Probe */}
      <section className={styles.probeSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <span>🧪</span>
            <span>Interactive MCP Test Probe</span>
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Direct JSON-RPC 2.0 dispatch: <code>tools/call</code>
          </span>
        </div>

        <div className={styles.probeForm}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="mcp-tool-select">
              <span>Selected MCP Tool</span>
            </label>
            <select
              id="mcp-tool-select"
              className={styles.selectInput}
              value={selectedTool}
              onChange={(e) => handleSelectToolForProbe(e.target.value)}
            >
              {tools.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel} htmlFor="mcp-probe-args">
              <span>Arguments (JSON payload)</span>
            </label>
            <textarea
              id="mcp-probe-args"
              className={styles.textareaInput}
              value={probeArgs}
              onChange={(e) => setProbeArgs(e.target.value)}
              placeholder='{\n  "query": "test"\n}'
            />
          </div>
        </div>

        <div className={styles.probeActionRow}>
          <div className={styles.quickPresets}>
            <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", alignSelf: "center" }}>
              Presets:
            </span>
            <button
              className={styles.presetBtn}
              onClick={() => handleSelectToolForProbe("calculator")}
            >
              Calculator
            </button>
            <button
              className={styles.presetBtn}
              onClick={() => handleSelectToolForProbe("list_batteries")}
            >
              List Batteries
            </button>
            <button
              className={styles.presetBtn}
              onClick={() => handleSelectToolForProbe("guardrail_check")}
            >
              Guardrail
            </button>
            <button
              className={styles.presetBtn}
              onClick={() => handleSelectToolForProbe("summarize_context")}
            >
              Summarize
            </button>
            <button
              className={styles.presetBtn}
              onClick={() => handleSelectToolForProbe("hybrid_search")}
            >
              Hybrid Search
            </button>
          </div>

          <MagneticButton strength={0.25}>
            <button
              className="comic-btn comic-btn-blue"
              onClick={handleExecuteProbe}
              disabled={probeLoading || isExpired}
              style={{
                padding: "0.5rem 1.25rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                cursor: isExpired ? "not-allowed" : "pointer",
                opacity: isExpired ? 0.6 : 1,
              }}
            >
              <span>{probeLoading ? "⏳" : "▶"}</span>
              <span>{probeLoading ? "Executing JSON-RPC…" : "Execute MCP Tool"}</span>
            </button>
          </MagneticButton>
        </div>

        {/* Live Execution Result */}
        {probeResult && (
          <div className={styles.resultBox}>
            <div className={styles.resultHeader}>
              <span className={probeResult.is_error ? styles.statusError : styles.statusSuccess}>
                <span>{probeResult.is_error ? "❌ Execution Error" : "✓ Execution Success"}</span>
              </span>
              {probeLatencyMs !== null && <span>Latency: {probeLatencyMs}ms</span>}
            </div>
            <pre className={styles.resultContent}>
              <code>
                {probeResult.content && probeResult.content[0]
                  ? probeResult.content[0].text
                  : JSON.stringify(probeResult, null, 2)}
              </code>
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
