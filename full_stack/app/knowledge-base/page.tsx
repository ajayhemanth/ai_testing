"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Search,
  Upload,
  FileText,
  Book,
  Lightbulb,
  Tag,
  Calendar,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

const knowledgeItems = [
  {
    id: 1,
    title: "FDA 21 CFR Part 11 Compliance Guide",
    category: "Compliance",
    tags: ["FDA", "Electronic Records", "Validation"],
    lastUpdated: "2 days ago",
    relevance: 95,
  },
  {
    id: 2,
    title: "Test Case Best Practices for Medical Devices",
    category: "Testing",
    tags: ["SaMD", "IEC 62304", "V&V"],
    lastUpdated: "1 week ago",
    relevance: 88,
  },
  {
    id: 3,
    title: "HIPAA Security Rule Implementation",
    category: "Security",
    tags: ["HIPAA", "PHI", "Encryption"],
    lastUpdated: "3 days ago",
    relevance: 92,
  },
  {
    id: 4,
    title: "ISO 13485 Quality Management System",
    category: "Quality",
    tags: ["ISO", "QMS", "Documentation"],
    lastUpdated: "5 days ago",
    relevance: 86,
  },
]

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleUpload = () => {
    toast.success("Documents uploaded", {
      description: "RAG engine is processing and indexing your documents...",
    })
  }

  const handleAskQuestion = () => {
    toast.success("Query submitted", {
      description: "Vertex AI is searching the knowledge base...",
    })
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RAG Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered knowledge retrieval and documentation
          </p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask the Knowledge Base</CardTitle>
          <CardDescription>
            Query your documentation using natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="What are the key requirements for FDA 21 CFR Part 11 compliance?"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAskQuestion}>
              <Sparkles className="mr-2 h-4 w-4" />
              Ask AI
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Indexed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,847</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across 12 categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Embeddings</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">524K</div>
            <p className="text-xs text-muted-foreground mt-2">
              Vector embeddings stored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Relevance score &gt; 0.8
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Repository</CardTitle>
          <CardDescription>
            Browse and search through indexed documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <div className="space-y-3">
                {knowledgeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <Book className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-xs text-muted-foreground">
                              <Tag className="inline h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{item.relevance}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {item.lastUpdated}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}