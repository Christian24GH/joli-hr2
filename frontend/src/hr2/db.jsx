import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
	Calendar, Clock, BookOpen, Award, Users, Target, TrendingUp,
	Briefcase, FileText, BarChart3, CheckCircle, AlertCircle,
	CalendarDays, GraduationCap, UserCheck, Activity, User,
	Wallet, PlayCircle, TrendingDown,
	LayoutDashboard
} from "lucide-react";
import { hr2 } from '@/api/hr2';
import AuthContext from '../context/AuthProvider';

const HR2Dashboard = () => {
	const { auth, loading: authLoading } = useContext(AuthContext);

	// State for all dashboard data
	const [personalData, setPersonalData] = useState(null);
	const [leaveBalance, setLeaveBalance] = useState(0);
	const [pendingRequests, setPendingRequests] = useState(0);
	const [ongoingCourses, setOngoingCourses] = useState(0);
	const [ongoingTrainings, setOngoingTrainings] = useState(0);
	const [recentTimesheet, setRecentTimesheet] = useState([]);
	const [competencyProfile, setCompetencyProfile] = useState([]);
	const [talentAnalytics, setTalentAnalytics] = useState(null);
	const [roleRequirements, setRoleRequirements] = useState([]);
	const [courseHistory, setCourseHistory] = useState([]);
	const [trainingHistory, setTrainingHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Loading state
	if (authLoading || !auth) {
		return (
			<div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-muted-foreground">Loading Human Resource Dashboard...</p>
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

	// Fetch all dashboard data
	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			setError('');

			// Ensure we have a valid user ID for the logged-in employee
			const userId = auth?.id || localStorage.getItem('userId');

			if (!userId) {
				setError('Unable to identify logged-in user. Please log in again.');
				setLoading(false);
				return;
			}

			console.log('Fetching dashboard data for user ID:', userId);
			console.log('Auth object:', auth);

			// Fetch personal data - this is critical for the logged-in employee
			try {
				const employeeResponse = await hr2.employees.getById(userId);
				const employeeData = employeeResponse.data;

				if (!employeeData) {
					throw new Error('No employee data received from API');
				}

				console.log('Employee data received:', employeeData);

				// Always use auth data for the logged-in user
				setPersonalData({
					id: employeeData.id,
					first_name: auth?.name?.split(' ')[0] || 'User',
					last_name: auth?.name?.split(' ').slice(1).join(' ') || '',
					email: auth?.email || employeeData.email || '',
					department: employeeData.department || 'Not Assigned',
					position: employeeData.position || 'Not Assigned',
					phone: employeeData.phone || '',
					profile_photo_url: employeeData.profile_photo_url || '',
				});

				console.log('Employee profile loaded:', employeeData.first_name, employeeData.last_name);
			} catch (err) {
				console.error('Failed to fetch personal data for user ID:', userId, err);
				console.error('Error details:', err.response?.data || err.message);
				setError(`Failed to load your profile information. User ID: ${userId}. Please contact HR to set up your employee record.`);
				// Set fallback data for the logged-in user
				setPersonalData({
					id: userId,
					first_name: auth?.name?.split(' ')[0] || 'User',
					last_name: auth?.name?.split(' ').slice(1).join(' ') || '',
					email: auth?.email || '',
					department: 'Please complete your profile',
					position: 'Contact HR to set up your employee record',
					phone: '',
					profile_photo_url: '',
				});
			}

			// Fetch leave balance and pending requests
			try {
				// TODO: Implement proper leave balance calculation
				// For now using a default value until leave balance API is available
				setLeaveBalance(25); // Default leave balance

				const pendingReqs = await hr2.leaveRequests.getByEmployee(userId, { status: 'Pending' });
				setPendingRequests(pendingReqs.data?.length || 0);
			} catch (err) {
				console.warn('Could not fetch leave/request data:', err);
			}

			// Fetch ongoing courses
			try {
				const enrolledCoursesRes = await hr2.learning.progress.getByUser(userId);
				const data = enrolledCoursesRes.data || [];
				const ongoing = Array.isArray(data) ? data.filter(course =>
					course.status === 'in_progress' || course.status === 'enrolled'
				) : [];
				setOngoingCourses(ongoing.length);
			} catch (err) {
				console.warn('Could not fetch ongoing courses:', err);
			}

			// Fetch ongoing trainings
			try {
				const enrollmentsRes = await hr2.trainingApplications.getByEmployee(userId);
				const data = enrollmentsRes.data || [];
				const ongoing = Array.isArray(data) ? data.filter(training =>
					training.status === 'enrolled' || training.status === 'in_progress'
				) : [];
				setOngoingTrainings(ongoing.length);
			} catch (err) {
				console.warn('Could not fetch ongoing trainings:', err);
			}

			// Fetch recent timesheet
			try {
				const timesheetRes = await hr2.timesheetAdjustments.getByEmployee(userId);
				setRecentTimesheet(timesheetRes.data?.slice(0, 5) || []);
			} catch (err) {
				console.warn('Could not fetch timesheet data:', err);
			}

			// Fetch competency profile
			try {
				// TODO: Use proper competency API when backend endpoint is available
				// For now using mock data
				const mockCompetencies = [
					{ competency_name: 'Leadership', competency_level: 85 },
					{ competency_name: 'Communication', competency_level: 92 },
					{ competency_name: 'Technical Skills', competency_level: 78 },
					{ competency_name: 'Problem Solving', competency_level: 88 },
					{ competency_name: 'Team Management', competency_level: 76 }
				];
				setCompetencyProfile(mockCompetencies);
			} catch (err) {
				console.warn('Could not fetch competency profile:', err);
			}

			// Fetch talent analytics
			try {
				// TODO: Use proper succession analytics API when backend endpoint is available
				// For now using mock data
				const mockTalentAnalytics = {
					readyNow: 3,
					readyIn1to2Years: 5,
					readyIn3PlusYears: 8
				};
				setTalentAnalytics(mockTalentAnalytics);
			} catch (err) {
				console.warn('Could not fetch talent analytics:', err);
			}

			// Fetch role requirements
			try {
				// TODO: Use proper role requirements API when backend endpoint is available
				// For now using mock data
				const mockRoleRequirements = [
					{ role_title: 'Senior Developer', competency_name: 'Technical Skills', min_proficiency: 85 },
					{ role_title: 'Team Lead', competency_name: 'Leadership', min_proficiency: 80 },
					{ role_title: 'Project Manager', competency_name: 'Communication', min_proficiency: 90 },
					{ role_title: 'Senior Analyst', competency_name: 'Problem Solving', min_proficiency: 85 },
					{ role_title: 'Department Head', competency_name: 'Team Management', min_proficiency: 88 }
				];
				setRoleRequirements(mockRoleRequirements);
			} catch (err) {
				console.warn('Could not fetch role requirements:', err);
			}

			// Fetch course history
			try {
				const courseHistoryRes = await hr2.learning.progress.getByUser(userId);
				const data = courseHistoryRes.data || [];
				const completed = Array.isArray(data) ? data.filter(course =>
					course.status === 'completed'
				) : [];
				setCourseHistory(completed.slice(0, 5));
			} catch (err) {
				console.warn('Could not fetch course history:', err);
			}

			// Fetch training history
			try {
				const trainingHistoryRes = await hr2.trainingCompletions.getByEmployee(userId);
				setTrainingHistory(trainingHistoryRes.data?.slice(0, 5) || []);
			} catch (err) {
				console.warn('Could not fetch training history:', err);
			}

		} catch (err) {
			console.error('Error fetching dashboard data:', err);
			setError('Failed to load dashboard data. Please refresh the page.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (auth) {
			fetchDashboardData();
		}
	}, [auth]);

	// Chart data for talent analytics
	const talentChartData = [
		{ month: 'Jan', readyNow: 2, ready1to2Years: 4, ready3PlusYears: 6 },
		{ month: 'Feb', readyNow: 3, ready1to2Years: 4, ready3PlusYears: 5 },
		{ month: 'Mar', readyNow: 2, ready1to2Years: 5, ready3PlusYears: 5 },
		{ month: 'Apr', readyNow: 3, ready1to2Years: 5, ready3PlusYears: 4 },
		{ month: 'May', readyNow: 4, ready1to2Years: 5, ready3PlusYears: 3 },
		{ month: 'Jun', readyNow: 3, ready1to2Years: 5, ready3PlusYears: 4 }
	];

	// Competency distribution pie data (static placeholder)
	const competencyPieData = [
		{ name: 'Mastered', value: 12, color: '#10b981' },
		{ name: 'Developing', value: 8, color: '#f59e42' },
		{ name: 'Needs Improvement', value: 5, color: '#ef4444' }
	];

	if (loading) {
		return (
		  <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
			<div className="text-center">
			  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
			  <p className="mt-4 text-muted-foreground">Loading Human Resource Dashboard...</p>
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
			  <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Human Resource Dashboard</h2>
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
			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
				<div className="container flex h-12 items-center justify-between px-4">
					<div className="flex items-center gap-3">
						<LayoutDashboard className="h-5 w-5 text-primary" />
						<h1 className="text-lg font-semibold">Human Resource Dashboard</h1>
					</div>
				</div>
			</header>

			<div className="container mx-auto px-4 py-6 space-y-6">
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
						{error}
					</div>
				)}

				{/* TOP ROW */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* TOP CENTER - PROFILE */}
					<div className="lg:col-start-2 flex justify-center">
						<Link to="/hr2/personal_data">
							<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer flex w-350">
								<CardHeader className="flex flex-row items-center space-y-0 pb-4 px-6 py-6">
									<div className="flex items-center space-x-4">
										<div className="w-22 h-22 rounded-full bg-primary/10 flex items-center justify-center">
											{loading ? (
												<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
											) : personalData?.profile_photo_url ? (
												<img
													src={personalData.profile_photo_url}
													alt="Profile"
													className="w-18 h-18 rounded-full object-cover"
												/>
											) : (
												<User className="h-10 w-10 text-primary" />
											)}
										</div>
										<div className="text-center">
											<CardTitle className="text-xl font-semibold mb-1">
												{loading ? 'Loading...' : `Welcome, ${personalData?.first_name || 'User'} ${personalData?.last_name || ''}`}
											</CardTitle>
											<p className="text-sm text-muted-foreground">
												{loading ? 'Loading profile...' : `${personalData?.department || 'Department'} - ${personalData?.position || 'Position'}`}
											</p>
										</div>
									</div>
								</CardHeader>
							</Card>
						</Link>
					</div>
				</div>

				{/* TOP MIDDLE ROW */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
					{/* TOP MIDDLE LEFT - QUICK STATS */}
					<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								Quick Stats
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<Link to="/hr2/request_forms" className="block">
									<div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-medium">Leave Balance</span>
											<Wallet className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="text-xl font-bold">{leaveBalance}</div>
										<p className="text-xs text-muted-foreground">Available days</p>
									</div>
								</Link>

								<Link to="/hr2/request_forms" className="block">
									<div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-medium">Pending Requests</span>
											<Clock className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="text-xl font-bold text-orange-600">{pendingRequests}</div>
										<p className="text-xs text-muted-foreground">Awaiting approval</p>
									</div>
								</Link>

								<Link to="/hr2/l_history" className="block">
									<div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-medium">Ongoing Course</span>
											<PlayCircle className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="text-xl font-bold text-blue-600">{ongoingCourses}</div>
										<p className="text-xs text-muted-foreground">In progress</p>
									</div>
								</Link>

								<Link to="/hr2/t_catalog" className="block">
									<div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-medium">Ongoing Training</span>
											<TrendingUp className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="text-xl font-bold text-purple-600">{ongoingTrainings}</div>
										<p className="text-xs text-muted-foreground">Enrolled sessions</p>
									</div>
								</Link>
							</div>
						</CardContent>
					</Card>

					{/* TOP MIDDLE CENTER - RECENT TIMESHEET */}
					<Link to="/hr2/request_forms">
						<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Activity className="h-5 w-5" />
									Recent Timesheet
								</CardTitle>
							</CardHeader>
							<CardContent>
								{recentTimesheet.length > 0 ? (
									<div className="space-y-2">
										{recentTimesheet.slice(0, 5).map((entry, idx) => (
											<div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
												<div>
													<div className="text-sm font-medium">{entry.date}</div>
													<div className="text-xs text-muted-foreground">{entry.description || 'Work hours'}</div>
												</div>
												<div className="text-sm font-medium">{entry.hours}h</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No recent timesheet entries</p>
									</div>
								)}
							</CardContent>
						</Card>
					</Link>

					{/* TOP MIDDLE RIGHT - COMPETENCY PROFILE */}
					<Link to="/hr2/comp_profile">
						<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<UserCheck className="h-5 w-5" />
									Competency Profile
								</CardTitle>
							</CardHeader>
							<CardContent>
								{competencyProfile.length > 0 ? (
									<div className="space-y-3">
										{competencyProfile.slice(0, 5).map((comp, idx) => (
											<div key={idx} className="flex items-center justify-between">
												<div className="flex-1">
													<div className="text-sm font-medium">{comp.competency_name}</div>
													<div className="w-full bg-gray-200 rounded-full h-2 mt-1">
														<div
															className="bg-blue-600 h-2 rounded-full"
															style={{ width: `${comp.competency_level}%` }}
														></div>
													</div>
												</div>
												<div className="text-xs text-muted-foreground ml-2">
													{comp.competency_level}%
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No competency data available</p>
									</div>
								)}
							</CardContent>
						</Card>
					</Link>
				</div>

				{/* BOTTOM CENTER ROW */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
					{/* BOTTOM CENTER LEFT - TALENT ANALYTICS */}
					<Link to="/hr2/talent_analytics">
						<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full min-h-[400px]">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<BarChart3 className="h-5 w-5" />
									Talent Analytics
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col justify-center">
								{talentAnalytics ? (
									<div className="space-y-4">
										<div className="grid grid-cols-3 gap-4 text-center">
											<div>
												<div className="text-2xl font-bold text-green-600">
													{talentAnalytics.readyNow || 0}
												</div>
												<div className="text-xs text-muted-foreground">Ready Now</div>
											</div>
											<div>
												<div className="text-2xl font-bold text-yellow-600">
													{talentAnalytics.readyIn1to2Years || 0}
												</div>
												<div className="text-xs text-muted-foreground">1-2 Years</div>
											</div>
											<div>
												<div className="text-2xl font-bold text-red-600">
													{talentAnalytics.readyIn3PlusYears || 0}
												</div>
												<div className="text-xs text-muted-foreground">3+ Years</div>
											</div>
										</div>
										<div className="h-32 flex items-center justify-center">
											<ResponsiveContainer width="100%" height="100%">
												<RechartsLineChart data={talentChartData}>
													<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
													<XAxis dataKey="month" hide />
													<YAxis hide />
													<Tooltip />
													<Line
														type="monotone"
														dataKey="readyNow"
														stroke="#10b981"
														strokeWidth={2}
														dot={false}
													/>
													<Line
														type="monotone"
														dataKey="ready1to2Years"
														stroke="#f59e42"
														strokeWidth={2}
														dot={false}
													/>
													<Line
														type="monotone"
														dataKey="ready3PlusYears"
														stroke="#ef4444"
														strokeWidth={2}
														dot={false}
													/>
												</RechartsLineChart>
											</ResponsiveContainer>
										</div>
									</div>
								) : (
									<div className="flex items-center justify-center h-32 text-muted-foreground">
										Loading talent analytics...
									</div>
								)}
							</CardContent>
						</Card>
					</Link>

					{/* BOTTOM CENTER RIGHT - COMPETENCY DISTRIBUTION */}
					<Card className="shadow-sm h-full min-h-[400px]">
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Competency Distribution
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col justify-center">
							<div className="h-32 flex items-center justify-center mb-4">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={competencyPieData}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											outerRadius={50}
											label={({ name, value }) => `${name}: ${value}`}
										>
											{competencyPieData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="flex justify-center gap-4 mt-2">
								{competencyPieData.map((item, idx) => (
									<div key={idx} className="flex items-center gap-1 text-xs">
										<div
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: item.color }}
										></div>
										<span>{item.name}</span>
									</div>
								))}
							</div>
							<div className="text-center mt-2">
								<p className="text-xs text-muted-foreground">Static UI Placeholder</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* BOTTOM MIDDLE ROW */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
					{/* BOTTOM MIDDLE LEFT - ROLE REQUIREMENTS */}
					<Link to="/hr2/comp_profile">
						<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Briefcase className="h-5 w-5" />
									Role Requirements
								</CardTitle>
							</CardHeader>
							<CardContent>
								{roleRequirements.length > 0 ? (
									<div className="space-y-2">
										{roleRequirements.slice(0, 5).map((req, idx) => (
											<div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
												<div>
													<div className="text-sm font-medium">{req.role_title}</div>
													<div className="text-xs text-muted-foreground">{req.competency_name}</div>
												</div>
												<div className="text-xs text-muted-foreground">
													Min: {req.min_proficiency}%
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No role requirements available</p>
									</div>
								)}
							</CardContent>
						</Card>
					</Link>

					{/* BOTTOM MIDDLE CENTER - COURSE HISTORY */}
					<Link to="/hr2/l_history">
						<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<BookOpen className="h-5 w-5" />
									Course History
								</CardTitle>
							</CardHeader>
							<CardContent>
								{courseHistory.length > 0 ? (
									<div className="space-y-2">
										{courseHistory.slice(0, 5).map((course, idx) => (
											<div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
												<div>
													<div className="text-sm font-medium">{course.course_title}</div>
													<div className="text-xs text-muted-foreground">
														Completed: {course.completed_date ? new Date(course.completed_date).toLocaleDateString() : 'N/A'}
													</div>
												</div>
												<CheckCircle className="h-4 w-4 text-green-600" />
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No completed courses</p>
									</div>
								)}
							</CardContent>
						</Card>
					</Link>

					{/* BOTTOM MIDDLE RIGHT - TRAINING HISTORY */}
					<Link to="/hr2/t_history">
						<Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Award className="h-5 w-5" />
									Training History
								</CardTitle>
							</CardHeader>
							<CardContent>
								{trainingHistory.length > 0 ? (
									<div className="space-y-2">
										{trainingHistory.slice(0, 5).map((training, idx) => (
											<div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
												<div>
													<div className="text-sm font-medium">{training.program_name}</div>
													<div className="text-xs text-muted-foreground">
														Completed: {training.completed_date ? new Date(training.completed_date).toLocaleDateString() : 'N/A'}
													</div>
												</div>
												<Award className="h-4 w-4 text-purple-600" />
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No completed trainings</p>
									</div>
								)}
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default HR2Dashboard;
