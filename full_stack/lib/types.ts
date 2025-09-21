export interface Project {
  id: string
  name: string
  description?: string
  softwareType?: string
  targetCompliances?: string
  country?: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface TestCase {
  id: string
  projectId: string
  title: string
  description?: string
  testSteps?: string
  expectedResults?: string
  actualResults?: string
  status: string
  priority: string
  category?: string
  requirementId?: string
  createdAt: Date
  updatedAt: Date
  lastExecutedAt?: Date
  tags?: string
  automationStatus: string
  syntheticDataId?: string
}

export interface Requirement {
  id: string
  projectId: string
  title: string
  description?: string
  type?: string
  source?: string
  priority: string
  status: string
  complianceTags?: string
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceStandard {
  id: string
  name: string
  version?: string
  country?: string
  description?: string
  categories?: string
  requirements?: string
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceMapping {
  id: string
  testCaseId: string
  standardId: string
  subdivision?: string
  status: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceCheck {
  id: string
  projectId: string
  standardId: string
  status: string
  coverage: number
  findings?: string
  checkedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface SyntheticData {
  id: string
  projectId: string
  name: string
  type: string
  schema?: string
  data?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiTest {
  id: string
  projectId: string
  name: string
  endpoint: string
  method: string
  headers?: string
  body?: string
  expectedCode?: number
  expectedBody?: string
  status: string
  lastRunAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Integration {
  id: string
  projectId: string
  type: string
  name: string
  config?: string
  status: string
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DevOpsMetric {
  id: string
  projectId: string
  pipeline?: string
  buildStatus?: string
  testsPassed: number
  testsFailed: number
  testsSkipped: number
  coverage: number
  deploymentStatus?: string
  timestamp: Date
  createdAt: Date
}

export interface KnowledgeBase {
  id: string
  title: string
  content?: string
  category?: string
  tags?: string
  embeddings?: string
  createdAt: Date
  updatedAt: Date
}

export interface Agent {
  id: string
  name: string
  type: string
  description?: string
  config?: string
  status: string
  lastRunAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Setting {
  id: string
  key: string
  value?: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

export interface NavigationItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string | number
  children?: NavigationItem[]
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface MetricCard {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ComponentType<{ className?: string }>
}

export interface TestExecutionResult {
  id: string
  testCaseId: string
  status: 'passed' | 'failed' | 'skipped' | 'error'
  results?: string
  duration?: number
  error?: string
  executedBy?: string
  executedAt: Date
}

export interface ApiExecutionResult {
  id: string
  apiTestId: string
  status: string
  responseCode?: number
  responseBody?: string
  responseTime?: number
  error?: string
  executedAt: Date
}