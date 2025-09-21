import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.devOpsMetric.deleteMany()
  await prisma.apiExecution.deleteMany()
  await prisma.testExecution.deleteMany()
  await prisma.complianceMapping.deleteMany()
  await prisma.complianceCheck.deleteMany()
  await prisma.apiTest.deleteMany()
  await prisma.testCase.deleteMany()
  await prisma.syntheticData.deleteMany()
  await prisma.requirement.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.project.deleteMany()
  await prisma.complianceStandard.deleteMany()
  await prisma.knowledgeBase.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.setting.deleteMany()

  // Create Projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'MedSecure Patient Portal',
        description: 'Secure patient portal with telemedicine features',
        softwareType: 'patient-portal',
        targetCompliances: 'HIPAA,FDA 21 CFR Part 11,ISO 27001',
        country: 'USA',
        status: 'active',
      }
    }),
    prisma.project.create({
      data: {
        name: 'DiagnosticAI Pro',
        description: 'AI-powered diagnostic imaging system',
        softwareType: 'samd',
        targetCompliances: 'MDR 2017/745,ISO 13485,IEC 62304',
        country: 'EU',
        status: 'active',
      }
    }),
    prisma.project.create({
      data: {
        name: 'HealthTrack EHR',
        description: 'Electronic health records management system',
        softwareType: 'ehr',
        targetCompliances: 'HIPAA,CDSCO,ISO 9001',
        country: 'INDIA',
        status: 'active',
      }
    }),
  ])

  // Create Activities for Projects
  const activities = await Promise.all([
    // Activities for MedSecure Patient Portal
    prisma.activity.create({
      data: {
        projectId: projects[0].id,
        type: 'project_created',
        description: 'Project initialized with HIPAA compliance framework',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[0].id,
        type: 'requirement_added',
        description: 'Added 12 core requirements for patient portal',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[0].id,
        type: 'test_executed',
        description: 'Security test suite executed - 95% pass rate',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[0].id,
        type: 'compliance_updated',
        description: 'HIPAA compliance checklist updated',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[0].id,
        type: 'deployment',
        description: 'Deployed to staging environment for UAT',
      }
    }),
    // Activities for DiagnosticAI Pro
    prisma.activity.create({
      data: {
        projectId: projects[1].id,
        type: 'project_created',
        description: 'AI diagnostic system project initiated',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[1].id,
        type: 'risk_assessment',
        description: 'Risk assessment completed for Class II medical device',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[1].id,
        type: 'model_training',
        description: 'AI model training completed with 98.5% accuracy',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[1].id,
        type: 'compliance_updated',
        description: 'MDR 2017/745 documentation prepared',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[1].id,
        type: 'test_executed',
        description: 'Clinical validation tests - 89% complete',
      }
    }),
    // Activities for HealthTrack EHR
    prisma.activity.create({
      data: {
        projectId: projects[2].id,
        type: 'project_created',
        description: 'EHR system project initiated',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[2].id,
        type: 'requirement_added',
        description: 'Added HL7 FHIR integration requirements',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[2].id,
        type: 'integration_configured',
        description: 'FHIR server integration configured',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[2].id,
        type: 'test_executed',
        description: 'Integration tests completed - 87% pass rate',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[2].id,
        type: 'milestone_reached',
        description: 'Phase 1 development completed',
      }
    }),
    prisma.activity.create({
      data: {
        projectId: projects[2].id,
        type: 'review_scheduled',
        description: 'Scheduled compliance review for next week',
      }
    }),
  ])

  // Create Compliance Standards
  const standards = await Promise.all([
    prisma.complianceStandard.create({
      data: {
        name: 'HIPAA',
        version: '2024',
        country: 'USA',
        description: 'Health Insurance Portability and Accountability Act',
        categories: 'Privacy,Security,Breach Notification',
      }
    }),
    prisma.complianceStandard.create({
      data: {
        name: 'FDA 21 CFR Part 11',
        version: '2024',
        country: 'USA',
        description: 'Electronic Records and Electronic Signatures',
        categories: 'Electronic Records,Electronic Signatures,Validation',
      }
    }),
    prisma.complianceStandard.create({
      data: {
        name: 'ISO 13485',
        version: '2016',
        country: 'GLOBAL',
        description: 'Medical devices - Quality management systems',
        categories: 'Quality Management,Risk Management,Design Controls',
      }
    }),
    prisma.complianceStandard.create({
      data: {
        name: 'MDR 2017/745',
        version: '2017',
        country: 'EU',
        description: 'Medical Device Regulation',
        categories: 'Safety,Performance,Clinical Evaluation',
      }
    }),
  ])

  // Create Requirements
  const requirements = await Promise.all([
    // Requirements for MedSecure Patient Portal (projects[0])
    prisma.requirement.create({
      data: {
        projectId: projects[0].id,
        title: 'User Authentication',
        description: 'System shall provide secure multi-factor authentication',
        type: 'functional',
        source: 'Business Requirements Document',
        priority: 'critical',
        status: 'approved',
        complianceTags: 'HIPAA,ISO 27001',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[0].id,
        title: 'Data Encryption',
        description: 'All patient data shall be encrypted at rest and in transit',
        type: 'security',
        source: 'Security Requirements',
        priority: 'critical',
        status: 'approved',
        complianceTags: 'HIPAA,FDA',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[0].id,
        title: 'Audit Logging',
        description: 'System shall maintain comprehensive audit logs',
        type: 'compliance',
        source: 'Compliance Requirements',
        priority: 'high',
        status: 'approved',
        complianceTags: 'HIPAA,FDA',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[0].id,
        title: 'Session Management',
        description: 'Sessions must timeout after 30 minutes of inactivity',
        type: 'security',
        source: 'Security Requirements',
        priority: 'high',
        status: 'in-progress',
        complianceTags: 'HIPAA',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[0].id,
        title: 'Video Consultation',
        description: 'Support secure video consultations between patients and providers',
        type: 'functional',
        source: 'User Story US-456',
        priority: 'medium',
        status: 'pending',
        complianceTags: 'HIPAA',
      }
    }),

    // Requirements for DiagnosticAI Pro (projects[1])
    prisma.requirement.create({
      data: {
        projectId: projects[1].id,
        title: 'Image Processing',
        description: 'AI model shall process DICOM images with 99% accuracy',
        type: 'functional',
        source: 'Technical Specification',
        priority: 'critical',
        status: 'approved',
        complianceTags: 'MDR,ISO 13485',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[1].id,
        title: 'Model Explainability',
        description: 'AI decisions must be explainable and auditable',
        type: 'regulatory',
        source: 'MDR Requirements',
        priority: 'critical',
        status: 'approved',
        complianceTags: 'MDR 2017/745,IEC 62304',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[1].id,
        title: 'Clinical Validation',
        description: 'System must achieve 95% sensitivity and 90% specificity in clinical trials',
        type: 'performance',
        source: 'Clinical Requirements',
        priority: 'critical',
        status: 'in-progress',
        complianceTags: 'MDR,ISO 13485',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[1].id,
        title: 'DICOM Compatibility',
        description: 'Support all standard DICOM image formats and metadata',
        type: 'integration',
        source: 'Integration Requirements',
        priority: 'high',
        status: 'approved',
        complianceTags: 'IEC 62304',
      }
    }),

    // Requirements for HealthTrack EHR (projects[2])
    prisma.requirement.create({
      data: {
        projectId: projects[2].id,
        title: 'HL7 FHIR Support',
        description: 'Implement full HL7 FHIR R4 API for data exchange',
        type: 'integration',
        source: 'Integration Requirements',
        priority: 'critical',
        status: 'approved',
        complianceTags: 'HL7,ISO 9001',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[2].id,
        title: 'Clinical Decision Support',
        description: 'Provide real-time drug interaction and allergy alerts',
        type: 'functional',
        source: 'Clinical Requirements',
        priority: 'high',
        status: 'in-progress',
        complianceTags: 'CDSCO',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[2].id,
        title: 'Mobile Access',
        description: 'Provide secure mobile access with offline capabilities',
        type: 'functional',
        source: 'User Requirements',
        priority: 'medium',
        status: 'pending',
        complianceTags: 'ISO 27001',
      }
    }),
    prisma.requirement.create({
      data: {
        projectId: projects[2].id,
        title: 'Backup and Recovery',
        description: 'Automated daily backups with RTO < 4 hours and RPO < 1 hour',
        type: 'operational',
        source: 'Business Continuity Plan',
        priority: 'critical',
        status: 'approved',
        complianceTags: 'ISO 9001,ISO 27001',
      }
    }),
  ])

  // Create Synthetic Data
  const syntheticData = await Promise.all([
    prisma.syntheticData.create({
      data: {
        projectId: projects[0].id,
        name: 'Patient Test Dataset',
        type: 'patient-records',
        schema: JSON.stringify({
          fields: ['patientId', 'name', 'dob', 'ssn', 'diagnosis']
        }),
        data: JSON.stringify([
          { patientId: 'P001', name: 'John Doe', dob: '1980-01-01' },
          { patientId: 'P002', name: 'Jane Smith', dob: '1975-05-15' },
        ]),
      }
    }),
    prisma.syntheticData.create({
      data: {
        projectId: projects[0].id,
        name: 'Medical Records Dataset',
        type: 'medical-records',
        schema: JSON.stringify({
          fields: ['recordId', 'patientId', 'diagnosis', 'prescription']
        }),
        data: JSON.stringify([
          { recordId: 'R001', patientId: 'P001', diagnosis: 'Hypertension' },
        ]),
      }
    }),
  ])

  // Create Test Cases
  const testCases = await Promise.all([
    // Test cases for MedSecure Patient Portal (projects[0])
    prisma.testCase.create({
      data: {
        projectId: projects[0].id,
        requirementId: requirements[0].id,
        title: 'TC001: Valid User Login',
        description: 'Verify user can login with valid credentials',
        testSteps: '1. Enter username\n2. Enter password\n3. Click login',
        expectedResults: 'User successfully logged in',
        status: 'passed',
        priority: 'critical',
        category: 'Authentication',
        compliance: 'HIPAA',
        automationStatus: 'automated',
        syntheticDataId: syntheticData[0].id,
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[0].id,
        requirementId: requirements[0].id,
        title: 'TC002: Invalid Password',
        description: 'Verify system rejects invalid password',
        testSteps: '1. Enter username\n2. Enter wrong password\n3. Click login',
        expectedResults: 'Error message displayed',
        status: 'passed',
        priority: 'high',
        category: 'Authentication',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[0].id,
        requirementId: requirements[1].id,
        title: 'TC003: Data Encryption Verification',
        description: 'Verify patient data is encrypted',
        testSteps: '1. Store patient data\n2. Check database encryption',
        expectedResults: 'Data stored in encrypted format',
        status: 'passed',
        priority: 'critical',
        category: 'Security',
        compliance: 'HIPAA',
        automationStatus: 'manual',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[0].id,
        requirementId: requirements[3].id,
        title: 'TC004: Session Timeout',
        description: 'Verify session expires after inactivity',
        testSteps: '1. Login\n2. Wait 30 minutes\n3. Try to access protected page',
        expectedResults: 'User redirected to login',
        actualResults: 'Session did not expire - BUG',
        status: 'failed',
        priority: 'high',
        category: 'Security',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[0].id,
        requirementId: requirements[2].id,
        title: 'TC005: Audit Log Generation',
        description: 'Verify audit logs are created',
        testSteps: '1. Perform user action\n2. Check audit logs',
        expectedResults: 'Action logged with timestamp',
        status: 'passed',
        priority: 'high',
        category: 'Compliance',
        compliance: 'FDA 21 CFR Part 11',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[0].id,
        requirementId: requirements[4].id,
        title: 'TC006: Video Call Quality',
        description: 'Test video consultation quality and stability',
        testSteps: '1. Initiate video call\n2. Monitor quality metrics\n3. Test for 30 minutes',
        expectedResults: 'Stable connection with HD quality',
        status: 'in_progress',
        priority: 'medium',
        category: 'Functional',
        automationStatus: 'manual',
      }
    }),

    // Test cases for DiagnosticAI Pro (projects[1])
    prisma.testCase.create({
      data: {
        projectId: projects[1].id,
        requirementId: requirements[5].id,
        title: 'TC007: DICOM Image Processing',
        description: 'Verify AI model processes DICOM images correctly',
        testSteps: '1. Upload DICOM image\n2. Run AI analysis\n3. Verify results',
        expectedResults: 'Image processed with 99% accuracy',
        actualResults: 'Achieved 99.2% accuracy',
        status: 'passed',
        priority: 'critical',
        category: 'Functional',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[1].id,
        requirementId: requirements[6].id,
        title: 'TC008: AI Model Explainability',
        description: 'Test AI decision explanation features',
        testSteps: '1. Process test image\n2. Request explanation\n3. Verify explanation quality',
        expectedResults: 'Clear explanation with highlighted regions',
        status: 'passed',
        priority: 'critical',
        category: 'Regulatory',
        automationStatus: 'manual',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[1].id,
        requirementId: requirements[7].id,
        title: 'TC009: Clinical Trial Validation',
        description: 'Validate model performance against clinical data',
        testSteps: '1. Run on clinical dataset\n2. Compare with expert diagnosis\n3. Calculate metrics',
        expectedResults: '95% sensitivity, 90% specificity',
        actualResults: '94% sensitivity, 91% specificity',
        status: 'in_progress',
        priority: 'critical',
        category: 'Validation',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[1].id,
        requirementId: requirements[8].id,
        title: 'TC010: Multi-format DICOM Support',
        description: 'Test various DICOM formats and modalities',
        testSteps: '1. Test CT images\n2. Test MRI images\n3. Test X-ray images',
        expectedResults: 'All formats processed successfully',
        status: 'passed',
        priority: 'high',
        category: 'Integration',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[1].id,
        title: 'TC011: Performance Under Load',
        description: 'Test system performance with concurrent image processing',
        testSteps: '1. Submit 100 images simultaneously\n2. Monitor processing time\n3. Check accuracy',
        expectedResults: 'All images processed within 5 seconds each',
        status: 'blocked',
        priority: 'medium',
        category: 'Performance',
        automationStatus: 'automated',
      }
    }),

    // Test cases for HealthTrack EHR (projects[2])
    prisma.testCase.create({
      data: {
        projectId: projects[2].id,
        requirementId: requirements[9].id,
        title: 'TC012: FHIR API Patient Create',
        description: 'Test creating patient resource via FHIR API',
        testSteps: '1. Send POST to /Patient\n2. Validate response\n3. Verify resource created',
        expectedResults: 'Patient resource created with 201 response',
        status: 'passed',
        priority: 'critical',
        category: 'Integration',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[2].id,
        requirementId: requirements[9].id,
        title: 'TC013: FHIR Bundle Transaction',
        description: 'Test FHIR bundle transaction processing',
        testSteps: '1. Create bundle with multiple resources\n2. Submit transaction\n3. Verify atomicity',
        expectedResults: 'All resources created or none (atomic)',
        status: 'passed',
        priority: 'high',
        category: 'Integration',
        automationStatus: 'automated',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[2].id,
        requirementId: requirements[10].id,
        title: 'TC014: Drug Interaction Alert',
        description: 'Verify drug interaction checking',
        testSteps: '1. Enter conflicting medications\n2. Check for alert\n3. Verify alert accuracy',
        expectedResults: 'Alert shown for known interactions',
        status: 'in_progress',
        priority: 'high',
        category: 'Clinical',
        automationStatus: 'manual',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[2].id,
        requirementId: requirements[11].id,
        title: 'TC015: Mobile Offline Mode',
        description: 'Test mobile app offline capabilities',
        testSteps: '1. Use app offline\n2. Create/edit records\n3. Go online and sync',
        expectedResults: 'Data syncs without conflicts',
        status: 'pending',
        priority: 'medium',
        category: 'Mobile',
        automationStatus: 'manual',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[2].id,
        requirementId: requirements[12].id,
        title: 'TC016: Backup Recovery Test',
        description: 'Test disaster recovery procedure',
        testSteps: '1. Simulate failure\n2. Initiate recovery\n3. Verify data integrity',
        expectedResults: 'System recovered within RTO',
        status: 'not_started',
        priority: 'critical',
        category: 'Operational',
        automationStatus: 'manual',
      }
    }),
    prisma.testCase.create({
      data: {
        projectId: projects[2].id,
        title: 'TC017: Concurrent User Load',
        description: 'Test with 500 concurrent users',
        testSteps: '1. Simulate 500 users\n2. Monitor response times\n3. Check error rates',
        expectedResults: 'Response time < 2s, error rate < 1%',
        actualResults: 'Response time 1.8s, 0.5% errors',
        status: 'passed',
        priority: 'high',
        category: 'Performance',
        automationStatus: 'automated',
      }
    }),
  ])

  // Create Test Executions
  const now = new Date()
  const testExecutions = await Promise.all([
    prisma.testExecution.create({
      data: {
        testCaseId: testCases[0].id,
        status: 'passed',
        results: 'Login successful',
        duration: 1200,
        executedBy: 'Automation',
        executedAt: new Date(now.getTime() - 86400000), // 1 day ago
      }
    }),
    prisma.testExecution.create({
      data: {
        testCaseId: testCases[0].id,
        status: 'passed',
        results: 'Login successful',
        duration: 1100,
        executedBy: 'Automation',
        executedAt: new Date(now.getTime() - 172800000), // 2 days ago
      }
    }),
    prisma.testExecution.create({
      data: {
        testCaseId: testCases[1].id,
        status: 'passed',
        results: 'Error message displayed correctly',
        duration: 800,
        executedBy: 'Automation',
        executedAt: new Date(now.getTime() - 3600000), // 1 hour ago
      }
    }),
    prisma.testExecution.create({
      data: {
        testCaseId: testCases[3].id,
        status: 'failed',
        results: 'Session did not timeout',
        error: 'Session still active after 30 minutes',
        duration: 1805000,
        executedBy: 'Manual',
        executedAt: new Date(now.getTime() - 7200000), // 2 hours ago
      }
    }),
  ])

  // Create API Tests
  const apiTests = await Promise.all([
    prisma.apiTest.create({
      data: {
        projectId: projects[0].id,
        name: 'Get Patient Data',
        endpoint: '/api/v1/patients/{id}',
        method: 'GET',
        headers: JSON.stringify({ 'Authorization': 'Bearer token' }),
        expectedCode: 200,
        status: 'passed',
        lastRunAt: new Date(now.getTime() - 3600000),
      }
    }),
    prisma.apiTest.create({
      data: {
        projectId: projects[0].id,
        name: 'Create Patient',
        endpoint: '/api/v1/patients',
        method: 'POST',
        headers: JSON.stringify({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: 'Test Patient' }),
        expectedCode: 201,
        status: 'passed',
        lastRunAt: new Date(now.getTime() - 7200000),
      }
    }),
    prisma.apiTest.create({
      data: {
        projectId: projects[0].id,
        name: 'Update Patient',
        endpoint: '/api/v1/patients/{id}',
        method: 'PUT',
        expectedCode: 200,
        status: 'failed',
        lastRunAt: new Date(now.getTime() - 1800000),
      }
    }),
  ])

  // Create API Executions
  await Promise.all([
    prisma.apiExecution.create({
      data: {
        apiTestId: apiTests[0].id,
        status: 'passed',
        responseCode: 200,
        responseBody: JSON.stringify({ patientId: 'P001' }),
        responseTime: 145,
        executedAt: new Date(now.getTime() - 3600000),
      }
    }),
    prisma.apiExecution.create({
      data: {
        apiTestId: apiTests[1].id,
        status: 'passed',
        responseCode: 201,
        responseTime: 267,
        executedAt: new Date(now.getTime() - 7200000),
      }
    }),
    prisma.apiExecution.create({
      data: {
        apiTestId: apiTests[2].id,
        status: 'failed',
        responseCode: 500,
        responseTime: 1200,
        error: 'Internal Server Error',
        executedAt: new Date(now.getTime() - 1800000),
      }
    }),
  ])

  // Create Compliance Mappings
  await Promise.all([
    prisma.complianceMapping.create({
      data: {
        testCaseId: testCases[0].id,
        standardId: standards[0].id,
        subdivision: 'Section 164.312(a)(1)',
        status: 'verified',
        notes: 'Access control requirement satisfied',
      }
    }),
    prisma.complianceMapping.create({
      data: {
        testCaseId: testCases[2].id,
        standardId: standards[0].id,
        subdivision: 'Section 164.312(a)(2)(iv)',
        status: 'verified',
        notes: 'Encryption requirement satisfied',
      }
    }),
    prisma.complianceMapping.create({
      data: {
        testCaseId: testCases[4].id,
        standardId: standards[1].id,
        subdivision: 'Part 11.10(e)',
        status: 'verified',
        notes: 'Audit trail requirement satisfied',
      }
    }),
  ])

  // Create Compliance Checks
  await Promise.all([
    prisma.complianceCheck.create({
      data: {
        projectId: projects[0].id,
        standardId: standards[0].id,
        status: 'compliant',
        coverage: 92.5,
        findings: '15 of 16 requirements satisfied',
        checkedAt: new Date(now.getTime() - 86400000),
      }
    }),
    prisma.complianceCheck.create({
      data: {
        projectId: projects[0].id,
        standardId: standards[1].id,
        status: 'partial',
        coverage: 78.3,
        findings: '18 of 23 requirements satisfied',
        checkedAt: new Date(now.getTime() - 172800000),
      }
    }),
  ])

  // Create Integrations
  await Promise.all([
    prisma.integration.create({
      data: {
        projectId: projects[0].id,
        type: 'jira',
        name: 'Jira Cloud',
        config: JSON.stringify({ url: 'https://company.atlassian.net' }),
        status: 'active',
        lastSyncAt: new Date(now.getTime() - 1800000),
      }
    }),
    prisma.integration.create({
      data: {
        projectId: projects[0].id,
        type: 'github',
        name: 'GitHub Actions',
        config: JSON.stringify({ repo: 'company/project' }),
        status: 'active',
        lastSyncAt: new Date(now.getTime() - 3600000),
      }
    }),
    prisma.integration.create({
      data: {
        projectId: projects[0].id,
        type: 'jenkins',
        name: 'Jenkins CI/CD',
        config: JSON.stringify({ url: 'https://jenkins.company.com' }),
        status: 'inactive',
      }
    }),
  ])

  // Create DevOps Metrics
  await Promise.all([
    prisma.devOpsMetric.create({
      data: {
        projectId: projects[0].id,
        pipeline: 'main-pipeline',
        buildStatus: 'success',
        testsPassed: 156,
        testsFailed: 12,
        testsSkipped: 3,
        coverage: 82.5,
        deploymentStatus: 'deployed',
        timestamp: new Date(now.getTime() - 3600000),
      }
    }),
    prisma.devOpsMetric.create({
      data: {
        projectId: projects[0].id,
        pipeline: 'main-pipeline',
        buildStatus: 'success',
        testsPassed: 145,
        testsFailed: 23,
        testsSkipped: 3,
        coverage: 78.2,
        deploymentStatus: 'deployed',
        timestamp: new Date(now.getTime() - 86400000),
      }
    }),
    prisma.devOpsMetric.create({
      data: {
        projectId: projects[0].id,
        pipeline: 'develop-pipeline',
        buildStatus: 'failed',
        testsPassed: 89,
        testsFailed: 67,
        testsSkipped: 15,
        coverage: 65.3,
        deploymentStatus: 'failed',
        timestamp: new Date(now.getTime() - 7200000),
      }
    }),
  ])

  // Create Agents
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: 'Test Case Generator',
        type: 'test-generator',
        description: 'Generates comprehensive test cases from requirements',
        config: JSON.stringify({ model: 'gemini-pro', temperature: 0.7 }),
        status: 'active',
        lastRunAt: new Date(now.getTime() - 1800000),
      }
    }),
    prisma.agent.create({
      data: {
        name: 'Compliance Validator',
        type: 'compliance-checker',
        description: 'Validates test cases against compliance standards',
        config: JSON.stringify({ model: 'gemini-pro', temperature: 0.3 }),
        status: 'active',
        lastRunAt: new Date(now.getTime() - 3600000),
      }
    }),
    prisma.agent.create({
      data: {
        name: 'Data Synthesizer',
        type: 'data-synthesizer',
        description: 'Generates synthetic test data',
        config: JSON.stringify({ model: 'gemini-pro', temperature: 0.8 }),
        status: 'active',
        lastRunAt: new Date(now.getTime() - 7200000),
      }
    }),
    prisma.agent.create({
      data: {
        name: 'Risk Assessor',
        type: 'risk-assessor',
        description: 'Assesses risks in requirements and test coverage',
        config: JSON.stringify({ model: 'gemini-pro' }),
        status: 'idle',
      }
    }),
    prisma.agent.create({
      data: {
        name: 'Requirement Analyzer',
        type: 'requirement-analyzer',
        description: 'Analyzes and extracts requirements from documents',
        config: JSON.stringify({ model: 'gemini-pro' }),
        status: 'active',
        lastRunAt: new Date(now.getTime() - 14400000),
      }
    }),
  ])

  // Create Knowledge Base entries
  await Promise.all([
    prisma.knowledgeBase.create({
      data: {
        title: 'HIPAA Compliance Checklist',
        content: 'Complete checklist for HIPAA compliance including technical safeguards...',
        category: 'Compliance',
        tags: 'HIPAA,Security,Privacy',
      }
    }),
    prisma.knowledgeBase.create({
      data: {
        title: 'Test Automation Best Practices',
        content: 'Best practices for test automation in healthcare software...',
        category: 'Testing',
        tags: 'Automation,Best Practices',
      }
    }),
    prisma.knowledgeBase.create({
      data: {
        title: 'FDA Software Validation Guide',
        content: 'Guidelines for FDA software validation and documentation...',
        category: 'Regulatory',
        tags: 'FDA,Validation',
      }
    }),
  ])

  // Create Settings
  await Promise.all([
    prisma.setting.create({
      data: {
        key: 'api_key',
        value: 'sk-...',
        category: 'security',
      }
    }),
    prisma.setting.create({
      data: {
        key: 'default_compliance',
        value: 'HIPAA',
        category: 'defaults',
      }
    }),
    prisma.setting.create({
      data: {
        key: 'auto_generate_tests',
        value: 'true',
        category: 'automation',
      }
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`  - ${projects.length} projects`)
  console.log(`  - ${activities.length} activities`)
  console.log(`  - ${requirements.length} requirements`)
  console.log(`  - ${testCases.length} test cases`)
  console.log(`  - ${standards.length} compliance standards`)
  console.log(`  - ${testExecutions.length} test executions`)
  console.log(`  - ${apiTests.length} API tests`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })