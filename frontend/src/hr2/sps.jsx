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
    Puzzle, Clock, Award, Bookmark
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

    // Mock data for demonstration
    const mockSuccessionData = {
        talentPool: [
            {
                id: 1,
                name: "Sarah Johnson",
                currentRole: "Senior Manager",
                department: "Operations",
                readinessLevel: "Ready Now",
                readinessScore: 95,
                potentialRoles: ["Director of Operations", "VP Operations"],
                leadershipScore: 88,
                performanceRating: "Outstanding",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "Low",
                lastAssessment: "2025-09-10",
                keyStrengths: ["Strategic Thinking", "Team Leadership", "Change Management"],
                developmentAreas: ["Financial Acumen", "Digital Transformation"]
            },
            {
                id: 2,
                name: "Michael Chen",
                currentRole: "Team Lead",
                department: "Technology",
                readinessLevel: "1-2 years",
                readinessScore: 75,
                potentialRoles: ["IT Manager", "Tech Director"],
                leadershipScore: 72,
                performanceRating: "Exceeds Expectations",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "Medium",
                lastAssessment: "2025-09-05",
                keyStrengths: ["Technical Excellence", "Innovation", "Problem Solving"],
                developmentAreas: ["People Management", "Communication"]
            },
            {
                id: 3,
                name: "Emily Rodriguez",
                currentRole: "Assistant Manager",
                department: "Marketing",
                readinessLevel: "3+ years",
                readinessScore: 60,
                potentialRoles: ["Marketing Manager", "Brand Director"],
                leadershipScore: 65,
                performanceRating: "Meets Expectations",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "High",
                lastAssessment: "2025-08-28",
                keyStrengths: ["Creativity", "Market Analysis", "Campaign Management"],
                developmentAreas: ["Leadership Skills", "Strategic Planning", "Team Building"]
            },
            {
                id: 4,
                name: "Sarah Johnson",
                currentRole: "Senior Manager",
                department: "Operations",
                readinessLevel: "Ready Now",
                readinessScore: 95,
                potentialRoles: ["Director of Operations", "VP Operations"],
                leadershipScore: 88,
                performanceRating: "Outstanding",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "Low",
                lastAssessment: "2025-09-10",
                keyStrengths: ["Strategic Thinking", "Team Leadership", "Change Management"],
                developmentAreas: ["Financial Acumen", "Digital Transformation"]
            },
            {
                id: 5,
                name: "Michael Chen",
                currentRole: "Team Lead",
                department: "Technology",
                readinessLevel: "1-2 years",
                readinessScore: 75,
                potentialRoles: ["IT Manager", "Tech Director"],
                leadershipScore: 72,
                performanceRating: "Exceeds Expectations",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "Medium",
                lastAssessment: "2025-09-05",
                keyStrengths: ["Technical Excellence", "Innovation", "Problem Solving"],
                developmentAreas: ["People Management", "Communication"]
            },
            {
                id: 6,
                name: "Emily Rodriguez",
                currentRole: "Assistant Manager",
                department: "Marketing",
                readinessLevel: "3+ years",
                readinessScore: 60,
                potentialRoles: ["Marketing Manager", "Brand Director"],
                leadershipScore: 65,
                performanceRating: "Meets Expectations",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "High",
                lastAssessment: "2025-08-28",
                keyStrengths: ["Creativity", "Market Analysis", "Campaign Management"],
                developmentAreas: ["Leadership Skills", "Strategic Planning", "Team Building"]
            },
            {
                id: 7,
                name: "Sarah Johnson",
                currentRole: "Senior Manager",
                department: "Operations",
                readinessLevel: "Ready Now",
                readinessScore: 95,
                potentialRoles: ["Director of Operations", "VP Operations"],
                leadershipScore: 88,
                performanceRating: "Outstanding",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "Low",
                lastAssessment: "2025-09-10",
                keyStrengths: ["Strategic Thinking", "Team Leadership", "Change Management"],
                developmentAreas: ["Financial Acumen", "Digital Transformation"]
            },
            {
                id: 8,
                name: "Michael Chen",
                currentRole: "Team Lead",
                department: "Technology",
                readinessLevel: "1-2 years",
                readinessScore: 75,
                potentialRoles: ["IT Manager", "Tech Director"],
                leadershipScore: 72,
                performanceRating: "Exceeds Expectations",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                riskLevel: "Medium",
                lastAssessment: "2025-09-05",
                keyStrengths: ["Technical Excellence", "Innovation", "Problem Solving"],
                developmentAreas: ["People Management", "Communication"]
            }
        ],

        leadershipPipeline: [
            {
                id: 1,
                position: "Chief Executive Officer",
                currentHolder: "Robert Wilson",
                level: "C-Suite",
                successors: [
                    { name: "Sarah Johnson", readiness: "Ready Now", probability: 85 },
                    { name: "David Kim", readiness: "1-2 years", probability: 70 }
                ],
                criticalityScore: 100,
                vacancyRisk: "Low"
            },
            {
                id: 2,
                position: "VP of Technology",
                currentHolder: "Jennifer Lee",
                level: "Executive",
                successors: [
                    { name: "Michael Chen", readiness: "1-2 years", probability: 80 },
                    { name: "Alex Thompson", readiness: "2-3 years", probability: 65 }
                ],
                criticalityScore: 90,
                vacancyRisk: "Medium"
            },
            {
                id: 3,
                position: "Director of Marketing",
                currentHolder: "VACANT",
                level: "Director",
                successors: [
                    { name: "Emily Rodriguez", readiness: "3+ years", probability: 60 },
                    { name: "Mark Stevens", readiness: "Ready Now", probability: 75 }
                ],
                criticalityScore: 85,
                vacancyRisk: "High"
            }
        ],

        developmentPlans: [
            {
                id: 1,
                employeeId: 1,
                employeeName: "Sarah Johnson",
                targetRole: "Chief Executive Officer",
                planType: "Executive Leadership Track",
                status: "In Progress",
                startDate: "2025-01-15",
                expectedCompletion: "2025-12-31",
                progress: 65,
                activities: [
                    { type: "Training", title: "Strategic Leadership Program", status: "Completed", dueDate: "2025-03-15" },
                    { type: "Coaching", title: "Executive Coaching Sessions", status: "In Progress", dueDate: "2025-10-01" },
                    { type: "Project", title: "Cross-Functional Initiative Lead", status: "In Progress", dueDate: "2025-11-30" },
                    { type: "Mentorship", title: "CEO Mentorship Program", status: "Scheduled", dueDate: "2025-12-15" }
                ],
                mentor: "Robert Wilson",
                competencyGaps: ["Financial Strategy", "Board Relations"]
            },
            {
                id: 2,
                employeeId: 2,
                employeeName: "Michael Chen",
                targetRole: "VP of Technology",
                planType: "Technical Leadership Track",
                status: "In Progress",
                startDate: "2025-02-01",
                expectedCompletion: "2026-06-30",
                progress: 40,
                activities: [
                    { type: "Training", title: "People Management Certification", status: "In Progress", dueDate: "2025-11-01" },
                    { type: "Project", title: "Department Restructuring Lead", status: "Scheduled", dueDate: "2025-12-31" },
                    { type: "Mentorship", title: "CTO Shadowing Program", status: "In Progress", dueDate: "2026-03-01" }
                ],
                mentor: "Jennifer Lee",
                competencyGaps: ["Team Leadership", "Budget Management"]
            }
        ],

        analytics: {
            totalTalentPool: 12,
            readyNow: 3,
            readyIn1to2Years: 5,
            readyIn3PlusYears: 4,
            criticalRolesCovered: 75,
            averageReadinessScore: 73,
            highRiskPositions: 2,
            turnoverRisk: {
                low: 8,
                medium: 3,
                high: 1
            }
        }
    };

    // Chart data for analytics trends
    const chartData = [
        { month: 'Jan', readyNow: 2, ready1to2Years: 4, ready3PlusYears: 6, coverage: 65 },
        { month: 'Feb', readyNow: 3, ready1to2Years: 4, ready3PlusYears: 5, coverage: 68 },
        { month: 'Mar', readyNow: 2, ready1to2Years: 5, ready3PlusYears: 5, coverage: 70 },
        { month: 'Apr', readyNow: 3, ready1to2Years: 5, ready3PlusYears: 4, coverage: 72 },
        { month: 'May', readyNow: 4, ready1to2Years: 5, ready3PlusYears: 3, coverage: 74 },
        { month: 'Jun', readyNow: 3, ready1to2Years: 5, ready3PlusYears: 4, coverage: 75 }
    ];

    // Initialize with mock data
    useEffect(() => {
        setTalentPool(mockSuccessionData.talentPool);
        setLeadershipPipeline(mockSuccessionData.leadershipPipeline);
        setDevelopmentPlans(mockSuccessionData.developmentPlans);
        setAnalytics(mockSuccessionData.analytics);
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

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Compact Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Presentation className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Succession Planning</h1>
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

                    {/* Analytics */}
                    <Card>
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <LineChart className="w-5 h-5 text-blue-600" />
                                    Analytics
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