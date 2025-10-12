import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
    User, Users, Target, TrendingUp, BookOpen, Award, 
    Star, Plus, Edit, Search, Filter, BarChart3, Trophy,
    CheckCircle, AlertCircle, Clock, Brain, GraduationCap,
    Lightbulb, Eye, Download, Upload, UserCheck, Briefcase
} from 'lucide-react';
import { hr2 } from '@/api/hr2';
import AuthContext from '../context/AuthProvider';

function CompetencyManagementSystem() {
    const { auth, loading: authLoading } = useContext(AuthContext);
    
    // Loading state
    if (authLoading || !auth) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Competency Management System...</p>
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
    const [activeTab, setActiveTab] = useState('profile');

    // Employee competency data
    const [employees, setEmployees] = useState([]);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [competencyProfiles, setCompetencyProfiles] = useState([]);
    
    // Role-based requirements
    const [jobRoles, setJobRoles] = useState([]);
    const [roleRequirements, setRoleRequirements] = useState([]);
    
    // Assessment data
    const [assessments, setAssessments] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    // Dialog states
    const [showAddSkill, setShowAddSkill] = useState(false);
    const [showAddRole, setShowAddRole] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);

    // Mock data for demonstration
    const mockCompetencyData = {
        employees: [
            {
                id: 1,
                name: "John Doe",
                department: "IT",
                position: "Senior Developer",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                competencies: [
                    { skill: "JavaScript", level: "Advanced", proficiency: 90, lastAssessed: "2025-09-15" },
                    { skill: "React", level: "Advanced", proficiency: 85, lastAssessed: "2025-09-10" },
                    { skill: "Node.js", level: "Intermediate", proficiency: 70, lastAssessed: "2025-09-05" },
                    { skill: "Leadership", level: "Beginner", proficiency: 40, lastAssessed: "2025-08-20" }
                ],
                awards: [
                    { title: "Employee of the Month", date: "2025-08-01", type: "Recognition" }
                ]
            },
            {
                id: 2,
                name: "Jane Smith",
                department: "Marketing",
                position: "Marketing Manager",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                competencies: [
                    { skill: "Digital Marketing", level: "Advanced", proficiency: 88, lastAssessed: "2025-09-12" },
                    { skill: "Project Management", level: "Advanced", proficiency: 82, lastAssessed: "2025-09-10" },
                    { skill: "Communication", level: "Advanced", proficiency: 95, lastAssessed: "2025-09-08" },
                    { skill: "Data Analysis", level: "Intermediate", proficiency: 65, lastAssessed: "2025-09-05" }
                ],
                awards: [
                    { title: "Best Campaign Award", date: "2025-08-20", type: "Achievement" }
                ]
            },
            {
                id: 1,
                name: "John Doe",
                department: "IT",
                position: "Senior Developer",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                competencies: [
                    { skill: "JavaScript", level: "Advanced", proficiency: 90, lastAssessed: "2025-09-15" },
                    { skill: "React", level: "Advanced", proficiency: 85, lastAssessed: "2025-09-10" },
                    { skill: "Node.js", level: "Intermediate", proficiency: 70, lastAssessed: "2025-09-05" },
                    { skill: "Leadership", level: "Beginner", proficiency: 40, lastAssessed: "2025-08-20" }
                ],
                awards: [
                    { title: "Employee of the Month", date: "2025-08-01", type: "Recognition" }
                ]
            },
            {
                id: 2,
                name: "Jane Smith",
                department: "Marketing",
                position: "Marketing Manager",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                competencies: [
                    { skill: "Digital Marketing", level: "Advanced", proficiency: 88, lastAssessed: "2025-09-12" },
                    { skill: "Project Management", level: "Advanced", proficiency: 82, lastAssessed: "2025-09-10" },
                    { skill: "Communication", level: "Advanced", proficiency: 95, lastAssessed: "2025-09-08" },
                    { skill: "Data Analysis", level: "Intermediate", proficiency: 65, lastAssessed: "2025-09-05" }
                ],
                awards: [
                    { title: "Best Campaign Award", date: "2025-08-20", type: "Achievement" }
                ]
            },
            {
                id: 2,
                name: "Jane Smith",
                department: "Marketing",
                position: "Marketing Manager",
                profilePhoto: "https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000",
                competencies: [
                    { skill: "Digital Marketing", level: "Advanced", proficiency: 88, lastAssessed: "2025-09-12" },
                    { skill: "Project Management", level: "Advanced", proficiency: 82, lastAssessed: "2025-09-10" },
                    { skill: "Communication", level: "Advanced", proficiency: 95, lastAssessed: "2025-09-08" },
                    { skill: "Data Analysis", level: "Intermediate", proficiency: 65, lastAssessed: "2025-09-05" }
                ],
                awards: [
                    { title: "Best Campaign Award", date: "2025-08-20", type: "Achievement" }
                ]
            }
        ],
        
        jobRoles: [
            {
                id: 1,
                title: "Senior Developer",
                department: "IT",
                requiredSkills: [
                    { skill: "JavaScript", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "React", requiredLevel: "Advanced", minProficiency: 75 }
                ]
            },
            {
                id: 2,
                title: "Marketing Manager",
                department: "Marketing", 
                requiredSkills: [
                    { skill: "Digital Marketing", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "Project Management", requiredLevel: "Advanced", minProficiency: 75 },
                    { skill: "Communication", requiredLevel: "Advanced", minProficiency: 85 },
                    { skill: "Data Analysis", requiredLevel: "Intermediate", minProficiency: 65 }
                ]
            },
            {
                id: 1,
                title: "Senior Developer",
                department: "IT",
                requiredSkills: [
                    { skill: "JavaScript", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "React", requiredLevel: "Advanced", minProficiency: 75 }
                ]
            },
            {
                id: 1,
                title: "Senior Developer",
                department: "IT",
                requiredSkills: [
                    { skill: "JavaScript", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "React", requiredLevel: "Advanced", minProficiency: 75 }
                ]
            },
            {
                id: 1,
                title: "Senior Developer",
                department: "IT",
                requiredSkills: [
                    { skill: "JavaScript", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "React", requiredLevel: "Advanced", minProficiency: 75 },
                    { skill: "JavaScript", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "React", requiredLevel: "Advanced", minProficiency: 75 },
                    { skill: "JavaScript", requiredLevel: "Advanced", minProficiency: 80 },
                    { skill: "React", requiredLevel: "Advanced", minProficiency: 75 },
                ]
            }
        ],

        assessments: [
            {
                id: 1,
                employeeId: 1,
                employeeName: "John Doe",
                assessmentType: "Manager Evaluation",
                assessor: "Sarah Johnson",
                date: "2025-09-15",
                status: "Completed",
                scores: [
                    { skill: "JavaScript", score: 90, feedback: "Excellent technical skills" },
                    { skill: "Leadership", score: 40, feedback: "Needs improvement in team management" }
                ]
            },
            {
                id: 2,
                employeeId: 1,
                employeeName: "John Doe",
                assessmentType: "Self Assessment",
                assessor: "Self",
                date: "2025-09-10",
                status: "Completed",
                scores: [
                    { skill: "React", score: 85, feedback: "Confident with most React concepts" },
                    { skill: "Node.js", score: 70, feedback: "Good understanding, need more practice" }
                ]
            },
            {
                id: 1,
                employeeId: 1,
                employeeName: "John Doe",
                assessmentType: "Manager Evaluation",
                assessor: "Sarah Johnson",
                date: "2025-09-15",
                status: "Completed",
                scores: [
                    { skill: "JavaScript", score: 90, feedback: "Excellent technical skills" },
                    { skill: "Leadership", score: 40, feedback: "Needs improvement in team management" }
                ]
            },
            {
                id: 2,
                employeeId: 1,
                employeeName: "John Doe",
                assessmentType: "Self Assessment",
                assessor: "Self",
                date: "2025-09-10",
                status: "Completed",
                scores: [
                    { skill: "React", score: 85, feedback: "Confident with most React concepts" },
                    { skill: "Node.js", score: 70, feedback: "Good understanding, need more practice" }
                ]
            },
            {
                id: 1,
                employeeId: 1,
                employeeName: "John Doe",
                assessmentType: "Manager Evaluation",
                assessor: "Sarah Johnson",
                date: "2025-09-15",
                status: "Completed",
                scores: [
                    { skill: "JavaScript", score: 90, feedback: "Excellent technical skills" },
                    { skill: "Leadership", score: 40, feedback: "Needs improvement in team management" }
                ]
            },
            {
                id: 1,
                employeeId: 1,
                employeeName: "John Doe",
                assessmentType: "Manager Evaluation",
                assessor: "Sarah Johnson",
                date: "2025-09-15",
                status: "Completed",
                scores: [
                    { skill: "JavaScript", score: 90, feedback: "Excellent technical skills" },
                    { skill: "Leadership", score: 40, feedback: "Needs improvement in team management" }
                ]
            }
        ],

        recommendations: [
            {
                id: 1,
                employeeId: 1,
                type: "Training",
                title: "Leadership Development Program",
                description: "Recommended to improve leadership skills",
                priority: "High",
                estimatedDuration: "3 months",
                provider: "Internal Training"
            },
            {
                id: 2,
                employeeId: 1,
                type: "Role",
                title: "Team Lead Position",
                description: "Suitable for promotion after completing leadership training",
                priority: "Medium",
                estimatedDuration: "6 months",
                provider: "Internal Promotion"
            },
            {
                id: 1,
                employeeId: 1,
                type: "Training",
                title: "Leadership Development Program",
                description: "Recommended to improve leadership skills",
                priority: "High",
                estimatedDuration: "3 months",
                provider: "Internal Training"
            },
            {
                id: 2,
                employeeId: 1,
                type: "Role",
                title: "Team Lead Position",
                description: "Suitable for promotion after completing leadership training",
                priority: "Medium",
                estimatedDuration: "6 months",
                provider: "Internal Promotion"
            }
        ]
    };

    // Initialize with mock data
    useEffect(() => {
        setEmployees(mockCompetencyData.employees);
        setJobRoles(mockCompetencyData.jobRoles);
        setAssessments(mockCompetencyData.assessments);
        setRecommendations(mockCompetencyData.recommendations);
        
        // Set current employee for employees
        if (isEmployee() && mockCompetencyData.employees.length > 0) {
            setCurrentEmployee(mockCompetencyData.employees[0]);
        }
    }, [auth]);

    // Helper functions
    const getProficiencyColor = (level) => {
        switch (level) {
            case 'Beginner': return 'bg-red-100 text-red-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getProficiencyScore = (proficiency) => {
        if (proficiency >= 80) return { color: 'text-green-600', level: 'Advanced' };
        if (proficiency >= 60) return { color: 'text-yellow-600', level: 'Intermediate' };
        return { color: 'text-red-600', level: 'Beginner' };
    };

    const calculateGapAnalysis = (employee, jobRole) => {
        if (!employee || !jobRole) return [];
        
        return jobRole.requiredSkills.map(required => {
            const current = employee.competencies.find(comp => comp.skill === required.skill);
            const gap = current ? Math.max(0, required.minProficiency - current.proficiency) : required.minProficiency;
            
            return {
                skill: required.skill,
                required: required.minProficiency,
                current: current?.proficiency || 0,
                gap: gap,
                status: gap === 0 ? 'Met' : gap <= 20 ? 'Close' : 'Gap'
            };
        });
    };

    // Filtered data
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Compact Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-12 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Competency Management</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Compact Stats Dashboard */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Employees</p>
                                <p className="text-2xl font-bold">{employees.length}</p>
                            </div>
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Job Roles</p>
                                <p className="text-2xl font-bold">{jobRoles.length}</p>
                            </div>
                            <Target className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Assessments</p>
                                <p className="text-2xl font-bold">{assessments.length}</p>
                            </div>
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg Proficiency</p>
                                <p className="text-2xl font-bold">85%</p>
                            </div>
                            <Trophy className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Card>
                </section>



                {/* Employee Competency Profiles */}
                <section className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Employee Profiles
                            </CardTitle>
                            {/* Search and Filter */}
                            <div className="flex items-center justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Search employees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter className="w-4 h-4" />
                                        Filter
                                    </Button>
                                    {isHR2Admin() && (
                                        <Button onClick={() => setShowAddSkill(true)} variant="default" size="sm" className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add Skill
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-80 overflow-y-auto">
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {filteredEmployees.map(employee => (
                                    <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={employee.profilePhoto}
                                                alt={employee.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <h3 className="font-medium text-sm">{employee.name}</h3>
                                                <p className="text-xs text-muted-foreground">{employee.position}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                {employee.competencies.slice(0, 2).map((comp, index) => (
                                                    <div key={index} className="text-center">
                                                        <span className="text-xs text-muted-foreground">{comp.skill}</span>
                                                        <div className="text-sm font-medium">{comp.proficiency}%</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                                            <Button variant="outline" size="sm">
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Role Requirements */}
                <section className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-green-600" />
                                    Role Requirements
                                </div>
                                {isHR2Admin() && (
                                    <Button onClick={() => setShowAddRole(true)} variant="default" size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Define Role
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {jobRoles.map(role => (
                                    <Card key={role.id} className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-green-600" />
                                                <h3 className="font-semibold text-sm">{role.title}</h3>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{role.department}</Badge>
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {/* Required Skills */}
                                            <div>
                                                <h4 className="font-medium mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <CheckCircle className="w-3 h-3 text-blue-600" />
                                                    Skills ({role.requiredSkills.length})
                                                </h4>
                                                <div className="space-y-1">
                                                    {role.requiredSkills.map((skill, index) => (
                                                        <div key={index} className="p-1.5 bg-gray-50 rounded">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <span className="font-medium text-xs">{skill.skill}</span>
                                                                <Badge className={`${getProficiencyColor(skill.requiredLevel)} text-xs px-1 py-0`}>
                                                                    {skill.requiredLevel}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mb-0.5">
                                                                Min: {skill.minProficiency}%
                                                            </div>
                                                            <Progress value={skill.minProficiency} className="h-1" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Gap Analysis for Current Employee */}
                                            {currentEmployee && (
                                                <div>
                                                    <h4 className="font-medium mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <BarChart3 className="w-3 h-3 text-purple-600" />
                                                        Gap Analysis
                                                    </h4>
                                                    <div className="space-y-0.5">
                                                        {calculateGapAnalysis(currentEmployee, role).map((gap, index) => (
                                                            <div key={index} className="flex items-center justify-between p-1.5 bg-white rounded border text-xs">
                                                                <span className="font-medium text-xs">{gap.skill}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {gap.current}%/{gap.required}%
                                                                    </span>
                                                                    <Badge
                                                                        variant={gap.status === 'Met' ? 'default' : 'destructive'}
                                                                        className="text-xs px-1 py-0"
                                                                    >
                                                                        {gap.status === 'Met' ? '✓' : `-${gap.gap}%`}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isHR2Admin() && (
                                            <div className="flex gap-1 pt-2 border-t mt-2">
                                                <Button variant="outline" size="sm" className="flex-1 text-xs gap-1">
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Assessment Results and Development Recommendations - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assessment Results */}
                    <section className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                        Assessment Results
                                    </div>
                                    {/* Assessment Results from Learning Management Data on that specific Employee who logged in */}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-80 overflow-y-auto">
                                <div className="space-y-4">
                                    {assessments.map(assessment => (
                                        <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <BarChart3 className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm">{assessment.employeeName}</h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {assessment.assessmentType} • {assessment.assessor}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-xs mb-1">
                                                    {assessment.status}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(assessment.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Development Recommendations */}
                    <section className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-orange-600" />
                                        Development Recommendations
                                    </div>
                                    <Button variant="default" size="sm" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Export Report
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-80 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-3">
                                    {recommendations.map(rec => (
                                        <div key={rec.id} className="border rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                                        {rec.type === 'Training' ? (
                                                            <GraduationCap className="w-4 h-4 text-blue-600" />
                                                        ) : (
                                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                                        )}
                                                        {rec.title}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                                                </div>
                                                <Badge variant="outline" className="text-xs ml-2">
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground">Duration:</span>
                                                    <p className="font-medium">{rec.estimatedDuration}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Provider:</span>
                                                    <p className="font-medium">{rec.provider}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 text-xs">
                                                    Accept
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-xs">
                                                    Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Add Skill Dialog */}
                <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Skill Assessment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Employee</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Skill</Label>
                                <Input placeholder="Enter skill name" />
                            </div>
                            <div>
                                <Label>Proficiency Level</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Proficiency Score (%)</Label>
                                <Input type="number" min="0" max="100" placeholder="0-100" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddSkill(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowAddSkill(false)}>
                                Add Skill
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Role Dialog */}
                <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add Job Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Role Title</Label>
                                <Input placeholder="Enter role title" />
                            </div>
                            <div>
                                <Label>Department</Label>
                                <Input placeholder="Enter department" />
                            </div>
                            <div>
                                <Label>Required Skills</Label>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Add skills and their required proficiency levels
                                </p>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <Plus className="w-3 h-3" />
                                    Add Skill Requirement
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddRole(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowAddRole(false)}>
                                Create Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* New Assessment Dialog */}
                <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>New Assessment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Employee</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Assessment Type</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manager">Manager Evaluation</SelectItem>
                                        <SelectItem value="peer">Peer Review</SelectItem>
                                        <SelectItem value="self">Self Assessment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Assessment Date</Label>
                                <Input type="date" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssessment(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowAssessment(false)}>
                                Create Assessment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default CompetencyManagementSystem;