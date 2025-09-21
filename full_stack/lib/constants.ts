export const COMPLIANCE_STANDARDS = {
  USA: [
    { id: 'fda', name: 'FDA 21 CFR Part 11', category: 'Healthcare' },
    { id: 'hipaa', name: 'HIPAA', category: 'Healthcare' },
    { id: 'sox', name: 'SOX', category: 'Financial' },
  ],
  EU: [
    { id: 'mdr', name: 'MDR 2017/745', category: 'Medical Devices' },
    { id: 'ivdr', name: 'IVDR 2017/746', category: 'In Vitro Diagnostics' },
    { id: 'gdpr', name: 'GDPR', category: 'Data Protection' },
  ],
  INDIA: [
    { id: 'cdsco', name: 'CDSCO', category: 'Healthcare' },
    { id: 'icmr', name: 'ICMR Guidelines', category: 'Medical Research' },
  ],
  GLOBAL: [
    { id: 'iso13485', name: 'ISO 13485:2016', category: 'Medical Devices' },
    { id: 'iso14971', name: 'ISO 14971:2019', category: 'Risk Management' },
    { id: 'iec62304', name: 'IEC 62304:2006', category: 'Medical Device Software' },
    { id: 'iso9001', name: 'ISO 9001:2015', category: 'Quality Management' },
    { id: 'iso27001', name: 'ISO 27001:2022', category: 'Information Security' },
  ],
}

export const SOFTWARE_TYPES = [
  { value: 'samd', label: 'Software as Medical Device (SaMD)' },
  { value: 'simd', label: 'Software in Medical Device (SiMD)' },
  { value: 'clinical', label: 'Clinical Decision Support' },
  { value: 'ehr', label: 'Electronic Health Records (EHR)' },
  { value: 'pacs', label: 'PACS/Medical Imaging' },
  { value: 'lis', label: 'Laboratory Information System' },
  { value: 'pharmacy', label: 'Pharmacy Management' },
  { value: 'telemedicine', label: 'Telemedicine Platform' },
  { value: 'patient-portal', label: 'Patient Portal' },
  { value: 'medical-billing', label: 'Medical Billing' },
]

export const TEST_PRIORITIES = [
  { value: 'critical', label: 'Critical', color: 'red' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'low', label: 'Low', color: 'green' },
]

export const TEST_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'in-progress', label: 'In Progress', color: 'blue' },
  { value: 'passed', label: 'Passed', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'blocked', label: 'Blocked', color: 'orange' },
  { value: 'skipped', label: 'Skipped', color: 'gray' },
]

export const INTEGRATION_TYPES = [
  { value: 'jira', label: 'Jira', icon: '🔗' },
  { value: 'azure-devops', label: 'Azure DevOps', icon: '☁️' },
  { value: 'github', label: 'GitHub', icon: '🐙' },
  { value: 'gitlab', label: 'GitLab', icon: '🦊' },
  { value: 'jenkins', label: 'Jenkins', icon: '🏗️' },
  { value: 'polarion', label: 'Polarion', icon: '📊' },
  { value: 'slack', label: 'Slack', icon: '💬' },
  { value: 'teams', label: 'Microsoft Teams', icon: '👥' },
]

export const API_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]

export const AGENT_TYPES = [
  { value: 'test-generator', label: 'Test Case Generator' },
  { value: 'compliance-checker', label: 'Compliance Checker' },
  { value: 'data-synthesizer', label: 'Data Synthesizer' },
  { value: 'api-tester', label: 'API Tester' },
  { value: 'requirement-analyzer', label: 'Requirement Analyzer' },
  { value: 'risk-assessor', label: 'Risk Assessor' },
  { value: 'documentation-reviewer', label: 'Documentation Reviewer' },
]

export const MOCK_VERTEX_AGENTS = [
  {
    id: 'agent-1',
    name: 'Test Case Generator Agent',
    type: 'test-generator',
    status: 'active',
    description: 'Generates comprehensive test cases from requirements',
    lastRunAt: new Date().toISOString(),
  },
  {
    id: 'agent-2',
    name: 'Compliance Validator Agent',
    type: 'compliance-checker',
    status: 'active',
    description: 'Validates test cases against compliance standards',
    lastRunAt: new Date().toISOString(),
  },
  {
    id: 'agent-3',
    name: 'Synthetic Data Creator Agent',
    type: 'data-synthesizer',
    status: 'inactive',
    description: 'Creates realistic test data for various scenarios',
    lastRunAt: null,
  },
]