<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SuccessionPlanningSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed additional employees for succession planning
        $successionEmployees = [
            [
                'id' => 3,
                'auth_user_id' => 3,
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'department' => 'Operations',
                'position' => 'Senior Manager',
                'email' => 'sarah.johnson@company.com',
                'hire_date' => '2022-03-15',
                'employee_status' => 'Active',
                'profile_photo_url' => 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'auth_user_id' => 4,
                'first_name' => 'Michael',
                'last_name' => 'Chen',
                'department' => 'Technology',
                'position' => 'Team Lead',
                'email' => 'michael.chen@company.com',
                'hire_date' => '2023-01-10',
                'employee_status' => 'Active',
                'profile_photo_url' => 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 5,
                'auth_user_id' => 5,
                'first_name' => 'Emily',
                'last_name' => 'Rodriguez',
                'department' => 'Marketing',
                'position' => 'Assistant Manager',
                'email' => 'emily.rodriguez@company.com',
                'hire_date' => '2023-06-20',
                'employee_status' => 'Active',
                'profile_photo_url' => 'https://img.icons8.com/?size=100&id=LREuj015njcj&format=png&color=000000',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($successionEmployees as $employee) {
            DB::table('employee_self_service')->updateOrInsert(
                ['id' => $employee['id']],
                $employee
            );
        }

        // Seed succession planning data (talent pool and leadership pipeline)
        $successionData = [
            // Talent Pool Data
            [
                'id' => 3,
                'role_id' => 1,
                'employee_id' => 3,
                'readiness_level' => 'Ready Now',
                'development_plan' => 'Executive Leadership Track - Strategic Thinking, Team Leadership, Change Management',
                'timeline_for_readiness' => 'Immediate',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'role_id' => 2,
                'employee_id' => 4,
                'readiness_level' => '1-2 years',
                'development_plan' => 'Technical Leadership Track - Technical Excellence, Innovation, Problem Solving',
                'timeline_for_readiness' => '18 months',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 5,
                'role_id' => 3,
                'employee_id' => 5,
                'readiness_level' => '3+ years',
                'development_plan' => 'Marketing Leadership Track - Creativity, Market Analysis, Campaign Management',
                'timeline_for_readiness' => '3 years',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($successionData as $data) {
            DB::table('succession_planning')->updateOrInsert(
                ['id' => $data['id']],
                $data
            );
        }

        // Seed development plans (using learning_management table)
        $developmentPlans = [
            [
                'id' => 3,
                'employee_id' => 3,
                'title' => 'Executive Leadership Development Plan',
                'description' => 'Comprehensive leadership development for CEO succession',
                'status' => 'In Progress',
                'progress' => 65,
                'due_date' => '2025-12-31',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'employee_id' => 4,
                'title' => 'Technical Leadership Development Plan',
                'description' => 'Technical leadership track for IT management roles',
                'status' => 'In Progress',
                'progress' => 40,
                'due_date' => '2026-06-30',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($developmentPlans as $plan) {
            DB::table('learning_management')->updateOrInsert(
                ['id' => $plan['id']],
                $plan
            );
        }

        // Seed training programs for development (using training_management table)
        $trainingPrograms = [
            [
                'id' => 3,
                'employee_id' => 3,
                'program_name' => 'Strategic Leadership Program',
                'provider' => 'Internal Training',
                'duration' => '3 months',
                'target_skills' => 'Strategic Thinking, Financial Acumen, Board Relations',
                'status' => 'Completed',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'employee_id' => 3,
                'program_name' => 'Executive Coaching Sessions',
                'provider' => 'External Coach',
                'duration' => '6 months',
                'target_skills' => 'Leadership, Change Management',
                'status' => 'In Progress',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 5,
                'employee_id' => 4,
                'program_name' => 'People Management Certification',
                'provider' => 'Internal Training',
                'duration' => '2 months',
                'target_skills' => 'Team Leadership, Communication',
                'status' => 'In Progress',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        foreach ($trainingPrograms as $program) {
            DB::table('training_management')->updateOrInsert(
                ['id' => $program['id']],
                $program
            );
        }
    }
}