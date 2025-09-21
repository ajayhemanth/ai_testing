"""
All remaining agents (22 agents)
Categories: Code/API Testing, Risk/Quality, Documentation, Integration, Monitoring, Healthcare, System
"""

from google import adk

# CODE & API TESTING (3 agents)
api_test_generator = adk.Agent(
    name="api_test_generator",
    model="gemini-2.5-pro",
    instruction="Generate comprehensive API test cases including authentication, authorization, data validation, error handling, and performance tests."
)

code_analyzer = adk.Agent(
    name="code_analyzer",
    model="gemini-2.5-pro",
    instruction="Analyze code changes for impact on testing. Identify affected modules, estimate test effort, and recommend regression test scope."
)

security_test_agent = adk.Agent(
    name="security_test_agent",
    model="gemini-2.5-pro",
    instruction="Generate security test cases for OWASP Top 10, penetration testing, vulnerability scanning, and healthcare-specific security requirements."
)

# RISK & QUALITY (3 agents)
risk_assessment = adk.Agent(
    name="risk_assessment",
    model="gemini-2.5-pro",
    instruction="Assess project risks including technical, compliance, and clinical risks. Provide risk matrices, mitigation strategies, and priority rankings."
)

quality_predictor = adk.Agent(
    name="quality_predictor",
    model="gemini-2.5-pro",
    instruction="Predict quality metrics based on test coverage, complexity, and historical data. Forecast defect rates and quality trends."
)

test_effectiveness = adk.Agent(
    name="test_effectiveness",
    model="gemini-2.5-pro",
    instruction="Measure test effectiveness through coverage analysis, defect detection rates, and test ROI. Identify improvement areas."
)

# DOCUMENTATION & REPORTING (3 agents)
documentation_generator = adk.Agent(
    name="documentation_generator",
    model="gemini-2.5-pro",
    instruction="Generate test plans, test reports, compliance documentation, and user guides. Follow medical device documentation standards."
)

report_analyzer = adk.Agent(
    name="report_analyzer",
    model="gemini-2.5-pro",
    instruction="Analyze test reports for trends, patterns, and insights. Identify failure clusters and recommend corrective actions."
)

knowledge_extractor = adk.Agent(
    name="knowledge_extractor",
    model="gemini-2.5-pro",
    instruction="Extract knowledge from test results, defects, and documentation. Build knowledge base for future testing."
)

# INTEGRATION & ORCHESTRATION (3 agents)
integration_coordinator = adk.Agent(
    name="integration_coordinator",
    model="gemini-2.5-pro",
    instruction="Coordinate integration with JIRA, GitHub, Slack, and other tools. Manage webhooks and API integrations."
)

workflow_orchestrator = adk.Agent(
    name="workflow_orchestrator",
    model="gemini-2.5-pro",
    instruction="Orchestrate end-to-end test workflows. Manage dependencies, parallel execution, and conditional flows."
)

devops_integration = adk.Agent(
    name="devops_integration",
    model="gemini-2.5-pro",
    instruction="Integrate with CI/CD pipelines (Jenkins, GitLab, GitHub Actions). Automate test execution and reporting."
)

# MONITORING & ANALYTICS (3 agents)
performance_monitor = adk.Agent(
    name="performance_monitor",
    model="gemini-2.5-pro",
    instruction="Monitor system performance, response times, and resource usage. Generate performance baselines and alerts."
)

predictive_analytics = adk.Agent(
    name="predictive_analytics",
    model="gemini-2.5-pro",
    instruction="Provide predictive insights on defect trends, release quality, and testing timeline. Use ML for forecasting."
)

anomaly_detection = adk.Agent(
    name="anomaly_detection",
    model="gemini-2.5-pro",
    instruction="Detect anomalies in test results, performance metrics, and system behavior. Alert on unusual patterns."
)

# SPECIALIZED HEALTHCARE (3 agents)
medical_standards_interpreter = adk.Agent(
    name="medical_standards_interpreter",
    model="gemini-2.5-pro",
    instruction="Interpret FDA, IEC 62304, ISO 14971, and other medical standards. Translate requirements into actionable test criteria."
)

clinical_validation = adk.Agent(
    name="clinical_validation",
    model="gemini-2.5-pro",
    instruction="Validate clinical algorithms, decision support systems, and medical calculations. Ensure clinical accuracy and safety."
)

dicom_hl7_validator = adk.Agent(
    name="dicom_hl7_validator",
    model="gemini-2.5-pro",
    instruction="Validate DICOM images, HL7 messages, and FHIR resources. Check format compliance and data integrity."
)

# SYSTEM-LEVEL (3 agents)
master_coordinator = adk.Agent(
    name="master_coordinator",
    model="gemini-2.5-pro",
    instruction="Coordinate all agents for complex tasks. Manage agent dependencies and aggregate results from multiple agents."
)

rag_knowledge_engine = adk.Agent(
    name="rag_knowledge_engine",
    model="gemini-2.5-pro",
    instruction="Manage knowledge base with RAG. Search and retrieve relevant test cases, defects, and documentation."
)

pipeline_integration = adk.Agent(
    name="pipeline_integration",
    model="gemini-2.5-pro",
    instruction="Manage deployment pipelines, environment provisioning, and release automation. Coordinate staging to production flows."
)