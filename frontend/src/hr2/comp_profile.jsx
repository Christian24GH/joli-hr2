import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

function CompetencyManagement() {
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

    // Dialog states
    const [showAddSkill, setShowAddSkill] = useState(false);
    const [showAddRole, setShowAddRole] = useState(false);

    // Initialize data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch employees
                const employeesResponse = await hr2.employees.getAll();
                const employeesData = employeesResponse.data || [];

                // Fetch competencies
                const competenciesResponse = await hr2.competency.getAll();
                const competenciesData = competenciesResponse.data || [];

                // Merge competencies with employees
                const employeesWithCompetencies = employeesData.map(employee => ({
                    ...employee,
                    name: `${employee.first_name} ${employee.last_name}`,
                    position: employee.position || 'Not specified',
                    department: employee.department || 'Not specified',
                    profilePhoto: employee.profile_photo_url || 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                    competencies: competenciesData
                        .filter(comp => comp.employee_id === employee.id)
                        .map(comp => ({
                            skill: comp.competency_name,
                            level: comp.competency_level >= 80 ? 'Advanced' : comp.competency_level >= 60 ? 'Intermediate' : 'Beginner',
                            proficiency: comp.competency_level,
                            lastAssessed: comp.last_assessed_date || new Date().toISOString().split('T')[0]
                        }))
                }));

                setEmployees(employeesWithCompetencies);

                // Set static job roles for now (can be moved to database later)
                const jobRolesData = [
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
                    }
                ];
                setJobRoles(jobRolesData);

                // Set current employee for employees
                if (isEmployee() && employeesWithCompetencies.length > 0) {
                    setCurrentEmployee(employeesWithCompetencies[0]);
                }
            } catch (error) {
                console.error('Error fetching competency data:', error);
                setError('Failed to load competency data');
            } finally {
                setLoading(false);
            }
        };

        if (auth) {
            fetchData();
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Competency Profile...</p>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Competency Profile</h2>
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
                        <Brain className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Competency Profile</h1>
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
                                <p className="text-2xl font-bold">0</p>
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
            </div>

            <ToastContainer position="bottom-right" />
        </div>
    );
}

export default CompetencyManagement;