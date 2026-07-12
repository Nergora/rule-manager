import { useEffect, useState } from "react"
import { api, campaignApi, RuleDefinition, GeneralCampaign } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ListTree, TicketPercent, Activity, CheckCircle2 } from "lucide-react"

export default function Dashboard() {
  const [rules, setRules] = useState<RuleDefinition[]>([])
  const [campaigns, setCampaigns] = useState<GeneralCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesData, campaignsData] = await Promise.all([
          api.getAllRules(),
          campaignApi.getAllCampaigns()
        ])
        setRules(rulesData)
        setCampaigns(campaignsData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground mt-1">
          Monitor your rule engine performance and campaign statuses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rules
            </CardTitle>
            <ListTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{rules.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Registered business rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <TicketPercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{campaigns.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Across all e-commerce modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engine Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" /> Healthy
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Roslyn Compiler active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent rule executions and updates will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                No recent activity to display.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Load</CardTitle>
            <CardDescription>
              Rule evaluation latency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="ml-4 text-sm font-medium text-muted-foreground">1.2ms</span>
              </div>
              <p className="text-xs text-muted-foreground">Average evaluation time is excellent.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
