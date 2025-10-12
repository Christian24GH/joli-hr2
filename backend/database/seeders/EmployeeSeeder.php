<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmployeeSelfService;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            [
                'auth_user_id' => 1,
                'first_name' => 'John',
                'last_name' => 'Doe',
                'department' => 'IT',
                'position' => 'Developer',
                'email' => 'john.doe@example.com',
                'employee_status' => 'Active',
                'hire_date' => now(),
            ],
            [
                'auth_user_id' => 2,
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'department' => 'HR',
                'position' => 'Manager',
                'email' => 'jane.smith@example.com',
                'employee_status' => 'Active',
                'hire_date' => now(),
            ],
            [
                'auth_user_id' => 3,
                'first_name' => 'Bob',
                'last_name' => 'Johnson',
                'department' => 'Finance',
                'position' => 'Analyst',
                'email' => 'bob.johnson@example.com',
                'employee_status' => 'Active',
                'hire_date' => now(),
            ],
            [
                'auth_user_id' => 4,
                'first_name' => 'Alice',
                'last_name' => 'Williams',
                'department' => 'Marketing',
                'position' => 'Coordinator',
                'email' => 'alice.williams@example.com',
                'employee_status' => 'Active',
                'hire_date' => now(),
            ],
            [
                'auth_user_id' => 5,
                'first_name' => 'Charlie',
                'last_name' => 'Brown',
                'department' => 'Operations',
                'position' => 'Supervisor',
                'email' => 'charlie.brown@example.com',
                'employee_status' => 'Active',
                'hire_date' => now(),
            ],
        ];

        foreach ($employees as $employee) {
            EmployeeSelfService::create($employee);
        }
    }
}