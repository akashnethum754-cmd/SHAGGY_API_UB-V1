export interface ParameterDef {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default: string;
  in: 'query' | 'path' | 'body';
}

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  method: 'GET' | 'POST';
  coinCost: number;
  authorId: string;
  authorName: string;
  parameters: ParameterDef[];
  sampleResponse: Record<string, any>;
  scraperType: string;
  status: 'active' | 'maintenance' | 'beta';
  totalCalls: number;
  successRate: number;
  averageLatencyMs: number;
  createdAt: number;
  updatedAt: number;
  presets?: Array<{ label: string; value: string }>;
}

export interface SystemStats {
  success: boolean;
  server: {
    name: string;
    environment: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuModel: string;
    cpuCores: number;
    loadAverage: number[];
  };
  dateTime: {
    timestamp: number;
    iso: string;
    utc: string;
    sriLankaFormatted: string;
    timezone: string;
  };
  ramUsage: {
    processRssMb: number;
    processHeapTotalMb: number;
    processHeapUsedMb: number;
    processExternalMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
    systemUsedMb: number;
    systemUsagePercent: number;
    heapUsagePercent: number;
  };
  uptime: {
    processUptimeSeconds: number;
    processUptimeHuman: string;
    systemUptimeSeconds: number;
    systemUptimeHuman: string;
    startedAt: string;
  };
  metrics: {
    totalRequests: number;
    averageLatencyMs: number;
    userCoinsRemaining: number;
    endpointBreakdown: Record<string, { calls: number; latencies: number[] }>;
    activeEndpoints: number;
    healthStatus: string;
  };
}
