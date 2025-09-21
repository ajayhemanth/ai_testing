"""
Main Orchestrator that coordinates all 38 agents using AgentTools
"""

from google import adk
from google.adk.tools.agent_tool import AgentTool

# Import all agents
from .test_agents import (
    test_case_generator,
    negative_test_generator,
    test_optimizer,
    test_update_validator,
    test_improvement_suggester
)

from .compliance_agents import (
    compliance_validator,
    compliance_gap_analyzer,
    audit_trail_generator
)

from .data_agents import (
    synthetic_data_generator,
    privacy_validator,
    schema_generator
)

from .requirement_agents import (
    requirement_extractor,
    requirement_analyzer,
    user_story_generator,
    document_gap_analyst,
    adaptive_questionnaire,
    requirement_synthesis
)

from .all_other_agents import (
    api_test_generator,
    code_analyzer,
    security_test_agent,
    risk_assessment,
    quality_predictor,
    test_effectiveness,
    documentation_generator,
    report_analyzer,
    knowledge_extractor,
    integration_coordinator,
    workflow_orchestrator,
    devops_integration,
    performance_monitor,
    predictive_analytics,
    anomaly_detection,
    medical_standards_interpreter,
    clinical_validation,
    dicom_hl7_validator,
    master_coordinator,
    rag_knowledge_engine,
    pipeline_integration
)


def create_digitide_system():
    """
    Creates the complete Digitide multi-agent system with orchestrator
    """

    # Create the main orchestrator agent
    orchestrator = adk.Agent(
        name="digitide_orchestrator",
        model="gemini-2.5-pro",
        instruction="""You are the master orchestrator for the Digitide Healthcare Test Automation Platform.

        You coordinate 38 specialized agents to provide comprehensive test automation for healthcare applications.

        Available Agent Categories:

        1. TEST CASE GENERATION (5 agents):
           - test_case_generator: Generate comprehensive test cases
           - negative_test_generator: Create edge cases and failure scenarios
           - test_optimizer: Optimize test coverage and reduce redundancy
           - test_update_validator: Validate test updates against compliance
           - test_improvement_suggester: Suggest test improvements

        2. COMPLIANCE & VALIDATION (3 agents):
           - compliance_validator: Validate against HIPAA, FDA, ISO standards
           - compliance_gap_analyzer: Identify missing compliance requirements
           - audit_trail_generator: Generate audit trails for traceability

        3. DATA & CONTENT (3 agents):
           - synthetic_data_generator: Generate HIPAA-compliant test data
           - privacy_validator: Validate data privacy compliance
           - schema_generator: Generate data schemas

        4. REQUIREMENT ANALYSIS (6 agents):
           - requirement_extractor: Extract requirements from documents
           - requirement_analyzer: Analyze requirement quality
           - user_story_generator: Convert requirements to user stories
           - document_gap_analyst: Find documentation gaps
           - adaptive_questionnaire: Generate questions for gaps
           - requirement_synthesis: Combine requirements from multiple sources

        5. CODE & API TESTING (3 agents):
           - api_test_generator: Generate API test cases
           - code_analyzer: Analyze code change impact
           - security_test_agent: Generate security tests

        6. RISK & QUALITY (3 agents):
           - risk_assessment: Assess project risks
           - quality_predictor: Predict quality metrics
           - test_effectiveness: Measure test effectiveness

        7. DOCUMENTATION & REPORTING (3 agents):
           - documentation_generator: Generate test documentation
           - report_analyzer: Analyze test reports
           - knowledge_extractor: Extract patterns from data

        8. INTEGRATION & ORCHESTRATION (3 agents):
           - integration_coordinator: Coordinate tool integrations
           - workflow_orchestrator: Orchestrate test workflows
           - devops_integration: Integrate with CI/CD

        9. MONITORING & ANALYTICS (3 agents):
           - performance_monitor: Monitor system performance
           - predictive_analytics: Provide predictive insights
           - anomaly_detection: Detect anomalies

        10. SPECIALIZED HEALTHCARE (3 agents):
            - medical_standards_interpreter: Interpret medical standards
            - clinical_validation: Validate clinical algorithms
            - dicom_hl7_validator: Validate medical data formats

        11. SYSTEM-LEVEL (3 agents):
            - master_coordinator: Coordinate complex multi-agent tasks
            - rag_knowledge_engine: Manage knowledge base
            - pipeline_integration: Manage deployment pipelines

        Your role:
        - Understand user requests
        - Determine which agents are needed
        - Coordinate agent execution
        - Aggregate and present results
        - Handle complex workflows requiring multiple agents

        For each request:
        1. Analyze what needs to be done
        2. Select appropriate agents
        3. Coordinate their execution
        4. Combine results into a comprehensive response
        5. Ensure all compliance and quality standards are met
        """,
        tools=[
            # Test Case Generation AgentTools
            AgentTool(agent=test_case_generator),
            AgentTool(agent=negative_test_generator),
            AgentTool(agent=test_optimizer),
            AgentTool(agent=test_update_validator),
            AgentTool(agent=test_improvement_suggester),

            # Compliance AgentTools
            AgentTool(agent=compliance_validator),
            AgentTool(agent=compliance_gap_analyzer),
            AgentTool(agent=audit_trail_generator),

            # Data Generation AgentTools
            AgentTool(agent=synthetic_data_generator),
            AgentTool(agent=privacy_validator),
            AgentTool(agent=schema_generator),

            # Requirement Analysis AgentTools
            AgentTool(agent=requirement_extractor),
            AgentTool(agent=requirement_analyzer),
            AgentTool(agent=user_story_generator),
            AgentTool(agent=document_gap_analyst),
            AgentTool(agent=adaptive_questionnaire),
            AgentTool(agent=requirement_synthesis),

            # Code & API Testing AgentTools
            AgentTool(agent=api_test_generator),
            AgentTool(agent=code_analyzer),
            AgentTool(agent=security_test_agent),

            # Risk & Quality AgentTools
            AgentTool(agent=risk_assessment),
            AgentTool(agent=quality_predictor),
            AgentTool(agent=test_effectiveness),

            # Documentation & Reporting AgentTools
            AgentTool(agent=documentation_generator),
            AgentTool(agent=report_analyzer),
            AgentTool(agent=knowledge_extractor),

            # Integration & Orchestration AgentTools
            AgentTool(agent=integration_coordinator),
            AgentTool(agent=workflow_orchestrator),
            AgentTool(agent=devops_integration),

            # Monitoring & Analytics AgentTools
            AgentTool(agent=performance_monitor),
            AgentTool(agent=predictive_analytics),
            AgentTool(agent=anomaly_detection),

            # Specialized Healthcare AgentTools
            AgentTool(agent=medical_standards_interpreter),
            AgentTool(agent=clinical_validation),
            AgentTool(agent=dicom_hl7_validator),

            # System-Level AgentTools
            AgentTool(agent=master_coordinator),
            AgentTool(agent=rag_knowledge_engine),
            AgentTool(agent=pipeline_integration)
        ]
    )

    return orchestrator