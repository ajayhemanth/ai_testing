import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get existing projects
    const projects = await prisma.project.findMany()

    if (projects.length === 0) {
      console.log('No projects found. Please create projects first.')
      return
    }

    console.log(`Found ${projects.length} projects. Seeding requirements...`)

    const requirements = [
      {
        projectId: projects[0]?.id,
        title: "User Authentication System",
        description: "System shall provide secure multi-factor authentication for healthcare professionals",
        type: "functional",
        priority: "high",
        status: "approved",
        source: "User Story US-234",
        complianceTags: "HIPAA,ISO 27001"
      },
      {
        projectId: projects[0]?.id,
        title: "Patient Data Encryption",
        description: "All patient data must be encrypted at rest using AES-256 encryption",
        type: "security",
        priority: "critical",
        status: "in-progress",
        source: "Compliance Doc",
        complianceTags: "HIPAA,GDPR"
      },
      {
        projectId: projects[0]?.id,
        title: "Real-time Vital Signs Monitoring",
        description: "System shall capture and display vital signs with latency less than 100ms",
        type: "performance",
        priority: "high",
        status: "pending",
        source: "Technical Spec",
        complianceTags: "IEC 62304,FDA 21 CFR"
      },
      {
        projectId: projects[1]?.id || projects[0]?.id,
        title: "Audit Trail Logging",
        description: "System must maintain comprehensive audit logs for all data access and modifications",
        type: "compliance",
        priority: "critical",
        status: "completed",
        source: "HIPAA Requirements",
        complianceTags: "HIPAA,SOC 2"
      },
      {
        projectId: projects[1]?.id || projects[0]?.id,
        title: "Backup and Recovery",
        description: "Implement automated backup with RPO of 1 hour and RTO of 4 hours",
        type: "non-functional",
        priority: "high",
        status: "in-progress",
        source: "Business Continuity Plan",
        complianceTags: "ISO 27001"
      },
      {
        projectId: projects[1]?.id || projects[0]?.id,
        title: "Role-Based Access Control",
        description: "Implement RBAC with granular permissions for different user roles",
        type: "security",
        priority: "critical",
        status: "completed",
        source: "Security Architecture Doc",
        complianceTags: "HIPAA,GDPR,ISO 27001"
      },
      {
        projectId: projects[2]?.id || projects[0]?.id,
        title: "Mobile Responsive Design",
        description: "Application must be fully responsive and functional on mobile devices",
        type: "usability",
        priority: "medium",
        status: "pending",
        source: "UX Requirements",
        complianceTags: ""
      },
      {
        projectId: projects[2]?.id || projects[0]?.id,
        title: "API Rate Limiting",
        description: "Implement rate limiting to prevent API abuse and ensure system stability",
        type: "performance",
        priority: "medium",
        status: "in-progress",
        source: "API Specification",
        complianceTags: ""
      }
    ]

    // Create requirements
    for (const req of requirements) {
      if (req.projectId) {
        await prisma.requirement.create({
          data: req
        })
      }
    }

    console.log(`Successfully seeded ${requirements.filter(r => r.projectId).length} requirements`)
  } catch (error) {
    console.error('Error seeding requirements:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()