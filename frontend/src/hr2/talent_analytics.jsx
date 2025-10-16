import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Users, Crown, Plus, Search, Calendar,
    CheckCircle, Brain, LineChart, Shield,
    Download, CircleStar, Presentation,
    Puzzle, Clock, Award, Bookmark,
    ChartBarBig
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { hr2 } from '@/api/hr2';
import AuthContext from '../context/AuthProvider';

function SuccessionPlanningSystem() {
    const { auth, loading: authLoading } = useContext(AuthContext);

    // Loading state
    if (authLoading || !auth) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Succession Planning System...</p>
                </div>
            </div>
        );
    }

    // Role-based access
    const isHR2Admin = () => auth?.role === 'HR2 Admin' || auth?.role === 'hr2_admin' || auth?.user_type === 'HR2 Admin';
    const isEmployee = () => auth?.role === 'Employee';

    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('talent-pool');

    // Succession planning data
    const [talentPool, setTalentPool] = useState([]);
    const [leadershipPipeline, setLeadershipPipeline] = useState([]);
    const [developmentPlans, setDevelopmentPlans] = useState([]);
    const [analytics, setAnalytics] = useState({});

    // Dialog states
    const [showAddTalent, setShowAddTalent] = useState(false);
    const [showCreatePlan, setShowCreatePlan] = useState(false);
    const [showSuccessorDialog, setShowSuccessorDialog] = useState(false);

    // Chart data for analytics trends (mock data for now - can be replaced with API data later)
    const chartData = [
        { month: 'Jan', readyNow: 2, ready1to2Years: 4, ready3PlusYears: 6, coverage: 65 },
        { month: 'Feb', readyNow: 3, ready1to2Years: 4, ready3PlusYears: 5, coverage: 68 },
        { month: 'Mar', readyNow: 2, ready1to2Years: 5, ready3PlusYears: 5, coverage: 70 },
        { month: 'Apr', readyNow: 3, ready1to2Years: 5, ready3PlusYears: 4, coverage: 72 },
        { month: 'May', readyNow: 4, ready1to2Years: 5, ready3PlusYears: 3, coverage: 74 },
        { month: 'Jun', readyNow: 3, ready1to2Years: 5, ready3PlusYears: 4, coverage: 75 }
    ];

    // Fetch succession planning data
    const fetchSuccessionData = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch talent pool data
            const talentResponse = await hr2.succession.talentPool.getAll();
            setTalentPool(talentResponse.data || []);

            // Fetch leadership pipeline data
            const pipelineResponse = await hr2.succession.leadershipPipeline.getAll();
            setLeadershipPipeline(pipelineResponse.data || []);

            // Fetch development plans data
            const plansResponse = await hr2.succession.developmentPlans.getAll();
            setDevelopmentPlans(plansResponse.data || []);

            // Fetch analytics data
            const analyticsResponse = await hr2.succession.analytics.getOverview();
            setAnalytics(analyticsResponse.data || {});

        } catch (err) {
            console.error('Error fetching succession data:', err);
            setError('Failed to load succession planning data. Please try again.');
            toast.error('Failed to load succession planning data');
        } finally {
            setLoading(false);
        }
    };

    // Initialize data on component mount
    useEffect(() => {
        if (auth) {
            fetchSuccessionData();
        }
    }, [auth]);

    // Helper functions
    const getReadinessColor = (level) => {
        switch (level) {
            case 'Ready Now': return 'bg-green-100 text-green-800';
            case '1-2 years': return 'bg-yellow-100 text-yellow-800';
            case '3+ years': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'Low': return 'text-green-600';
            case 'Medium': return 'text-yellow-600';
            case 'High': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getPerformanceColor = (rating) => {
        switch (rating) {
            case 'Outstanding': return 'bg-green-100 text-green-800';
            case 'Exceeds Expectations': return 'bg-blue-100 text-blue-800';
            case 'Meets Expectations': return 'bg-gray-100 text-gray-800';
            case 'Below Expectations': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Filtered data
    const filteredTalentPool = talentPool.filter(talent =>
        talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.currentRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Talent Analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Talent Analytics</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Compact Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <ChartBarBig className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Talent Analytics</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Compact Stats Dashboard */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Talent Pool</p>
                                <p className="text-2xl font-bold">{analytics.totalTalentPool || 0}</p>
                            </div>
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Ready Now</p>
                                <p className="text-2xl font-bold">{analytics.readyNow || 0}</p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">1-2 Years</p>
                                <p className="text-2xl font-bold">{analytics.readyIn1to2Years || 0}</p>
                            </div>
                            <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">3+ Years</p>
                                <p className="text-2xl font-bold">{analytics.readyIn3PlusYears || 0}</p>
                            </div>
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                                <p className="text-2xl font-bold">{analytics.criticalRolesCovered || 0}%</p>
                            </div>
                            <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>
                </section>



                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Talent Pool - Full Width */}
                    <Card className="lg:col-span-2">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <CircleStar className="w-5 h-5 text-yellow-600" />
                                    Talent Pool
                                </h2>
                                {isHR2Admin() && (
                                    <Button onClick={() => setShowAddTalent(true)} variant="default" size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Talent
                                    </Button>
                                )}
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search talent..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                                    <SelectTrigger className="w-36">
                                        <SelectValue placeholder="Filter by readiness" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="ready-now">Ready Now</SelectItem>
                                        <SelectItem value="1-2-years">1-2 Years</SelectItem>
                                        <SelectItem value="3-plus-years">3+ Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-96 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredTalentPool.map(talent => (
                                    <Card key={talent.id} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="w-12 h-12">
                                                <AvatarImage src={talent.profilePhoto} alt={talent.name} />
                                                <AvatarFallback>
                                                    {talent.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-sm truncate">{talent.name}</h3>
                                                        <p className="text-xs text-muted-foreground truncate">{talent.currentRole}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {talent.readinessLevel}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">Readiness</span>
                                                        <span className="text-sm font-medium">{talent.readinessScore}%</span>
                                                    </div>
                                                    <Progress value={talent.readinessScore} className="h-2" />
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">Leadership</span>
                                                        <span className="text-sm font-medium">{talent.leadershipScore}%</span>
                                                    </div>
                                                    <Progress value={talent.leadershipScore} className="h-2" />
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                                                        View
                                                    </Button>
                                                    {isHR2Admin() && (
                                                        <Button variant="outline" size="sm" className="text-xs">
                                                            Edit
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Analytics */}
                    <Card className="lg:col-span-2">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <LineChart className="w-5 h-5 text-blue-600" />
                                    Talent Analytics
                                </h2>
                                <Button variant="default" size="sm" className="gap-2">
                                    <Download className="w-4 h-4" />
                                    Export Report
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsLineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="readyNow"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Ready Now"
                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ready1to2Years"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            name="1-2 Years"
                                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="ready3PlusYears"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            name="3+ Years"
                                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="coverage"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            name="Role Coverage %"
                                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                                        />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{analytics.readyNow || 0}</div>
                                    <p className="text-xs text-muted-foreground">Ready Now</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{analytics.criticalRolesCovered || 0}%</div>
                                    <p className="text-xs text-muted-foreground">Coverage</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Add Talent Dialog */}
                <Dialog open={showAddTalent} onOpenChange={setShowAddTalent}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add to Talent Pool</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Employee</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">John Smith</SelectItem>
                                        <SelectItem value="2">Jane Doe</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Readiness Level</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select readiness" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ready-now">Ready Now</SelectItem>
                                        <SelectItem value="1-2-years">1-2 Years</SelectItem>
                                        <SelectItem value="3-plus-years">3+ Years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Target Role</Label>
                                <Input placeholder="Enter target role" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddTalent(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowAddTalent(false)}>
                                Add to Pool
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Development Plan Dialog */}
                <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Development Plan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Employee</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {talentPool.map(talent => (
                                            <SelectItem key={talent.id} value={talent.id.toString()}>
                                                {talent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Target Role</Label>
                                <Input placeholder="Enter target role" />
                            </div>
                            <div>
                                <Label>Plan Type</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select plan type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="executive">Executive Leadership Track</SelectItem>
                                        <SelectItem value="technical">Technical Leadership Track</SelectItem>
                                        <SelectItem value="functional">Functional Leadership Track</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Mentor</Label>
                                <Input placeholder="Assign mentor" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreatePlan(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowCreatePlan(false)}>
                                Create Plan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Successor Dialog */}
                <Dialog open={showSuccessorDialog} onOpenChange={setShowSuccessorDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Successor</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Position</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leadershipPipeline.map(position => (
                                            <SelectItem key={position.id} value={position.id.toString()}>
                                                {position.position}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Successor</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select successor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {talentPool.map(talent => (
                                            <SelectItem key={talent.id} value={talent.id.toString()}>
                                                {talent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Success Probability (%)</Label>
                                <Input type="number" min="0" max="100" placeholder="0-100" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSuccessorDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowSuccessorDialog(false)}>
                                Add Successor
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default SuccessionPlanningSystem;