"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckIcon, InfoIcon } from "lucide-react"

export default function DemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Shadcn/UI Green Theme Demo</h1>
        <p className="text-muted-foreground">Showcasing the green and lime color scheme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Buttons Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various button styles with green theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">Primary Button</Button>
            <Button variant="secondary" className="w-full">Secondary Button</Button>
            <Button variant="outline" className="w-full">Outline Button</Button>
            <Button variant="ghost" className="w-full">Ghost Button</Button>
            <Button variant="destructive" className="w-full">Destructive Button</Button>
          </CardContent>
        </Card>

        {/* Form Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input components with green focus states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="select">Select Option</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Type your message here" />
            </div>
          </CardContent>
        </Card>

        {/* Badges Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators with green variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="lime">Lime</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Demo */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Alert components with green accent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                This is an informational alert with the green theme applied.
              </AlertDescription>
            </Alert>
            <Alert className="border-green-200 bg-green-50">
              <CheckIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                Your action was completed successfully!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Color Palette Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Green and lime color variations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs font-medium">
                  Primary
                </div>
                <div className="h-8 bg-accent rounded flex items-center justify-center text-accent-foreground text-xs font-medium">
                  Accent
                </div>
                <div className="h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-medium">
                  Green 500
                </div>
                <div className="h-8 bg-lime-500 rounded flex items-center justify-center text-white text-xs font-medium">
                  Lime 500
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-green-100 rounded flex items-center justify-center text-green-800 text-xs font-medium">
                  Green 100
                </div>
                <div className="h-8 bg-lime-100 rounded flex items-center justify-center text-lime-800 text-xs font-medium">
                  Lime 100
                </div>
                <div className="h-8 bg-green-200 rounded flex items-center justify-center text-green-900 text-xs font-medium">
                  Green 200
                </div>
                <div className="h-8 bg-lime-200 rounded flex items-center justify-center text-lime-900 text-xs font-medium">
                  Lime 200
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}