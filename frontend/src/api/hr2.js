import axios from 'axios';
import { AUTH_API as authApi } from './axios.js';
const hr2Base = import.meta.env.VITE_HR2_BACKEND;
export const hr2Api = axios.create({
  baseURL: `${hr2Base}/api/hr2`,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add authentication interceptor
const TOKEN_KEY = "auth_token";


// Add request interceptor to handle FormData
hr2Api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      // Remove Content-Type so axios sets correct boundary
      if (config.headers && config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for debugging
hr2Api.interceptors.response.use(
  (response) => {
    console.log('HR2 API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Only log errors if not suppressed in config
    if (!error.config?._skipErrorLog) {
      console.error('HR2 API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);


(function boot() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    hr2Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
})();

export function setHR2Token(token) {
  if (!token) {
    delete hr2Api.defaults.headers.common["Authorization"];
    return;
  }
  hr2Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Sync with auth token changes
export function syncHR2Token() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    hr2Api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete hr2Api.defaults.headers.common["Authorization"];
  }
}

export const hr2 = {
  backendBase: hr2Base,
  backend: {
    ess: {
      profile: `${hr2Base}/api/employees`
    },
    api: {
      workProgress: `${hr2Base}/api/work-progress`,
      awards: `${hr2Base}/api/awards`
    }
  },

  // ===========================================
  // LEARNING MANAGEMENT SYSTEM
  // ===========================================
  learning: {
    // Course Management
    courses: {
      // Get all courses with optional filters
      getAll: (params = {}) => hr2Api.get('/lms/courses', { params }),
      
      // Get a specific course
      getById: (id) => hr2Api.get(`/lms/courses/${id}`),
      
      // Create a new course (HR2 Admin/Trainer)
      create: (data) => hr2Api.post('/lms/courses', data),
      
      // Update course (HR2 Admin/Trainer)
      update: (id, data) => hr2Api.put(`/lms/courses/${id}`, data),
      
      // Delete course (HR2 Admin/Trainer)
      delete: (id) => hr2Api.delete(`/lms/courses/${id}`),
      
      // Get course categories
      getCategories: () => hr2Api.get('/lms/courses/categories'),
      
      // Search courses
      search: (query, params = {}) => hr2Api.get('/lms/courses/search', { 
        params: { q: query, ...params } 
      }),
    },

    // Learning Plans
    learningPlans: {
      // Get all available learning plans
      getAvailable: (userId) => hr2Api.get('/lms/learning-plans', { params: { all: true, user_id: userId } }),
      
      // Get learning plans for a specific user
      getByUser: (userId) => hr2Api.get('/lms/learning-plans', { params: { user_id: userId } }),
      
      // Get a specific learning plan
      getById: (id) => hr2Api.get(`/lms/learning-plans/${id}`),
      
      // Enroll in a learning plan (bulk enroll in all courses)
      enroll: (planId, userId) => hr2Api.post(`/lms/learning-plans/${planId}/enroll`, { user_id: userId }),
      
      // Unenroll from a learning plan (remove from assigned users and unenroll from courses)
      unenroll: (planId, userId) => hr2Api.delete(`/lms/learning-plans/${planId}/enroll`, { data: { user_id: userId } }),
      
      // Create a new learning plan (HR2 Admin/Trainer)
      create: (data) => hr2Api.post('/lms/learning-plans', data),
      
      // Update learning plan (HR2 Admin/Trainer)
      update: (id, data) => hr2Api.put(`/lms/learning-plans/${id}`, data),
      
      // Delete learning plan (HR2 Admin/Trainer)
      delete: (id) => hr2Api.delete(`/lms/learning-plans/${id}`),
    },

    // Learning Progress
    progress: {
      // Get all progress records
      getAll: (params = {}) => hr2Api.get('/lms/progress', { params }),
      
      // Get progress for a specific user
      getByUser: (userId) => hr2Api.get('/lms/progress', { params: { user_id: userId } }),
      
      // Get progress for a specific course
      getByCourse: (courseId) => hr2Api.get(`/lms/courses/${courseId}/progress`),
      
      // Update progress (Employee)
      update: (progressId, data) => hr2Api.put(`/lms/progress/${progressId}`, data),
      
      // Create progress record (auto-enrollment)
      create: (data) => hr2Api.post('/lms/progress', data),
      
      // Mark course as completed
      complete: (progressId, score = null) => hr2Api.put(`/lms/progress/${progressId}/complete`, { score }),
      
      // Reset progress
      reset: (progressId) => hr2Api.put(`/lms/progress/${progressId}/reset`),
    },

    // Enrollment Management
    enrollment: {
      // Enroll in a course
      enroll: (data) => hr2Api.post('/lms/enroll', data),
      
      // Unenroll from a course (Employee)
      unenroll: (data) => hr2Api.delete('/lms/enroll', { data }),
      
      // Get enrollment status
      getStatus: (userId, courseId) => hr2Api.get('/lms/enrollment/status', { 
        params: { user_id: userId, course_id: courseId } 
      }),
      
      // Bulk enroll users in course
      bulkEnroll: (courseId, userIds) => hr2Api.post(`/lms/courses/${courseId}/bulk-enroll`, { user_ids: userIds }),
    },

    // Employee Actions
    employee: {
      // Get my enrolled courses (Employee)
      getMyCourses: () => hr2Api.get('/lms/my-courses'),
      
      // Get my learning plans (Employee)
      getMyLearningPlans: () => hr2Api.get('/lms/my-learning-plans'),
    },

    // Analytics & Recommendations
    analytics: {
      // Get learning analytics
      getOverview: (params = {}) => hr2Api.get('/lms/analytics/overview', { params }),
      
      // Get user-specific analytics
      getUserAnalytics: (userId) => hr2Api.get(`/lms/analytics/users/${userId}`),
      
      // Get course analytics
      getCourseAnalytics: (courseId) => hr2Api.get(`/lms/analytics/courses/${courseId}`),
      
      // Get recommendations for user
      getRecommendations: (userId) => hr2Api.get('/lms/recommendations', { params: { user_id: userId } }),
      
      // Get learning path suggestions
      getLearningPaths: (userId) => hr2Api.get(`/lms/learning-paths/${userId}`),
    },

    // Feedback & Evaluation
    feedback: {
      // Get all feedback
      getAll: (params = {}) => hr2Api.get('/lms/feedback', { params }),
      
      // Get feedback for a course
      getByCourse: (courseId) => hr2Api.get(`/lms/courses/${courseId}/feedback`),
      
      // Submit feedback
      submit: (data) => hr2Api.post('/lms/feedback', data),
      
      // Update feedback
      update: (id, data) => hr2Api.put(`/lms/feedback/${id}`, data),
      
      // Delete feedback
      delete: (id) => hr2Api.delete(`/lms/feedback/${id}`),
    },

    // Dashboard Endpoints
    dashboard: {
      
      // Get learning plans data for dashboard
      getLearningPlans: (userId = 1) => hr2Api.get('/lms/dashboard/learning-plans', { 
        params: { user_id: userId } 
      }),
      
      // Get course catalog data for dashboard
      getCourseCatalog: (userId = 1) => hr2Api.get('/lms/dashboard/course-catalog', { 
        params: { user_id: userId } 
      }),
      
      // Get learning progress data for dashboard
      getLearningProgress: (userId = 1) => hr2Api.get('/lms/dashboard/learning-progress', { 
        params: { user_id: userId } 
      }),
    },
  },

  // ===========================================
  // COMPETENCY MANAGEMENT
  // ===========================================
  competency: {
  },

  // ===========================================
  // TRAINING MANAGEMENT SYSTEM
  // ===========================================

  // Training CRUD
  training: {
    // Get all trainings (with optional filters)
    getAll: (params = {}) => hr2Api.get('/training', { params }),
    
    // Get a specific training
    getById: (id) => hr2Api.get(`/training/${id}`),
    
    // Create a new training (HR2 Admin/Trainer)
    create: (data) => hr2Api.post('/training', data),
    
    // Update training (HR2 Admin/Trainer)
    update: (id, data) => hr2Api.put(`/training/${id}`, data),
    
    // Delete training (HR2 Admin/Trainer)
    delete: (id) => hr2Api.delete(`/training/${id}`),
    
    // Get training statistics
    getStats: (id) => hr2Api.get(`/training/${id}/stats`),
  },

  // Training Applications
  trainingApplications: {
    // Get all training applications (HR2 Admin)
    getAll: (params = {}) => hr2Api.get('/training-applications', { params }),
    
    // Get applications for a specific employee
    getByEmployee: (employeeId) => hr2Api.get(`/employees/${employeeId}/training-applications`),
    
    // Apply for training (Employee)
    apply: (data) => hr2Api.post('/training-applications', data),
    
    // Approve application (HR2 Admin)
    approve: (id) => hr2Api.put(`/training-applications/${id}/approve`),
    
    // Reject application (HR2 Admin)
    reject: (id) => hr2Api.put(`/training-applications/${id}/reject`),
    
    // Cancel application (Employee)
    cancel: (id) => hr2Api.put(`/training-applications/${id}/cancel`),
    
    // Get pending applications (HR2 Admin)
    getPending: () => hr2Api.get('/training-applications/pending'),
  },

  // Training Sessions & Scheduling (Note: Not fully implemented in backend)
  trainingSessions: {
    // Get all training sessions (may not be implemented)
    getAll: (params = {}) => hr2Api.get('/training-sessions', { params }),
    
    // Create training session (may not be implemented)
    create: (data) => hr2Api.post('/training-sessions', data),
    
    // Schedule training (may not be implemented)
    schedule: (trainingId, data) => hr2Api.post(`/training/${trainingId}/schedule`, data),
  },

  // Training Completions & Certificates
  trainingCompletions: {
    // Get all training completions
    getAll: (params = {}) => hr2Api.get('/training-completions', { params }),
    
    // Get completions for a specific employee
    getByEmployee: (employeeId) => hr2Api.get(`/employees/${employeeId}/training-completions`),
    
    // Create training completion
    create: (data) => hr2Api.post('/training-completions', data),
  },

  // Training Certificates
  certificates: {
    // Get certificates for an employee
    getByEmployee: (employeeId) => hr2Api.get(`/employees/${employeeId}/certificates`),
    
    // Download certificate
    download: (certificateId) => hr2Api.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob',
      headers: { 'Accept': 'application/pdf' }
    }),
    
    // Issue certificate for completion
    issue: (completionId) => hr2Api.post(`/training-completions/${completionId}/certificate`),
  },

  // Training Feedback
  trainingFeedback: {
    // Submit feedback (Employee)
    submit: (data) => hr2Api.post('/training-feedback', data),
    
    // Get feedback by employee
    getByEmployee: (employeeId) => hr2Api.get(`/employees/${employeeId}/training-feedback`),
    
    // Get feedback by training
    getByTraining: (trainingId) => hr2Api.get(`/training/${trainingId}/feedback`),
  },

  // Training Calendar Integration
  trainingCalendar: {
    // Sync application to calendar
    sync: (applicationId) => hr2Api.post(`/training-applications/${applicationId}/sync-calendar`),
    
    // Get calendar events
    getEvents: (params = {}) => hr2Api.get('/training-calendar', { params }),
  },

  // ===========================================
  // SUCCESSION PLANNING
  // ===========================================
  succession: {
  },

  // ===========================================
  // EMPLOYEE SELF SERVICE
  // ===========================================
  employees: {
    getAll: () => hr2Api.get('/employees'),
    getById: (id) => hr2Api.get(`/employees/${id}`, { _skipErrorLog: true }),
    create: (data) => hr2Api.post('/employees', data),
    update: (id, data) => hr2Api.put(`/employees/${id}`, data),
    delete: (id) => hr2Api.delete(`/employees/${id}`),
    uploadPhoto: (id, formData) => hr2Api.post(`/employees/${id}/photo`, formData),
  },
  // Leave Requests
  leaveRequests: {
    // Get all leave requests (with optional filters)
    getAll: (params = {}) => hr2Api.get('/leave-requests', { params }),

    // Get leave requests for a specific employee
    getByEmployee: (employeeId, params = {}) =>
      hr2Api.get('/leave-requests', { params: { employee_id: employeeId, ...params } }),

    // Get a specific leave request
    getById: (id) => hr2Api.get(`/leave-requests/${id}`),

    // Create a new leave request (Employee)
    create: (data) => hr2Api.post('/leave-requests', data),

    // Update leave request status (HR2 Admin approval/denial)
    updateStatus: (id, data) => hr2Api.put(`/leave-requests/${id}`, data),

    // Delete a leave request (Employee can delete pending requests)
    delete: (id) => hr2Api.delete(`/leave-requests/${id}`),

    // Get leave request statistics
    getStats: (params = {}) => hr2Api.get('/leave-requests-stats', { params }),

    // Get pending requests (HR2 Admin)
    getPending: () => hr2Api.get('/leave-requests', { params: { status: 'Pending' } }),

    // Get approved requests
    getApproved: () => hr2Api.get('/leave-requests', { params: { status: 'Accepted' } }),

    // Get denied requests
    getDenied: () => hr2Api.get('/leave-requests', { params: { status: 'Denied' } }),

    // Approve a leave request (HR2 Admin)
    approve: (id, adminNotes = '') =>
      hr2Api.put(`/leave-requests/${id}`, {
        status: 'Accepted',
        admin_notes: adminNotes
      }),

    // Deny a leave request (HR2 Admin)
    deny: (id, adminNotes = '') =>
      hr2Api.put(`/leave-requests/${id}`, {
        status: 'Denied',
        admin_notes: adminNotes
      }),
  },

  // Timesheet Adjustment Requests
  timesheetAdjustments: {
    // Get all timesheet adjustment requests (HR2 Admin)
    getAll: (params = {}) => hr2Api.get('/timesheet-adjustments', { params }),

    // Get timesheet adjustment requests for a specific employee
    getByEmployee: (employeeId, params = {}) =>
      hr2Api.get('/timesheet-adjustments', { params: { employee_id: employeeId, ...params } }),

    // Get a specific timesheet adjustment request
    getById: (id) => hr2Api.get(`/timesheet-adjustments/${id}`),

    // Create a new timesheet adjustment request (Employee)
    create: (data) => hr2Api.post('/timesheet-adjustments', data),

    // Update timesheet adjustment request status (HR2 Admin approval/denial)
    updateStatus: (id, data) => hr2Api.put(`/timesheet-adjustments/${id}`, data),

    // Delete a timesheet adjustment request (Employee can delete pending requests)
    delete: (id) => hr2Api.delete(`/timesheet-adjustments/${id}`),

    // Get pending requests (HR2 Admin)
    getPending: () => hr2Api.get('/timesheet-adjustments', { params: { status: 'Pending' } }),

    // Get approved requests
    getApproved: () => hr2Api.get('/timesheet-adjustments', { params: { status: 'Approved' } }),

    // Get rejected requests
    getRejected: () => hr2Api.get('/timesheet-adjustments', { params: { status: 'Rejected' } }),

    // Approve a timesheet adjustment request (HR2 Admin)
    approve: (id, adminNotes = '') =>
      hr2Api.put(`/timesheet-adjustments/${id}`, {
        status: 'Approved',
        admin_notes: adminNotes
      }),

    // Reject a timesheet adjustment request (HR2 Admin)
    reject: (id, adminNotes = '') =>
      hr2Api.put(`/timesheet-adjustments/${id}`, {
        status: 'Rejected',
        admin_notes: adminNotes
      }),
  },

  // Reimbursement Requests
  reimbursements: {
    // Get all reimbursement requests (HR2 Admin)
    getAll: (params = {}) => hr2Api.get('/reimbursements', { params }),

    // Get reimbursement requests for a specific employee
    getByEmployee: (employeeId, params = {}) =>
      hr2Api.get('/reimbursements', { params: { employee_id: employeeId, ...params } }),

    // Get a specific reimbursement request
    getById: (id) => hr2Api.get(`/reimbursements/${id}`),

    // Create a new reimbursement request (Employee)
    create: (data) => hr2Api.post('/reimbursements', data),

    // Update reimbursement request status (HR2 Admin approval/denial)
    updateStatus: (id, data) => hr2Api.put(`/reimbursements/${id}`, data),

    // Delete a reimbursement request (Employee can delete pending requests)
    delete: (id) => hr2Api.delete(`/reimbursements/${id}`),

    // Get pending requests (HR2 Admin)
    getPending: () => hr2Api.get('/reimbursements', { params: { status: 'Pending' } }),

    // Get approved requests
    getApproved: () => hr2Api.get('/reimbursements', { params: { status: 'Approved' } }),

    // Get rejected requests
    getRejected: () => hr2Api.get('/reimbursements', { params: { status: 'Rejected' } }),

    // Approve a reimbursement request (HR2 Admin)
    approve: (id, adminNotes = '') =>
      hr2Api.put(`/reimbursements/${id}`, {
        status: 'Approved',
        admin_notes: adminNotes
      }),

    // Reject a reimbursement request (HR2 Admin)
    reject: (id, adminNotes = '') =>
      hr2Api.put(`/reimbursements/${id}`, {
        status: 'Rejected',
        admin_notes: adminNotes
      }),
  },

  // ===========================================
  // USER INTEGRATION (Auth + HR2)
  // ===========================================
  users: {
    getAuthUsers: () => hr2Api.get('/auth-users'),
    getCombinedEmployees: () => hr2Api.get('/combined-employees'),
    createEmployeeFromUser: (data) => hr2Api.post('/employees/from-user', data),
    updateUser: (id, data) => authApi.put(`/api/users/${id}`, data),
  },
};

// ===========================================
// LMS API Convenience Functions
// ===========================================

// Course API functions
export const courseAPI = {
  getCourses: (params = {}) => hr2.learning.courses.getAll(params),
  getCourse: (id) => hr2.learning.courses.getById(id),
  createCourse: (data) => hr2.learning.courses.create(data),
  updateCourse: (id, data) => hr2.learning.courses.update(id, data),
  deleteCourse: (id) => hr2.learning.courses.delete(id),
};

// Learning Plan API functions
export const learningPlanAPI = {
  getLearningPlans: (userId) => hr2.learning.learningPlans.getByUser(userId),
  getLearningPlan: (id) => hr2.learning.learningPlans.getById(id),
  createLearningPlan: (data) => hr2.learning.learningPlans.create(data),
  updateLearningPlan: (id, data) => hr2.learning.learningPlans.update(id, data),
  deleteLearningPlan: (id) => hr2.learning.learningPlans.delete(id),
  assignLearningPlan: (planId, userIds) => hr2.learning.learningPlans.assign(planId, userIds),
  enroll: (planId, userId) => hr2.learning.learningPlans.enroll(planId, { user_id: userId }),
  unenroll: (planId, userId) => hr2.learning.learningPlans.unenroll(planId, { user_id: userId }),
};

// Progress API functions
export const progressAPI = {
  getLearningProgress: (userId) => hr2.learning.progress.getByUser(userId),
  updateProgress: (progressId, data) => hr2.learning.progress.update(progressId, data),
  createProgress: (data) => hr2.learning.progress.create(data),
  completeCourse: (progressId, score) => hr2.learning.progress.complete(progressId, score),
  resetProgress: (progressId) => hr2.learning.progress.reset(progressId),
  enrollInCourse: (data) => hr2.learning.enrollment.enroll(data),
  unenrollFromCourse: (courseId) => hr2.learning.enrollment.unenroll(courseId),
};

// Analytics API functions
export const analyticsAPI = {
  getRecommendations: (userId) => hr2.learning.analytics.getRecommendations(userId),
  getUserAnalytics: (userId) => hr2.learning.analytics.getUserAnalytics(userId),
  getOverview: (params) => hr2.learning.analytics.getOverview(params),
};

// Employee API functions
export const employeeAPI = {
  getMyCourses: () => hr2.learning.employee.getMyCourses(),
  getMyLearningPlans: () => hr2.learning.employee.getMyLearningPlans(),
  submitFeedback: (data) => hr2.learning.feedback.submit(data),
};

// LMS Utility functions
export const lmsUtils = {
  // Transform course data from API
  transformCourse: (course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    duration: course.duration,
    rating: course.rating || 0,
    enrolledCount: course.enrolled_count || 0,
    tags: course.tags || [],
    prerequisites: course.prerequisites || [],
    enrolledUsers: course.enrolled_users || [],
    instructor: course.instructor || 'TBD',
  }),

  // Transform learning plan data from API
  transformLearningPlan: (plan) => ({
    id: plan.id,
    title: plan.title,
    description: plan.description,
    courses: plan.courses || [],
    dueDate: plan.due_date,
    estimatedHours: plan.estimated_hours,
    status: plan.status,
    assignedUsers: plan.assigned_users || [],
  }),

  // Transform progress data from API
  transformProgress: (progress) => ({
    id: progress.id,
    userId: progress.user_id,
    courseId: progress.course_id,
    courseTitle: progress.course_title,
    source: progress.source,
    sourceId: progress.source_id,
    enrollmentDate: progress.enrollment_date,
    progress: progress.progress_percentage || 0,
    status: progress.status,
    lastAccessed: progress.last_accessed,
    score: progress.score,
  }),

  // Get course by ID from catalog
  getCourseById: (catalog, courseId) => {
    return catalog.find(course => course.id === courseId);
  },

  // Calculate learning plan progress
  calculatePlanProgress: (plan, progressRecords) => {
    if (!plan || !plan.courses || plan.courses.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completedCourses = plan.courses.filter(courseId => {
      const courseProgress = progressRecords.find(p => p.courseId === courseId);
      return courseProgress && courseProgress.status === 'completed';
    });

    const percentage = Math.round((completedCourses.length / plan.courses.length) * 100);

    return {
      completed: completedCourses.length,
      total: plan.courses.length,
      percentage: percentage
    };
  },

  // Check if user can enroll in course
  canEnrollInCourse: (course, userProgress) => {
    if (!course) return false;

    // Check prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const prerequisiteMet = course.prerequisites.every(prereqId => {
        const prereqProgress = userProgress.find(p => p.courseId === prereqId);
        return prereqProgress && prereqProgress.status === 'completed';
      });
      if (!prerequisiteMet) return false;
    }

    // Check if already enrolled
    const alreadyEnrolled = userProgress.some(p => p.courseId === course.id);
    return !alreadyEnrolled;
  },
};
