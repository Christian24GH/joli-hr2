<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\EmployeeSelfService;

class UserController extends Controller
{
    /**
     * Get users from auth service
     */
    public function getAuthUsers(): JsonResponse
    {
        try {
            $authBaseUrl = env('AUTH_SERVICE_URL', 'http://localhost:8091');
            $response = Http::get($authBaseUrl . '/api/users');
            
            if ($response->successful()) {
                return response()->json($response->json());
            }
            
            return response()->json(['error' => 'Failed to fetch users from auth service'], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Auth service connection failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get combined user and employee data
     */
    public function getCombinedEmployeeData(): JsonResponse
    {
        try {
            // Get users from auth service
            $authBaseUrl = env('AUTH_SERVICE_URL', 'http://localhost:8091');
            try {
                $authResponse = Http::timeout(10)->get($authBaseUrl . '/api/internal/users');
            } catch (\Exception $httpError) {
                return response()->json([
                    'error' => 'Failed to connect to auth service: ' . $httpError->getMessage(),
                    'auth_url' => $authBaseUrl . '/api/internal/users'
                ], 500);
            }
            if (!$authResponse->successful()) {
                return response()->json([
                    'error' => 'Auth service returned error: ' . $authResponse->status(),
                    'response' => $authResponse->body()
                ], 500);
            }
            $users = $authResponse->json();
            if (!is_array($users)) {
                return response()->json([
                    'error' => 'Auth service did not return an array',
                    'data' => $users
                ], 500);
            }
            $employees = EmployeeSelfService::all();
            $combinedData = [];
            foreach ($users as $user) {
                // Ensure $user is an array
                if (is_object($user)) {
                    $user = (array)$user;
                }
                // Defensive: check required fields
                if (!isset($user['email'])) {
                    // Log the user for debugging
                    Log::error('User missing email field', ['user' => $user]);
                    continue;
                }
                $employee = $employees->firstWhere('email', $user['email']);
                $combinedData[] = [
                    'id' => $user['id'] ?? null,
                    'name' => $user['name'] ?? '',
                    'email' => $user['email'],
                    'role' => $user['role'] ?? '',
                    'created_at' => $user['created_at'] ?? null,
                    'employee_data' => $employee ? $employee->toArray() : null
                ];
            }
            return response()->json($combinedData);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to combine user data: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Create employee record linked to auth user
     */
    public function createEmployeeFromUser(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'user_id' => 'required|integer',
            'user_email' => 'required|email',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
            'civil_status' => 'nullable|string|max:255',
            'emergency_contact' => 'nullable|string|max:255',
            'manager' => 'nullable|string|max:255',
            'employee_status' => 'nullable|string|max:255',
        ]);

        try {
            // Check if employee already exists
            $existingEmployee = EmployeeSelfService::where('email', $validatedData['user_email'])->first();
            if ($existingEmployee) {
                return response()->json(['error' => 'Employee record already exists for this user'], 409);
            }

            $employee = EmployeeSelfService::create([
                'auth_user_id' => $validatedData['user_id'],
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
                'email' => $validatedData['user_email'],
                'department' => $validatedData['department'] ?? null,
                'position' => $validatedData['position'] ?? null,
                'hire_date' => $validatedData['hire_date'] ?? null,
                'phone' => $validatedData['phone'] ?? null,
                'address' => $validatedData['address'] ?? null,
                'birthday' => $validatedData['birthday'] ?? null,
                'civil_status' => $validatedData['civil_status'] ?? null,
                'emergency_contact' => $validatedData['emergency_contact'] ?? null,
                'manager' => $validatedData['manager'] ?? null,
                'employee_status' => $validatedData['employee_status'] ?? 'Active',
            ]);

            return response()->json($employee, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create employee record: ' . $e->getMessage()], 500);
        }
    }
}