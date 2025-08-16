"use client"

import { ReactNode } from "react"
import { Navigation } from "./navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: ReactNode
  user?: {
    name: string
    email: string
    role: string
  }
  onLogout?: () => void
}

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} onLogout={onLogout} />
      
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground">
                © 2024 Enterprise CRM
              </p>
              <Badge variant="lime" className="text-xs">
                v1.0.0
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="success" className="text-xs">
                Wszystkie systemy działają
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}