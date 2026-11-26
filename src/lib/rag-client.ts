import {
  fetchWithRetry,
  generateTraceparent,
  requireUserId,
  REQUEST_TIMEOUT,
  type RagRequestContext,
  type RetrieverConfig,
} from "./rag/http";
import * as ragAdmin from "./rag/rag-admin";
import * as ragChat from "./rag/rag-chat";
import * as ragDocs from "./rag/rag-documents";
import * as ragGraph from "./rag/rag-graph";

export type { RetrieverConfig };

export class RetrieverClient {
  private config: RetrieverConfig;
  public lastTraceId: string | null = null;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  get tenantId(): string {
    return this.config.tenantId;
  }

  private get ctx(): RagRequestContext {
    return {
      config: this.config,
      request: this.request.bind(this),
      setTraceId: (id) => {
        this.lastTraceId = id;
      },
    };
  }


  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}${path}`;
    const validUserId = requireUserId(this.config.userId);
    const { traceparent, traceId } = generateTraceparent();
    this.lastTraceId = traceId;

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": validUserId,
      "X-Tenant-ID": this.config.tenantId,
      "traceparent": traceparent,
    };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetchWithRetry(url, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
        signal: options.signal ?? controller.signal,
      });
      clearTimeout(timeoutId);
      const respTraceId = res.headers.get("x-trace-id") || res.headers.get("X-Trace-Id");
      if (respTraceId) {
        this.lastTraceId = respTraceId;
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }



  search(...args: Parameters<typeof ragDocs.search> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.search(this.ctx, ...args);
  }
  listDocuments(...args: Parameters<typeof ragDocs.listDocuments> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.listDocuments(this.ctx, ...args);
  }
  createSession(...args: Parameters<typeof ragChat.createSession> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.createSession(this.ctx, ...args);
  }
  chat(...args: Parameters<typeof ragChat.chat> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.chat(this.ctx, ...args);
  }
  chatComplete(...args: Parameters<typeof ragChat.chatComplete> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.chatComplete(this.ctx, ...args);
  }
  completions(...args: Parameters<typeof ragChat.completions> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.completions(this.ctx, ...args);
  }
  completionsStream(...args: Parameters<typeof ragChat.completionsStream> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.completionsStream(this.ctx, ...args);
  }
  uploadDocument(...args: Parameters<typeof ragDocs.uploadDocument> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.uploadDocument(this.ctx, ...args);
  }
  deleteDocument(...args: Parameters<typeof ragDocs.deleteDocument> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.deleteDocument(this.ctx, ...args);
  }
  extractDocument<T = Record<string, unknown>>(
    documentId: string,
    jsonSchema: Record<string, unknown> | string,
    model?: string
  ) {
    return ragDocs.extractDocument<T>(this.ctx, documentId, jsonSchema, model);
  }
  submitFeedback(...args: Parameters<typeof ragChat.submitFeedback> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.submitFeedback(this.ctx, ...args);
  }
  getDownloadUrl(...args: Parameters<typeof ragDocs.getDownloadUrl> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.getDownloadUrl(this.ctx, ...args);
  }
  listTenants(...args: Parameters<typeof ragAdmin.listTenants> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listTenants(this.ctx, ...args);
  }
  getGraphCapabilities(...args: Parameters<typeof ragGraph.getGraphCapabilities> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.getGraphCapabilities(this.ctx, ...args);
  }
  switchGraphEngine(...args: Parameters<typeof ragGraph.switchGraphEngine> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.switchGraphEngine(this.ctx, ...args);
  }
  getGraphSummary(...args: Parameters<typeof ragGraph.getGraphSummary> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.getGraphSummary(this.ctx, ...args);
  }
  queryGraph(...args: Parameters<typeof ragGraph.queryGraph> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.queryGraph(this.ctx, ...args);
  }
  deleteTriple(...args: Parameters<typeof ragGraph.deleteTriple> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.deleteTriple(this.ctx, ...args);
  }
  purgeCache(...args: Parameters<typeof ragDocs.purgeCache> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.purgeCache(this.ctx, ...args);
  }
  getCacheStats(...args: Parameters<typeof ragDocs.getCacheStats> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.getCacheStats(this.ctx, ...args);
  }
  compressContext(...args: Parameters<typeof ragDocs.compressContext> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.compressContext(this.ctx, ...args);
  }
  generateConsensus(...args: Parameters<typeof ragGraph.generateConsensus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.generateConsensus(this.ctx, ...args);
  }
  executeRlmSubroutine(...args: Parameters<typeof ragGraph.executeRlmSubroutine> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.executeRlmSubroutine(this.ctx, ...args);
  }
  getOnlineEvaluationSummary(...args: Parameters<typeof ragAdmin.getOnlineEvaluationSummary> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getOnlineEvaluationSummary(this.ctx, ...args);
  }
  computeGroundingDiff(...args: Parameters<typeof ragAdmin.computeGroundingDiff> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.computeGroundingDiff(this.ctx, ...args);
  }
  listLoraAdapters(...args: Parameters<typeof ragAdmin.listLoraAdapters> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listLoraAdapters(this.ctx, ...args);
  }
  trainLoraAdapter(...args: Parameters<typeof ragAdmin.trainLoraAdapter> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.trainLoraAdapter(this.ctx, ...args);
  }
  projectEmbeddings(...args: Parameters<typeof ragDocs.projectEmbeddings> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.projectEmbeddings(this.ctx, ...args);
  }
  classifyIntent(...args: Parameters<typeof ragChat.classifyIntent> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.classifyIntent(this.ctx, ...args);
  }
  listAgentTools(...args: Parameters<typeof ragGraph.listAgentTools> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.listAgentTools(this.ctx, ...args);
  }
  executeAgentWorkflow(...args: Parameters<typeof ragGraph.executeAgentWorkflow> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.executeAgentWorkflow(this.ctx, ...args);
  }
  streamAgenticWorkflow(...args: Parameters<typeof ragGraph.streamAgenticWorkflow> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.streamAgenticWorkflow(this.ctx, ...args);
  }
  resumeAgentWorkflow(...args: Parameters<typeof ragGraph.resumeAgentWorkflow> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.resumeAgentWorkflow(this.ctx, ...args);
  }
  getAgentThreadHistory(...args: Parameters<typeof ragGraph.getAgentThreadHistory> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.getAgentThreadHistory(this.ctx, ...args);
  }
  rollbackAgentThread(...args: Parameters<typeof ragGraph.rollbackAgentThread> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.rollbackAgentThread(this.ctx, ...args);
  }
  getAgenticEconomicLedger(...args: Parameters<typeof ragGraph.getAgenticEconomicLedger> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.getAgenticEconomicLedger(this.ctx, ...args);
  }
  classifyAgenticComplexity(...args: Parameters<typeof ragGraph.classifyAgenticComplexity> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.classifyAgenticComplexity(this.ctx, ...args);
  }
  getMemoryStats(...args: Parameters<typeof ragChat.getMemoryStats> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.getMemoryStats(this.ctx, ...args);
  }
  listMemoryNodes(...args: Parameters<typeof ragChat.listMemoryNodes> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.listMemoryNodes(this.ctx, ...args);
  }
  testMemoryGuidance(...args: Parameters<typeof ragChat.testMemoryGuidance> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.testMemoryGuidance(this.ctx, ...args);
  }
  consolidateMemoryTrace(...args: Parameters<typeof ragChat.consolidateMemoryTrace> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.consolidateMemoryTrace(this.ctx, ...args);
  }
  deleteMemoryNode(...args: Parameters<typeof ragChat.deleteMemoryNode> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.deleteMemoryNode(this.ctx, ...args);
  }
  pruneMemories(...args: Parameters<typeof ragChat.pruneMemories> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.pruneMemories(this.ctx, ...args);
  }
  getGatewayModels(...args: Parameters<typeof ragAdmin.getGatewayModels> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getGatewayModels(this.ctx, ...args);
  }
  probeGateway(...args: Parameters<typeof ragAdmin.probeGateway> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.probeGateway(this.ctx, ...args);
  }
  getTenantGatewayRoutes(...args: Parameters<typeof ragAdmin.getTenantGatewayRoutes> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getTenantGatewayRoutes(this.ctx, ...args);
  }
  updateTenantGatewayRoutes(...args: Parameters<typeof ragAdmin.updateTenantGatewayRoutes> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.updateTenantGatewayRoutes(this.ctx, ...args);
  }
  getTenantGatewayBudget(...args: Parameters<typeof ragAdmin.getTenantGatewayBudget> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getTenantGatewayBudget(this.ctx, ...args);
  }
  getGuardrailTemplates(...args: Parameters<typeof ragAdmin.getGuardrailTemplates> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getGuardrailTemplates(this.ctx, ...args);
  }
  getGuardrailConfig(...args: Parameters<typeof ragAdmin.getGuardrailConfig> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getGuardrailConfig(this.ctx, ...args);
  }
  updateGuardrailConfig(...args: Parameters<typeof ragAdmin.updateGuardrailConfig> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.updateGuardrailConfig(this.ctx, ...args);
  }
  validateGuardrailInput(...args: Parameters<typeof ragAdmin.validateGuardrailInput> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.validateGuardrailInput(this.ctx, ...args);
  }
  validateGuardrailOutput(...args: Parameters<typeof ragAdmin.validateGuardrailOutput> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.validateGuardrailOutput(this.ctx, ...args);
  }
  testGuardrailFlow(...args: Parameters<typeof ragAdmin.testGuardrailFlow> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.testGuardrailFlow(this.ctx, ...args);
  }
  getGuardrailTelemetry(...args: Parameters<typeof ragAdmin.getGuardrailTelemetry> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getGuardrailTelemetry(this.ctx, ...args);
  }
  getServerlessStatus(...args: Parameters<typeof ragAdmin.getServerlessStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getServerlessStatus(this.ctx, ...args);
  }
  probeServerlessGpu(...args: Parameters<typeof ragAdmin.probeServerlessGpu> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.probeServerlessGpu(this.ctx, ...args);
  }
  getServerlessCostSavings(...args: Parameters<typeof ragAdmin.getServerlessCostSavings> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getServerlessCostSavings(this.ctx, ...args);
  }
  getTenantLoraAdapters(...args: Parameters<typeof ragAdmin.getTenantLoraAdapters> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getTenantLoraAdapters(this.ctx, ...args);
  }
  getActiveTenantLoraAdapter(...args: Parameters<typeof ragAdmin.getActiveTenantLoraAdapter> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getActiveTenantLoraAdapter(this.ctx, ...args);
  }
  registerTenantLoraAdapter(...args: Parameters<typeof ragAdmin.registerTenantLoraAdapter> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.registerTenantLoraAdapter(this.ctx, ...args);
  }
  activateTenantLoraAdapter(...args: Parameters<typeof ragAdmin.activateTenantLoraAdapter> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.activateTenantLoraAdapter(this.ctx, ...args);
  }
  deactivateTenantLoraAdapter(...args: Parameters<typeof ragAdmin.deactivateTenantLoraAdapter> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.deactivateTenantLoraAdapter(this.ctx, ...args);
  }
  deleteTenantLoraAdapter(...args: Parameters<typeof ragAdmin.deleteTenantLoraAdapter> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.deleteTenantLoraAdapter(this.ctx, ...args);
  }
  analyzeScaffoldingRequirement(...args: Parameters<typeof ragAdmin.analyzeScaffoldingRequirement> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.analyzeScaffoldingRequirement(this.ctx, ...args);
  }
  generateScaffoldingPlan(...args: Parameters<typeof ragAdmin.generateScaffoldingPlan> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.generateScaffoldingPlan(this.ctx, ...args);
  }
  verifyScaffoldingCode(...args: Parameters<typeof ragAdmin.verifyScaffoldingCode> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.verifyScaffoldingCode(this.ctx, ...args);
  }
  applyScaffoldingPlan(...args: Parameters<typeof ragAdmin.applyScaffoldingPlan> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.applyScaffoldingPlan(this.ctx, ...args);
  }
  reloadCustomPlugins(...args: Parameters<typeof ragAdmin.reloadCustomPlugins> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.reloadCustomPlugins(this.ctx, ...args);
  }
  listCustomPlugins(...args: Parameters<typeof ragAdmin.listCustomPlugins> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listCustomPlugins(this.ctx, ...args);
  }
  deleteCustomPlugin(...args: Parameters<typeof ragAdmin.deleteCustomPlugin> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.deleteCustomPlugin(this.ctx, ...args);
  }
  getScaffoldingStatus(...args: Parameters<typeof ragAdmin.getScaffoldingStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getScaffoldingStatus(this.ctx, ...args);
  }
  getEdgeNodes(...args: Parameters<typeof ragAdmin.getEdgeNodes> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getEdgeNodes(this.ctx, ...args);
  }
  registerEdgeNode(...args: Parameters<typeof ragAdmin.registerEdgeNode> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.registerEdgeNode(this.ctx, ...args);
  }
  getEdgeDelta(...args: Parameters<typeof ragAdmin.getEdgeDelta> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getEdgeDelta(this.ctx, ...args);
  }
  generateEdgeBundleManifest(...args: Parameters<typeof ragAdmin.generateEdgeBundleManifest> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.generateEdgeBundleManifest(this.ctx, ...args);
  }
  downloadEdgeBundle(...args: Parameters<typeof ragAdmin.downloadEdgeBundle> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.downloadEdgeBundle(this.ctx, ...args);
  }
  searchEdgeSimulated(...args: Parameters<typeof ragAdmin.searchEdgeSimulated> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.searchEdgeSimulated(this.ctx, ...args);
  }
  reconcileEdgeMutations(...args: Parameters<typeof ragAdmin.reconcileEdgeMutations> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.reconcileEdgeMutations(this.ctx, ...args);
  }
  getMultiCloudClusters(...args: Parameters<typeof ragAdmin.getMultiCloudClusters> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMultiCloudClusters(this.ctx, ...args);
  }
  probeMultiCloudRegions(...args: Parameters<typeof ragAdmin.probeMultiCloudRegions> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.probeMultiCloudRegions(this.ctx, ...args);
  }
  triggerMultiCloudFailover(...args: Parameters<typeof ragAdmin.triggerMultiCloudFailover> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.triggerMultiCloudFailover(this.ctx, ...args);
  }
  getLibsqlReplicationStatus(...args: Parameters<typeof ragAdmin.getLibsqlReplicationStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getLibsqlReplicationStatus(this.ctx, ...args);
  }
  getTenantLibsqlConfig(...args: Parameters<typeof ragAdmin.getTenantLibsqlConfig> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getTenantLibsqlConfig(this.ctx, ...args);
  }
  syncTenantLibsqlReplica(...args: Parameters<typeof ragAdmin.syncTenantLibsqlReplica> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.syncTenantLibsqlReplica(this.ctx, ...args);
  }
  getMcpConfig(...args: Parameters<typeof ragAdmin.getMcpConfig> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMcpConfig(this.ctx, ...args);
  }
  getMcpTools(...args: Parameters<typeof ragAdmin.getMcpTools> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMcpTools(this.ctx, ...args);
  }
  testMcpTool(...args: Parameters<typeof ragAdmin.testMcpTool> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.testMcpTool(this.ctx, ...args);
  }
  getMeshStatus(...args: Parameters<typeof ragAdmin.getMeshStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMeshStatus(this.ctx, ...args);
  }
  listMeshNodes(...args: Parameters<typeof ragAdmin.listMeshNodes> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listMeshNodes(this.ctx, ...args);
  }
  listMeshTools(...args: Parameters<typeof ragAdmin.listMeshTools> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listMeshTools(this.ctx, ...args);
  }
  executeMeshTool(...args: Parameters<typeof ragAdmin.executeMeshTool> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.executeMeshTool(this.ctx, ...args);
  }
  delegateFederatedTask(...args: Parameters<typeof ragAdmin.delegateFederatedTask> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.delegateFederatedTask(this.ctx, ...args);
  }
  getFederatedTaskStatus(...args: Parameters<typeof ragAdmin.getFederatedTaskStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getFederatedTaskStatus(this.ctx, ...args);
  }
  getMeshLoadMetrics(...args: Parameters<typeof ragAdmin.getMeshLoadMetrics> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMeshLoadMetrics(this.ctx, ...args);
  }
  getAutoscalingEvents(...args: Parameters<typeof ragAdmin.getAutoscalingEvents> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getAutoscalingEvents(this.ctx, ...args);
  }
  updateAutoscalingPolicy(...args: Parameters<typeof ragAdmin.updateAutoscalingPolicy> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.updateAutoscalingPolicy(this.ctx, ...args);
  }
  reapIdleEnclaves(...args: Parameters<typeof ragAdmin.reapIdleEnclaves> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.reapIdleEnclaves(this.ctx, ...args);
  }
  extractSchematicText(...args: Parameters<typeof ragDocs.extractSchematicText> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.extractSchematicText(this.ctx, ...args);
  }
  queryMultimodalGraph(...args: Parameters<typeof ragGraph.queryMultimodalGraph> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragGraph.queryMultimodalGraph(this.ctx, ...args);
  }
  getDocumentSchematics(...args: Parameters<typeof ragDocs.getDocumentSchematics> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.getDocumentSchematics(this.ctx, ...args);
  }
  getMultimodalVisionStatus(...args: Parameters<typeof ragDocs.getMultimodalVisionStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragDocs.getMultimodalVisionStatus(this.ctx, ...args);
  }
  getShardTopology(...args: Parameters<typeof ragAdmin.getShardTopology> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getShardTopology(this.ctx, ...args);
  }
  queryShardedVectors(...args: Parameters<typeof ragAdmin.queryShardedVectors> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.queryShardedVectors(this.ctx, ...args);
  }
  mutateShardedVectors(...args: Parameters<typeof ragAdmin.mutateShardedVectors> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.mutateShardedVectors(this.ctx, ...args);
  }
  getRaftConsensusStatus(...args: Parameters<typeof ragAdmin.getRaftConsensusStatus> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getRaftConsensusStatus(this.ctx, ...args);
  }
  triggerRaftElection(...args: Parameters<typeof ragAdmin.triggerRaftElection> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.triggerRaftElection(this.ctx, ...args);
  }
  rebalanceShards(...args: Parameters<typeof ragAdmin.rebalanceShards> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.rebalanceShards(this.ctx, ...args);
  }
  snapshotShard(...args: Parameters<typeof ragAdmin.snapshotShard> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.snapshotShard(this.ctx, ...args);
  }
  getAttestationHealth(...args: Parameters<typeof ragAdmin.getAttestationHealth> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getAttestationHealth(this.ctx, ...args);
  }
  computeDocumentMerkleRoot(...args: Parameters<typeof ragAdmin.computeDocumentMerkleRoot> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.computeDocumentMerkleRoot(this.ctx, ...args);
  }
  getChunkInclusionProof(...args: Parameters<typeof ragAdmin.getChunkInclusionProof> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getChunkInclusionProof(this.ctx, ...args);
  }
  issueGroundingCertificate(...args: Parameters<typeof ragAdmin.issueGroundingCertificate> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.issueGroundingCertificate(this.ctx, ...args);
  }
  verifyGroundingCertificate(...args: Parameters<typeof ragAdmin.verifyGroundingCertificate> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.verifyGroundingCertificate(this.ctx, ...args);
  }
  listGroundingCertificates(...args: Parameters<typeof ragAdmin.listGroundingCertificates> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listGroundingCertificates(this.ctx, ...args);
  }
  getSamlConfig(...args: Parameters<typeof ragAdmin.getSamlConfig> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getSamlConfig(this.ctx, ...args);
  }
  configureSamlIdp(...args: Parameters<typeof ragAdmin.configureSamlIdp> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.configureSamlIdp(this.ctx, ...args);
  }
  getSpMetadataXml(...args: Parameters<typeof ragAdmin.getSpMetadataXml> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getSpMetadataXml(this.ctx, ...args);
  }
  validateSamlAcs(...args: Parameters<typeof ragAdmin.validateSamlAcs> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.validateSamlAcs(this.ctx, ...args);
  }
  generateScimToken(...args: Parameters<typeof ragAdmin.generateScimToken> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.generateScimToken(this.ctx, ...args);
  }
  listScimUsers(...args: Parameters<typeof ragAdmin.listScimUsers> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listScimUsers(this.ctx, ...args);
  }
  createScimUser(...args: Parameters<typeof ragAdmin.createScimUser> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.createScimUser(this.ctx, ...args);
  }
  patchScimUser(...args: Parameters<typeof ragAdmin.patchScimUser> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.patchScimUser(this.ctx, ...args);
  }
  deleteScimUser(...args: Parameters<typeof ragAdmin.deleteScimUser> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.deleteScimUser(this.ctx, ...args);
  }
  listScimGroups(...args: Parameters<typeof ragAdmin.listScimGroups> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listScimGroups(this.ctx, ...args);
  }
  createScimGroup(...args: Parameters<typeof ragAdmin.createScimGroup> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.createScimGroup(this.ctx, ...args);
  }
  simulateRbVac(...args: Parameters<typeof ragAdmin.simulateRbVac> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.simulateRbVac(this.ctx, ...args);
  }
  createMpcSession(...args: Parameters<typeof ragAdmin.createMpcSession> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.createMpcSession(this.ctx, ...args);
  }
  listMpcSessions(...args: Parameters<typeof ragAdmin.listMpcSessions> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.listMpcSessions(this.ctx, ...args);
  }
  getMpcSession(...args: Parameters<typeof ragAdmin.getMpcSession> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMpcSession(this.ctx, ...args);
  }
  joinMpcSession(...args: Parameters<typeof ragAdmin.joinMpcSession> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.joinMpcSession(this.ctx, ...args);
  }
  submitMpcVectorShares(...args: Parameters<typeof ragAdmin.submitMpcVectorShares> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.submitMpcVectorShares(this.ctx, ...args);
  }
  executeMpcCompute(...args: Parameters<typeof ragAdmin.executeMpcCompute> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.executeMpcCompute(this.ctx, ...args);
  }
  getMpcResults(...args: Parameters<typeof ragAdmin.getMpcResults> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.getMpcResults(this.ctx, ...args);
  }
  abortMpcSession(...args: Parameters<typeof ragAdmin.abortMpcSession> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.abortMpcSession(this.ctx, ...args);
  }
  simulateMpcMath(...args: Parameters<typeof ragAdmin.simulateMpcMath> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragAdmin.simulateMpcMath(this.ctx, ...args);
  }
  getSystemPrompt(...args: Parameters<typeof ragChat.getSystemPrompt> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.getSystemPrompt(this.ctx, ...args);
  }
  updateSystemPrompt(...args: Parameters<typeof ragChat.updateSystemPrompt> extends [RagRequestContext, ...infer P] ? P : never) {
    return ragChat.updateSystemPrompt(this.ctx, ...args);
  }
}

export * from "./rag-types";
