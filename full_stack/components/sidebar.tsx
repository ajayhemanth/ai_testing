"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  FileText,
  Shield,
  FolderOpen,
  Plug,
  Database,
  Globe,
  GitBranch,
  Brain,
  Bot,
  Settings,
  TestTube,
  FileCode,
  Activity,
  ChevronRight,
  Sparkles,
  Package,
  Cloud,
} from "lucide-react"

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        badge: "Live",
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen,
      },
    ],
  },
  {
    title: "Test Management",
    items: [
      {
        title: "Requirements",
        href: "/requirements",
        icon: FileCode,
        badge: "AI",
      },
      {
        title: "Test Cases",
        href: "/test-cases",
        icon: TestTube,
        badge: "AI",
      },
      {
        title: "Synthetic Data",
        href: "/synthetic-data-v2",
        icon: Database,
        badge: "AI",
      },
    ],
  },
  {
    title: "Compliance & Quality",
    items: [
      {
        title: "Compliance",
        href: "/compliance",
        icon: Shield,
        badge: "Multi-region",
      },
    ],
  },
  {
    title: "Integration & Testing",
    items: [
      {
        title: "API Testing",
        href: "/api-testing",
        icon: Globe,
      },
      {
        title: "Integrations",
        href: "/integrations",
        icon: Plug,
      },
      {
        title: "DevOps Monitor",
        href: "/devops",
        icon: GitBranch,
        badge: "Real-time",
      },
    ],
  },
  {
    title: "AI & Automation",
    items: [
      {
        title: "RAG Knowledge Base",
        href: "/knowledge-base",
        icon: Brain,
        badge: "Vertex AI",
      },
      {
        title: "Agent Orchestration",
        href: "/agents",
        icon: Bot,
        badge: "Multi-agent",
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        title: "BigQuery Sync",
        href: "/bigquery",
        icon: Cloud,
        badge: "GCP",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center justify-center px-6">
        <Link href="/" className="flex items-center">
          <img
            src="/team_logo.svg"
            alt="Digitide"
            className="h-10 w-auto"
          />
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {navigation.map((section, i) => (
            <div key={i} className="space-y-1">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className="ml-auto text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-blue-950 dark:to-purple-950">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Google Cloud</p>
              <p className="text-xs text-muted-foreground">Vertex AI Connected</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}