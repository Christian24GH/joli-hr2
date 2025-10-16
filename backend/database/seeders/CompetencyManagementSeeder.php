<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CompetencyManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed employees
        $employees = [
            [
                'id' => 1,
                'auth_user_id' => 1, // Assuming user exists
                'first_name' => 'John',
                'last_name' => 'Doe',
                'department' => 'IT',
                'position' => 'Senior Developer',
                'email' => 'john.doe@company.com',
                'phone' => '+1234567890',
                'hire_date' => '2023-01-15',
                'employee_status' => 'Active',
                'profile_photo_url' => 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'auth_user_id' => 2, // Assuming user exists
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'department' => 'Marketing',
                'position' => 'Marketing Manager',
                'email' => 'jane.smith@company.com',
                'phone' => '+1234567891',
                'hire_date' => '2022-06-10',
                'employee_status' => 'Active',
                'profile_photo_url' => 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($employees as $employee) {
            DB::table('employee_self_service')->updateOrInsert(
                ['id' => $employee['id']],
                $employee
            );
        }

        // Seed job roles (using succession_planning table structure)
        $jobRoles = [
            [
                'id' => 1,
                'role_id' => 1,
                'employee_id' => 1,
                'readiness_level' => 'Advanced',
                'development_plan' => 'Senior Developer Role Requirements',
                'timeline_for_readiness' => 'Ready',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'role_id' => 2,
                'employee_id' => 2,
                'readiness_level' => 'Advanced',
                'development_plan' => 'Marketing Manager Role Requirements',
                'timeline_for_readiness' => 'Ready',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($jobRoles as $role) {
            DB::table('succession_planning')->updateOrInsert(
                ['id' => $role['id']],
                $role
            );
        }

        // Seed competencies
        $competencies = [
            // John Doe's competencies
            [
                'id' => 1,
                'employee_id' => 1,
                'role_id' => 1,
                'role_name' => 'Senior Developer',
                'competency_id' => 1,
                'competency_name' => 'JavaScript',
                'competency_type' => 'Technical',
                'competency_level' => 90,
                'last_assessed_date' => '2025-09-15',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'employee_id' => 1,
                'role_id' => 1,
                'role_name' => 'Senior Developer',
                'competency_id' => 2,
                'competency_name' => 'React',
                'competency_type' => 'Technical',
                'competency_level' => 85,
                'last_assessed_date' => '2025-09-10',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 3,
                'employee_id' => 1,
                'role_id' => 1,
                'role_name' => 'Senior Developer',
                'competency_id' => 3,
                'competency_name' => 'Node.js',
                'competency_type' => 'Technical',
                'competency_level' => 70,
                'last_assessed_date' => '2025-09-05',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'employee_id' => 1,
                'role_id' => 1,
                'role_name' => 'Senior Developer',
                'competency_id' => 4,
                'competency_name' => 'Leadership',
                'competency_type' => 'Soft Skill',
                'competency_level' => 40,
                'last_assessed_date' => '2025-08-20',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            // Jane Smith's competencies
            [
                'id' => 5,
                'employee_id' => 2,
                'role_id' => 2,
                'role_name' => 'Marketing Manager',
                'competency_id' => 5,
                'competency_name' => 'Digital Marketing',
                'competency_type' => 'Marketing',
                'competency_level' => 88,
                'last_assessed_date' => '2025-09-12',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 6,
                'employee_id' => 2,
                'role_id' => 2,
                'role_name' => 'Marketing Manager',
                'competency_id' => 6,
                'competency_name' => 'Project Management',
                'competency_type' => 'Management',
                'competency_level' => 82,
                'last_assessed_date' => '2025-09-10',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 7,
                'employee_id' => 2,
                'role_id' => 2,
                'role_name' => 'Marketing Manager',
                'competency_id' => 7,
                'competency_name' => 'Communication',
                'competency_type' => 'Soft Skill',
                'competency_level' => 95,
                'last_assessed_date' => '2025-09-08',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 8,
                'employee_id' => 2,
                'role_id' => 2,
                'role_name' => 'Marketing Manager',
                'competency_id' => 8,
                'competency_name' => 'Data Analysis',
                'competency_type' => 'Technical',
                'competency_level' => 65,
                'last_assessed_date' => '2025-09-05',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($competencies as $competency) {
            DB::table('competency_management')->updateOrInsert(
                ['id' => $competency['id']],
                $competency
            );
        }

        // Seed assessments (using learning_management table for assessments)
        $assessments = [
            [
                'id' => 1,
                'employee_id' => 1,
                'title' => 'Manager Evaluation - John Doe',
                'description' => 'Manager Evaluation assessment for John Doe',
                'status' => 'Completed',
                'progress' => 100,
                'completion_date' => '2025-09-15',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'employee_id' => 1,
                'title' => 'Self Assessment - John Doe',
                'description' => 'Self Assessment for John Doe',
                'status' => 'Completed',
                'progress' => 100,
                'completion_date' => '2025-09-10',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($assessments as $assessment) {
            DB::table('learning_management')->updateOrInsert(
                ['id' => $assessment['id']],
                $assessment
            );
        }

        // Seed recommendations (using training_management table)
        $recommendations = [
            [
                'id' => 1,
                'employee_id' => 1,
                'program_name' => 'Leadership Development Program',
                'provider' => 'Internal Training',
                'duration' => '3 months',
                'target_skills' => 'Leadership, Team Management',
                'status' => 'Recommended',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'employee_id' => 1,
                'program_name' => 'Team Lead Position',
                'provider' => 'Internal Promotion',
                'duration' => '6 months',
                'target_skills' => 'Leadership, Management',
                'status' => 'Recommended',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($recommendations as $recommendation) {
            DB::table('training_management')->updateOrInsert(
                ['id' => $recommendation['id']],
                $recommendation
            );
        }
    }
}