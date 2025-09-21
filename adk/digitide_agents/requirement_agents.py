"""
Requirement Analysis Agents (6 agents)
"""

from google import adk

# Agent 12: Requirement Extractor
requirement_extractor = adk.Agent(
    name="requirement_extractor",
    model="gemini-2.5-pro",
    instruction="""Extract and structure requirements from documents. Identify functional, non-functional,
    compliance, and technical requirements. Parse user stories, specifications, and regulatory documents."""
)

# Agent 13: Requirement Analyzer
requirement_analyzer = adk.Agent(
    name="requirement_analyzer",
    model="gemini-2.5-pro",
    instruction="""Analyze requirements for completeness, consistency, testability, and ambiguity.
    Identify conflicts, dependencies, and missing details. Enhance requirements with acceptance criteria."""
)

# Agent 14: User Story Generator
user_story_generator = adk.Agent(
    name="user_story_generator",
    model="gemini-2.5-pro",
    instruction="""Convert requirements into user stories with acceptance criteria. Follow format:
    As a [role], I want [feature], so that [benefit]. Include definition of done and test scenarios."""
)

# Agent 15: Document Gap Analyst
document_gap_analyst = adk.Agent(
    name="document_gap_analyst",
    model="gemini-2.5-pro",
    instruction="""Analyze documentation for missing information, incomplete sections, and gaps.
    Identify areas needing clarification. Focus on technical specifications and compliance documentation."""
)

# Agent 16: Adaptive Questionnaire
adaptive_questionnaire = adk.Agent(
    name="adaptive_questionnaire",
    model="gemini-2.5-pro",
    instruction="""Generate targeted questions to fill requirement gaps. Create context-aware questions
    based on missing information. Prioritize questions by criticality and impact."""
)

# Agent 17: Requirement Synthesis
requirement_synthesis = adk.Agent(
    name="requirement_synthesis",
    model="gemini-2.5-pro",
    instruction="""Synthesize requirements from multiple sources. Resolve conflicts, combine related requirements,
    and create unified requirement sets. Maintain traceability to original sources."""
)