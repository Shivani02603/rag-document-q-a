```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Database, 
  MessageSquare, 
  Upload, 
  Users,
  Server,
  FileText,
  Clock
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

interface RecentItem {
  id: string;
  type: 'query' | 'upload' | 'session' | 'user';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'processing' | 'error';
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'Query Pipeline',
      value: '1,234',
      description: 'Total queries processed',
      icon: <MessageSquare className="h-4 w-4" />,
      trend: '+12%',
      color: 'bg-blue-500'
    },
    {
      title: 'Session Management',
      value: '89',
      description: 'Active chat sessions',
      icon: <Users className="h-4 w-4" />,
      trend: '+5%',
      color: 'bg-green-500'
    },
    {
      title: 'Database',
      value: '45.2K',
      description: 'Vector chunks stored',
      icon: <Database className="h-4 w-4" />,
      trend: '+23%',
      color: 'bg-purple-500'
    },
    {
      title: 'Deployment',
      value: '3',
      description: 'Running services',
      icon: <Server className="h-4 w-4" />,
      color: 'bg-orange-500'
    }
  ]);

  const [recentItems, setRecentItems] = useState<RecentItem[]>([
    {
      id: '1',
      type: 'query',
      title: 'Sales Q3 Analysis',
      description: 'What were the top performing products in Q3?',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'upload',
      title: 'financial_data.xlsx',
      description: 'Uploaded by John Doe',
      timestamp: '15 minutes ago',
      status: 'processing'
    },
    {
      id: '3',
      type: 'session',
      title: 'Marketing Analysis',
      description: 'New session created',
      timestamp: '1 hour ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'query',
      title: 'Customer Segmentation',
      description: 'Show customer distribution by region',
      timestamp: '2 hours ago',
      status: 'success'
    },
    {
      id: '5',
      type: 'upload',
      title: 'inventory_report.xlsx',
      description: 'Uploaded by Jane Smith',
      timestamp: '3 hours ago',
      status: 'success'
    },
    {
      id: '6',
      type: 'user',
      title: 'New User Registration',
      description: 'alex@example.com joined',
      timestamp: '5 hours ago',
      status: 'success'
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real application, you would fetch this data from your API
        // const response = await fetch('/api/dashboard/stats');
        // const data = await response.json();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update with real data when API is available
        // setStats(data.stats);
        // setRecentItems(data.recentItems);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getTypeIcon = (type: RecentItem['type']) => {
    switch (type) {
      case 'query':
        return <MessageSquare className="h-4 w-4" />;
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'session':
        return <Users className="h-4 w-4" />;
      case 'user':
        return <Activity className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: RecentItem['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your RAG Document Q&A system performance and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.color} p-2 rounded-full`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">{stat.description}</p>
                {stat.trend && (
                  <span className="text-xs font-medium text-green-600">
                    {stat.trend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-gray-500">
                        {getTypeIcon(item.type)}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {item.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-gray-600">{item.description}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right text-gray-500">
                    {item.timestamp}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backend API</p>
                  <p className="text-sm text-gray-500">FastAPI Service</p>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-gray-500">PostgreSQL with pgvector</p>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Services</p>
                  <p className="text-sm text-gray-500">OpenAI + Gemini</p>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium">Start New Session</div>
                <div className="text-sm text-gray-500">Create a new chat session</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium">Upload Excel File</div>
                <div className="text-sm text-gray-500">Add new data for analysis</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium">View All Sessions</div>
                <div className="text-sm text-gray-500">Browse conversation history</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```