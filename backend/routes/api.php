<?php

use App\Http\Controllers\APIController;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LMController;
use App\Http\Controllers\LMSController;
use App\Http\Controllers\TMController;
use App\Http\Controllers\ESSController;
use App\Http\Controllers\CMController;
use App\Http\Controllers\SPController;
use App\Http\Controllers\NotificationController;

Route::prefix('hr2')->group(function () {

    // ===========================================
    // LEARNING MANAGEMENT SYSTEM
    // ===========================================
    Route::get('/learning', [LMController::class, 'index']);
    
    // LMS Routes
    Route::prefix('lms')->group(function () {
        // Course Catalog Management
        Route::get('/courses', [LMSController::class, 'getCourses']);
        Route::post('/courses', [LMSController::class, 'createCourse']);
        Route::put('/courses/{id}', [LMSController::class, 'updateCourse']);
        Route::delete('/courses/{id}', [LMSController::class, 'deleteCourse']);
        
        // Learning Plans Management
        Route::get('/learning-plans', [LMSController::class, 'getLearningPlans']);
        Route::post('/learning-plans', [LMSController::class, 'createLearningPlan']);
        Route::post('/learning-plans/{id}/enroll', [LMSController::class, 'enrollInLearningPlan']);
        Route::delete('/learning-plans/{id}/enroll', [LMSController::class, 'unenrollFromLearningPlan']);
        Route::put('/learning-plans/{id}', [LMSController::class, 'updateLearningPlan']);
        Route::delete('/learning-plans/{id}', [LMSController::class, 'deleteLearningPlan']);
        
        // Learning Progress Management
        Route::get('/progress', [LMSController::class, 'getLearningProgress']);
        Route::post('/enroll', [LMSController::class, 'enrollInCourse']);
        Route::delete('/enroll', [LMSController::class, 'unenrollFromCourse']);
        Route::put('/progress/{id}', [LMSController::class, 'updateProgress']);
        Route::put('/progress/{id}/complete', [LMSController::class, 'completeCourse']);
        Route::put('/progress/{id}/reset', [LMSController::class, 'resetProgress']);
        Route::delete('/progress/{id}', [LMSController::class, 'deleteProgress']);
        
        // Employee Actions
        Route::get('/my-courses', [LMSController::class, 'getMyCourses']);
        Route::get('/my-learning-plans', [LMSController::class, 'getMyLearningPlans']);
        Route::post('/feedback', [LMSController::class, 'submitFeedback']);
        
        // Analytics & Recommendations
        Route::get('/analytics', [LMSController::class, 'getAnalytics']);
        Route::get('/recommendations', [LMSController::class, 'getRecommendations']);
        
        // Dashboard Endpoints
        Route::get('/dashboard/learning-plans', [LMSController::class, 'getDashboardLearningPlans']);
        Route::get('/dashboard/course-catalog', [LMSController::class, 'getDashboardCourseCatalog']);
        Route::get('/dashboard/learning-progress', [LMSController::class, 'getDashboardLearningProgress']);
    });

    // ===========================================
    // COMPETENCY MANAGEMENT
    // ===========================================
    Route::get('/competency', [CMController::class, 'index']);

    // ===========================================
    // TRAINING MANAGEMENT SYSTEM
    // ===========================================
    Route::get('/training', [TMController::class, 'index']);
    Route::post('/training', [TMController::class, 'store']);
    Route::get('/training/{id}', [TMController::class, 'show']);
    Route::put('/training/{id}', [TMController::class, 'update']);
    Route::delete('/training/{id}', [TMController::class, 'destroy']);
    Route::get('/training/{id}/stats', [TMController::class, 'getTrainingStats']);
    Route::get('/training/inactive/list', [TMController::class, 'getInactiveTrainings']);
    Route::post('/training/{id}/restore', [TMController::class, 'restoreTraining']);
    
    // Training Applications
    Route::get('/training-applications', [TMController::class, 'getApplications']);
    Route::post('/training-applications', [TMController::class, 'applyForTraining']);
    Route::put('/training-applications/{id}/approve', [TMController::class, 'approveApplication']);
    Route::put('/training-applications/{id}/reject', [TMController::class, 'rejectApplication']);
    Route::put('/training-applications/{id}/cancel', [TMController::class, 'cancelApplication']);
    Route::get('/training-applications/pending', [TMController::class, 'getPendingApplications']);
    Route::get('/employees/{employeeId}/training-applications', [TMController::class, 'getEmployeeApplications']);
    
    // Training Sessions & Scheduling
    Route::get('/training-sessions', [TMController::class, 'getTrainingSessions']);
    Route::post('/training-sessions', [TMController::class, 'createTrainingSession']);
    Route::post('/training/{trainingId}/schedule', [TMController::class, 'scheduleTraining']);
    
    // Training Completions & Certificates
    Route::get('/training-completions', [TMController::class, 'getTrainingCompletions']);
    Route::post('/training-completions', [TMController::class, 'createTrainingCompletion']);
    Route::get('/employees/{employeeId}/training-completions', [TMController::class, 'getEmployeeCompletions']);
    Route::post('/training-completions/{completionId}/certificate', [TMController::class, 'issueCertificate']);
    Route::get('/certificates/{certificateId}/download', [TMController::class, 'downloadCertificate']);
    Route::get('/employees/{employeeId}/certificates', [TMController::class, 'getEmployeeCertificates']);
    
    // Training Feedback
    Route::post('/training-feedback', [TMController::class, 'submitFeedback']);
    Route::get('/employees/{employeeId}/training-feedback', [TMController::class, 'getEmployeeFeedback']);
    Route::get('/training/{trainingId}/feedback', [TMController::class, 'getTrainingFeedback']);
    
    // Calendar Integration
    Route::post('/training-applications/{applicationId}/sync-calendar', [TMController::class, 'syncToCalendar']);
    Route::get('/training-calendar', [TMController::class, 'getCalendarEvents']);

    // ===========================================
    // SUCCESSION PLANNING
    // ===========================================
    Route::get('/succession', [SPController::class, 'index']);

    // ===========================================
    // EMPLOYEE SELF SERVICE
    // ===========================================
    Route::get('/combined-employees', [ESSController::class, 'getCombinedEmployees']);
    Route::get('/employees', [ESSController::class, 'listEmployees']);
    Route::get('/employees/{id}', [ESSController::class, 'showEmployee']);
    Route::post('/employees', [ESSController::class, 'createEmployee']);
    Route::put('/employees/{id}', [ESSController::class, 'updateEmployee']);
    Route::delete('/employees/{id}', [ESSController::class, 'deleteEmployee']);
    Route::post('/employees/{id}/photo', [ESSController::class, 'uploadPhoto']);
    
    // ===========================================
    // LEAVE REQUEST MANAGEMENT
    // ===========================================
    Route::get('/leave-requests', [ESSController::class, 'getLeaveRequests']);
    Route::post('/leave-requests', [ESSController::class, 'createLeaveRequest']);
    Route::get('/leave-requests/{id}', [ESSController::class, 'showLeaveRequest']);
    Route::put('/leave-requests/{id}', [ESSController::class, 'updateLeaveRequestStatus']);
    Route::delete('/leave-requests/{id}', [ESSController::class, 'deleteLeaveRequest']);
    Route::get('/leave-requests-stats', [ESSController::class, 'getLeaveRequestStats']);
    
    // Legacy route for compatibility
    Route::get('/leave-requests', [ESSController::class, 'index']);

    // ===========================================
    // TIMESHEET ADJUSTMENT MANAGEMENT
    // ===========================================
    Route::get('/timesheet-adjustments', [ESSController::class, 'getTimesheetAdjustments']);
    Route::post('/timesheet-adjustments', [ESSController::class, 'createTimesheetAdjustment']);
    Route::get('/timesheet-adjustments/{id}', [ESSController::class, 'showTimesheetAdjustment']);
    Route::put('/timesheet-adjustments/{id}', [ESSController::class, 'updateTimesheetAdjustmentStatus']);
    Route::delete('/timesheet-adjustments/{id}', [ESSController::class, 'deleteTimesheetAdjustment']);

    // ===========================================
    // REIMBURSEMENT MANAGEMENT
    // ===========================================
    Route::get('/reimbursements', [ESSController::class, 'getReimbursements']);
    Route::post('/reimbursements', [ESSController::class, 'createReimbursement']);
    Route::get('/reimbursements/{id}', [ESSController::class, 'showReimbursement']);
    Route::put('/reimbursements/{id}', [ESSController::class, 'updateReimbursementStatus']);
    Route::delete('/reimbursements/{id}', [ESSController::class, 'deleteReimbursement']);

    // ===========================================
    // USER INTEGRATION
    // ===========================================
    Route::get('/auth-users', [UserController::class, 'getAuthUsers']);
    Route::get('/combined-employees', [UserController::class, 'getCombinedEmployeeData']);
    Route::post('/employees/from-user', [UserController::class, 'createEmployeeFromUser']);

});
