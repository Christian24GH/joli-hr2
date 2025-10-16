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
    Sparkle
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
                    <p className="mt-4 text-muted-foreground">Loading Leadership Development...</p>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Leadership Development</h2>
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
                        <Sparkle className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Succession Planning</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Main Content Grid */}
                <div className="space-y-6">
                    {/* Top Row - Two Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Leadership Pipeline */}
                        <Card>
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Crown className="w-5 h-5 text-yellow-600" />
                                        Leadership Pipeline
                                    </h2>
                                    {isHR2Admin() && (
                                        <Button onClick={() => setShowSuccessorDialog(true)} variant="default" size="sm" className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add Successor
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="space-y-4 h-80 overflow-y-auto">
                                    {leadershipPipeline.map(position => (
                                        <div key={position.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg">
                                                    <Award className="w-4 h-4 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm">{position.position}</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        Current: {position.currentHolder}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-blue-600">{position.criticalityScore}%</div>
                                                <Badge variant="outline" className="text-xs">
                                                    {position.vacancyRisk}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Competency Insights */}
                        <Card>
                            <div className="p-4 border-b">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-600" />
                                    Competency Insights
                                </h2>
                            </div>
                            <CardContent className="p-4">
                                <div className="space-y-3 h-80 overflow-y-auto">
                                    {talentPool.slice(0, 6).map(talent => (
                                        <div key={talent.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={talent.profilePhoto} alt={talent.name} />
                                                    <AvatarFallback className="text-xs">
                                                        {talent.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-medium text-sm">{talent.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{talent.currentRole}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{talent.leadershipScore}%</div>
                                                    <Progress value={talent.leadershipScore} className="w-16 h-2" />
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {talent.performanceRating}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Row - Development Plans Full Width */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Development Plans */}
                        <Card>
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Puzzle className="w-5 h-5 text-green-600" />
                                        Development Plans
                                    </h2>
                                    {isHR2Admin() && (
                                        <Button onClick={() => setShowCreatePlan(true)} variant="default" size="sm" className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Create Plan
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="space-y-4 h-80 overflow-y-auto">
                                    {developmentPlans.map(plan => (
                                        <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg">
                                                    <Bookmark className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm">{plan.employeeName}</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        Target: {plan.targetRole}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="mb-1 text-xs">
                                                    {plan.status}
                                                </Badge>
                                                <div className="text-sm font-medium text-green-600">{plan.progress}%</div>
                                                <Progress value={plan.progress} className="w-16 h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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