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

function AssessmentDevelopment() {
    const { auth, loading: authLoading } = useContext(AuthContext);

    // Loading state
    if (authLoading || !auth) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Assessment & Development...</p>
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

    // Assessment data
    const [assessments, setAssessments] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    // Dialog states
    const [showAssessment, setShowAssessment] = useState(false);

    // Initialize data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch assessments
                const assessmentsResponse = await hr2.assessment.getAll();
                const assessmentsData = assessmentsResponse.data || [];

                // Transform assessments to match display format
                const transformedAssessments = assessmentsData.map(assessment => ({
                    id: assessment.id,
                    employeeName: assessment.title?.split(' - ')[1] || 'Unknown', // Extract from title
                    assessmentType: assessment.title?.split(' - ')[0] || 'Assessment',
                    assessor: assessment.title?.includes('Self') ? 'Self' : 'Manager',
                    date: assessment.completion_date || assessment.created_at,
                    status: assessment.status
                }));
                setAssessments(transformedAssessments);

                // Fetch recommendations (using training management)
                const recommendationsResponse = await hr2.training.getAll();
                const recommendationsData = recommendationsResponse.data || [];

                // Transform recommendations to match display format
                const transformedRecommendations = recommendationsData.map(rec => ({
                    id: rec.id,
                    type: rec.program_name?.includes('Training') ? 'Training' : 'Role',
                    title: rec.program_name,
                    description: `Recommended for ${rec.target_skills}`,
                    priority: rec.status === 'Recommended' ? 'High' : 'Medium',
                    estimatedDuration: rec.duration,
                    provider: rec.provider
                }));
                setRecommendations(transformedRecommendations);
            } catch (error) {
                console.error('Error fetching assessment data:', error);
                setError('Failed to load assessment data');
            } finally {
                setLoading(false);
            }
        };

        if (auth) {
            fetchData();
        }
    }, [auth]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading Assessment & Development...</p>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Assessment & Development</h2>
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
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-semibold">Assessment & Development</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Assessment Results and Development Recommendations - Stacked */}
                <div className="grid grid-cols-1 gap-6">
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
                                        {/* Would need employees data, but since separate component, maybe remove or add mock */}
                                        <SelectItem value="1">John Doe</SelectItem>
                                        <SelectItem value="2">Jane Smith</SelectItem>
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

export default AssessmentDevelopment;