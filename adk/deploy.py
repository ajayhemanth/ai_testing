#!/usr/bin/env python3
"""
Deploy the Digitide multi-agent system to Google Cloud
"""

# export GOOGLE_APPLICATION_CREDENTIALS="../service_account.json" && python3 deploy.py

import vertexai
from vertexai import agent_engines
from google.oauth2 import service_account
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from digitide_agents import create_digitide_system

# Configuration
PROJECT_ID = "cloud-billed-1"
LOCATION = "us-central1"
STAGING_BUCKET = "gs://billed_bucket1"
# SERVICE_ACCOUNT_FILE = "./vishnu_service_account.json"
SERVICE_ACCOUNT_FILE = "../service_account.json"

# Load credentials
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=["https://www.googleapis.com/auth/cloud-platform"]
)

# Initialize Vertex AI
vertexai.init(
    project=PROJECT_ID,
    location=LOCATION,
    staging_bucket=STAGING_BUCKET,
    credentials=credentials
)


def deploy():
    """Deploy the multi-agent system to Google Cloud"""

    print("=" * 60)
    print("DEPLOYING DIGITIDE 38-AGENT SYSTEM")
    print("=" * 60)

    # Create the orchestrator
    orchestrator = create_digitide_system()

    print(f"\n✅ Created orchestrator: {orchestrator.name}")
    print(f"📊 Total agents: {len(orchestrator.tools)}")

    print("\n🚀 Deploying to Google Cloud...")

    try:
        # Deploy as agent engine
        engine = agent_engines.create(
            agent_engine=orchestrator,
            requirements=[
                "google-cloud-aiplatform[adk,agent_engines]",
                "cloudpickle"
            ],
            display_name="digitide-38-agents",
            description="Healthcare test automation with 38 specialized agents"
        )

        if hasattr(engine, 'resource_name'):
            engine_id = engine.resource_name.split('/')[-1]
            print(f"\n✅ Deployment Successful!")
            print(f"Engine ID: {engine_id}")
            print(f"Resource Name: {engine.resource_name}")

            # Save deployment info to metadata folder
            os.makedirs("metadata", exist_ok=True)
            with open("metadata/deployment_info.txt", "w") as f:
                f.write(f"ENGINE_ID={engine_id}\n")
                f.write(f"PROJECT_ID={PROJECT_ID}\n")
                f.write(f"LOCATION={LOCATION}\n")
                f.write(f"RESOURCE_NAME={engine.resource_name}\n")

            print(f"\n📋 Deployment info saved to metadata/deployment_info.txt")
            print(f"\n🎯 Use Engine ID in your Next.js app: {engine_id}")

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    deploy()