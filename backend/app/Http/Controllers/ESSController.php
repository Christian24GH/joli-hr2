<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSelfService;
use App\Models\LeaveRequest;
use App\Models\TimesheetAdjustment;
use App\Models\Reimbursement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ESSController extends Controller
{
    // Employee CRUD
    public function listEmployees(): JsonResponse
    {
        $employees = EmployeeSelfService::all();
        return response()->json($employees);
    }

    public function getCombinedEmployees(): JsonResponse
    {
        try {
            // Get auth users from the auth service
            $authServiceUrl = env('AUTH_SERVICE_URL', 'http://localhost:8091');
            $response = Http::get($authServiceUrl . '/api/users');
            
            if (!$response->successful()) {
                Log::error('Failed to fetch auth users: ' . $response->status());
                return response()->json(['error' => 'Failed to fetch auth users'], 500);
            }
            
            $authUsers = $response->json();

            // Get HR2 employees
            $hr2Employees = EmployeeSelfService::all()->keyBy('auth_user_id');

            // Combine the data
            $combinedEmployees = collect($authUsers)->map(function ($user) use ($hr2Employees) {
                $employeeData = $hr2Employees->get($user['id']);
                return [
                    'id' => $user['id'],
                    'name' => $user['name'] ?? '',
                    'email' => $user['email'] ?? '',
                    'role' => $user['role'] ?? '',
                    'first_name' => $employeeData ? $employeeData->first_name : ($user['name'] ? explode(' ', $user['name'])[0] : ''),
                    'last_name' => $employeeData ? $employeeData->last_name : ($user['name'] ? implode(' ', array_slice(explode(' ', $user['name']), 1)) : ''),
                    'employee_data' => $employeeData ? $employeeData->toArray() : null,
                    'has_employee_record' => $employeeData !== null,
                ];
            });

            return response()->json($combinedEmployees);
        } catch (\Exception $e) {
            Log::error('Failed to get combined employees: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch combined employees'], 500);
        }
    }

    public function showEmployee($id): JsonResponse
    {
        $employee = EmployeeSelfService::find($id);
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }
        return response()->json($employee);
    }
    public function createEmployee(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'auth_user_id' => 'nullable|integer',
            'user_id' => 'nullable|integer',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employee_self_service,email',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'hire_date' => 'required|date',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
            'civil_status' => 'nullable|string|max:255',
            'emergency_contact' => 'nullable|string|max:255',
            'manager' => 'nullable|string|max:255',
            'employee_status' => 'nullable|string|max:255',
            'profile_photo_url' => 'nullable|url',
            'roles' => 'nullable|string|max:255',
        ]);
        $employee = EmployeeSelfService::create($validatedData);
        return response()->json(['message' => 'Employee created successfully.', 'employee' => $employee], 201);
    }
    public function updateEmployee(Request $request, $id): JsonResponse
    {
        $employee = EmployeeSelfService::find($id);
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }
        $validatedData = $request->validate([
            'auth_user_id' => 'sometimes|nullable|integer',
            'user_id' => 'sometimes|nullable|integer',
            'first_name' => 'sometimes|nullable|string|max:255',
            'last_name' => 'sometimes|nullable|string|max:255',
            'department' => 'sometimes|nullable|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|nullable|email|unique:employee_self_service,email,' . $employee->id,
            'phone' => 'sometimes|nullable|string|max:255',
            'address' => 'sometimes|nullable|string|max:255',
            'birthday' => 'sometimes|nullable|date',
            'civil_status' => 'sometimes|nullable|string|max:255',
            'emergency_contact' => 'sometimes|nullable|string|max:255',
            'hire_date' => 'sometimes|nullable|date',
            'manager' => 'sometimes|nullable|string|max:255',
            'employee_status' => 'sometimes|nullable|string|max:255',
            'profile_photo_url' => 'sometimes|nullable|url',
            'roles' => 'sometimes|nullable|string|max:255',
        ]);
        $employee->update($validatedData);
        // Note: Role updates should be handled by the auth service, not here
        $employee->refresh();
        return response()->json($employee);
    }
    public function deleteEmployee($id): JsonResponse
    {
        $employee = EmployeeSelfService::find($id);
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }
        $employee->delete();
        return response()->json(['message' => 'Employee deleted successfully'], 200);
    }

    // ===========================================
    // LEAVE REQUEST MANAGEMENT
    // ===========================================
    
    /**
     * Get all leave requests (HR2 Admin) or employee's own requests (Employee)
     */
    public function getLeaveRequests(Request $request): JsonResponse
    {
        try {
            $employeeId = $request->query('employee_id');
            $status = $request->query('status');
            
            // If employee_id is provided, get that employee's leave requests
            if ($employeeId) {
                $query = LeaveRequest::with(['employee:id,first_name,last_name,email,department'])
                    ->where('employee_id', $employeeId);
                
                if ($status) {
                    $query->where('status', $status);
                }
                
                $leaveRequests = $query->orderBy('created_at', 'desc')->get();
            } else {
                // Get all leave requests for HR2 Admin view
                $query = LeaveRequest::with(['employee:id,first_name,last_name,email,department']);
                
                if ($status) {
                    $query->where('status', $status);
                }
                
                $leaveRequests = $query->orderBy('created_at', 'desc')->get();
            }
            
            return response()->json($leaveRequests);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch leave requests: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new leave request (Employee)
     */
    public function createLeaveRequest(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'employee_id' => 'required|integer',
                'type' => 'required|string|max:255',
                'start' => 'required|date|after_or_equal:today',
                'end' => 'required|date|after_or_equal:start',
                'reason' => 'required|string|max:1000',
            ]);

            $leaveRequest = LeaveRequest::create($validatedData);
            
            // Load the employee relationship
            $leaveRequest->load(['employee:id,first_name,last_name,email,department']);
            
            return response()->json([
                'message' => 'Leave request submitted successfully',
                'leave_request' => $leaveRequest
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Leave request validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Validation failed', 
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Leave request creation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create leave request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update leave request status (HR2 Admin approval/denial)
     */
    public function updateLeaveRequestStatus(Request $request, $id): JsonResponse
    {
        try {
            $leaveRequest = LeaveRequest::find($id);
            if (!$leaveRequest) {
                return response()->json(['error' => 'Leave request not found'], 404);
            }

        $validatedData = $request->validate([
            'status' => 'required|string|in:Pending,Accepted,Denied',
            'admin_notes' => 'nullable|string|max:1000'
        ]);            $leaveRequest->update($validatedData);
            
            // Load the employee relationship
            $leaveRequest->load(['employee:id,first_name,last_name,email,department']);

            return response()->json([
                'message' => 'Leave request status updated successfully',
                'leave_request' => $leaveRequest
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update leave request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific leave request
     */
    public function showLeaveRequest($id): JsonResponse
    {
        try {
            $leaveRequest = LeaveRequest::with(['employee:id,first_name,last_name,email,department'])->find($id);
            
            if (!$leaveRequest) {
                return response()->json(['error' => 'Leave request not found'], 404);
            }

            return response()->json($leaveRequest);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch leave request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a leave request (Employee can delete their own pending requests)
     */
    public function deleteLeaveRequest($id): JsonResponse
    {
        try {
            $leaveRequest = LeaveRequest::find($id);
            
            if (!$leaveRequest) {
                return response()->json(['error' => 'Leave request not found'], 404);
            }

            // Only allow deletion of pending requests
            if ($leaveRequest->status !== 'Pending') {
                return response()->json(['error' => 'Cannot delete a leave request that has been processed'], 403);
            }

            $leaveRequest->delete();

            return response()->json(['message' => 'Leave request deleted successfully']);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete leave request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get leave request statistics for dashboard
     */
    public function getLeaveRequestStats(Request $request): JsonResponse
    {
        try {
            $employeeId = $request->query('employee_id');
            
            if ($employeeId) {
                // Employee-specific stats
                $stats = [
                    'total' => LeaveRequest::where('employee_id', $employeeId)->count(),
                    'pending' => LeaveRequest::where('employee_id', $employeeId)->where('status', 'Pending')->count(),
                    'approved' => LeaveRequest::where('employee_id', $employeeId)->where('status', 'Accepted')->count(),
                    'denied' => LeaveRequest::where('employee_id', $employeeId)->where('status', 'Denied')->count(),
                ];
            } else {
                // Overall stats for HR2 Admin
                $stats = [
                    'total' => LeaveRequest::count(),
                    'pending' => LeaveRequest::where('status', 'Pending')->count(),
                    'approved' => LeaveRequest::where('status', 'Accepted')->count(),
                    'denied' => LeaveRequest::where('status', 'Denied')->count(),
                ];
            }

            return response()->json($stats);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch leave request statistics: ' . $e->getMessage()], 500);
        }
    }

    // Legacy method kept for compatibility
    public function index() {
        return $this->getLeaveRequests(request());
    }

    public function store(Request $request) {
        return $this->createLeaveRequest($request);
    }

    public function update(Request $request, $id) {
        return $this->updateLeaveRequestStatus($request, $id);
    }

    public function uploadPhoto(Request $request, $id): JsonResponse
    {
        $request->validate([
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $employee = EmployeeSelfService::find($id);
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }

        try {
            $file = $request->file('profile_photo');
            $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Create uploads directory if it doesn't exist
            $uploadPath = public_path('uploads/profile_photos');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            
            // Move the uploaded file
            $file->move($uploadPath, $fileName);
            
            // Update employee profile photo URL
            $photoUrl = url('uploads/profile_photos/' . $fileName);
            $employee->profile_photo_url = $photoUrl;
            $employee->save();

            return response()->json([
                'message' => 'Profile photo uploaded successfully',
                'profile_photo_url' => $photoUrl
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to upload photo: ' . $e->getMessage()], 500);
        }
    }

    // ===========================================
    // TIMESHEET ADJUSTMENT METHODS
    // ===========================================

    /**
     * Get timesheet adjustment requests
     */
    public function getTimesheetAdjustments(Request $request): JsonResponse
    {
        try {
            $employeeId = $request->query('employee_id');
            $status = $request->query('status');
            
            // If employee_id is provided, get that employee's timesheet adjustment requests
            if ($employeeId) {
                $query = TimesheetAdjustment::with(['employee:id,first_name,last_name,email,department'])
                    ->where('employee_id', $employeeId);
                
                if ($status) {
                    $query->where('status', $status);
                }
                
                $timesheetAdjustments = $query->orderBy('submitted_at', 'desc')->get();
            } else {
                // Get all timesheet adjustment requests for HR2 Admin view
                $query = TimesheetAdjustment::with(['employee:id,first_name,last_name,email,department']);
                
                if ($status) {
                    $query->where('status', $status);
                }
                
                $timesheetAdjustments = $query->orderBy('submitted_at', 'desc')->get();
            }
            
            return response()->json($timesheetAdjustments);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch timesheet adjustment requests: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new timesheet adjustment request (Employee)
     */
    public function createTimesheetAdjustment(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'employee_id' => 'required|integer',
                'date' => 'required|date',
                'new_time_in' => 'required|string|regex:/^\d{2}:\d{2}$/',
                'new_time_out' => 'required|string|regex:/^\d{2}:\d{2}$/',
                'reason' => 'required|string|max:1000',
            ]);

            $validatedData['submitted_at'] = now();
            $validatedData['status'] = 'Pending';

            $timesheetAdjustment = TimesheetAdjustment::create($validatedData);
            
            // Load the employee relationship
            $timesheetAdjustment->load(['employee:id,first_name,last_name,email,department']);
            
            return response()->json([
                'message' => 'Timesheet adjustment request submitted successfully',
                'timesheet_adjustment' => $timesheetAdjustment
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Timesheet adjustment validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Validation failed', 
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Timesheet adjustment creation error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to create timesheet adjustment request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update timesheet adjustment request status (HR2 Admin approval/denial)
     */
    public function updateTimesheetAdjustmentStatus(Request $request, $id): JsonResponse
    {
        try {
            $timesheetAdjustment = TimesheetAdjustment::find($id);
            if (!$timesheetAdjustment) {
                return response()->json(['error' => 'Timesheet adjustment request not found'], 404);
            }

            $validatedData = $request->validate([
                'status' => 'required|string|in:Pending,Approved,Rejected',
                'admin_notes' => 'nullable|string|max:1000'
            ]);

            if (in_array($validatedData['status'], ['Approved', 'Rejected'])) {
                $validatedData['approved_at'] = now();
                // TODO: Set approved_by to current admin user ID
                // $validatedData['approved_by'] = auth()->id();
            }

            $timesheetAdjustment->update($validatedData);
            
            // Load the employee relationship
            $timesheetAdjustment->load(['employee:id,first_name,last_name,email,department']);

            return response()->json([
                'message' => 'Timesheet adjustment request status updated successfully',
                'timesheet_adjustment' => $timesheetAdjustment
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update timesheet adjustment request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific timesheet adjustment request
     */
    public function showTimesheetAdjustment($id): JsonResponse
    {
        $timesheetAdjustment = TimesheetAdjustment::with(['employee:id,first_name,last_name,email,department'])->find($id);
        if (!$timesheetAdjustment) {
            return response()->json(['error' => 'Timesheet adjustment request not found'], 404);
        }
        return response()->json($timesheetAdjustment);
    }

    /**
     * Delete a timesheet adjustment request (Employee can delete pending requests)
     */
    public function deleteTimesheetAdjustment($id): JsonResponse
    {
        try {
            $timesheetAdjustment = TimesheetAdjustment::find($id);
            if (!$timesheetAdjustment) {
                return response()->json(['error' => 'Timesheet adjustment request not found'], 404);
            }

            // Only allow deletion of pending requests
            if ($timesheetAdjustment->status !== 'Pending') {
                return response()->json(['error' => 'Cannot delete a processed timesheet adjustment request'], 403);
            }

            $timesheetAdjustment->delete();

            return response()->json(['message' => 'Timesheet adjustment request deleted successfully']);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete timesheet adjustment request: ' . $e->getMessage()], 500);
        }
    }

    // ===========================================
    // REIMBURSEMENT MANAGEMENT
    // ===========================================

    /**
     * Get all reimbursements or filter by employee
     */
    public function getReimbursements(Request $request): JsonResponse
    {
        try {
            $query = Reimbursement::with('employee');

            // Filter by employee_id if provided
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $reimbursements = $query->orderBy('submitted_at', 'desc')->get();

            return response()->json($reimbursements);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch reimbursements: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new reimbursement request
     */
    public function createReimbursement(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'employee_id' => 'required|integer',
                'type' => 'required|string|max:255',
                'amount' => 'required|numeric|min:0.01',
                'date' => 'required|date',
                'description' => 'required|string|max:1000',
                'receipt' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120', // 5MB max, now required
            ]);

            $validatedData['status'] = 'Pending';
            $validatedData['submitted_at'] = now();

            // Handle file upload
            if ($request->hasFile('receipt')) {
                $file = $request->file('receipt');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('reimbursements', $fileName, 'public');
                $validatedData['receipt_path'] = $filePath;
            }

            $reimbursement = Reimbursement::create($validatedData);

            return response()->json([
                'message' => 'Reimbursement request created successfully',
                'data' => $reimbursement->load('employee')
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create reimbursement request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific reimbursement request
     */
    public function showReimbursement($id): JsonResponse
    {
        try {
            $reimbursement = Reimbursement::with('employee')->find($id);

            if (!$reimbursement) {
                return response()->json(['error' => 'Reimbursement request not found'], 404);
            }

            return response()->json($reimbursement);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch reimbursement: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update reimbursement request status (Admin approval/denial)
     */
    public function updateReimbursementStatus(Request $request, $id): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'status' => 'required|string|in:Approved,Rejected',
                'admin_notes' => 'nullable|string|max:1000',
            ]);

            $reimbursement = Reimbursement::find($id);

            if (!$reimbursement) {
                return response()->json(['error' => 'Reimbursement request not found'], 404);
            }

            // Only allow status updates for pending requests
            if ($reimbursement->status !== 'Pending') {
                return response()->json(['error' => 'Cannot update a processed reimbursement request'], 403);
            }

            $updateData = [
                'status' => $validatedData['status'],
                'admin_notes' => $validatedData['admin_notes'] ?? null,
                'approved_at' => now(),
            ];

            // You might want to add approved_by field if you have user authentication
            // $updateData['approved_by'] = auth()->id();

            $reimbursement->update($updateData);

            return response()->json([
                'message' => 'Reimbursement request updated successfully',
                'data' => $reimbursement->load('employee')
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update reimbursement request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a reimbursement request (Employee can delete pending requests)
     */
    public function deleteReimbursement($id): JsonResponse
    {
        try {
            $reimbursement = Reimbursement::find($id);

            if (!$reimbursement) {
                return response()->json(['error' => 'Reimbursement request not found'], 404);
            }

            // Only allow deletion of pending requests
            if ($reimbursement->status !== 'Pending') {
                return response()->json(['error' => 'Cannot delete a processed reimbursement request'], 403);
            }

            $reimbursement->delete();

            return response()->json(['message' => 'Reimbursement request deleted successfully']);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete reimbursement request: ' . $e->getMessage()], 500);
        }
    }
}
