<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LMS_seeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            [
                'id' => 1,
                'title' => 'Course 1',
                'description' => 'Testing Course 1',
                'objectives' => 'Test',
                'category' => 'Management',
                'level' => 'Beginner',
                'schedule_date' => Carbon::now()->addDays(7)->toDateTimeString(),
                'duration' => '4 weeks',
                'rating' => 4.5,
                'enrolled_count' => 11,
                'tags' => json_encode(['project management', 'planning', 'leadership']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([2]),
                'instructor' => 'Test Instructor',
                'content_url' => 'https://example.com/course1',
                'meeting_link' => 'https://meet.google.com/123-4567-8901',
                'assessment_link' => 'https://forms.google.com/456789123',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'title' => 'Course 2',
                'description' => 'Testing Course 2',
                'objectives' => 'Test',
                'category' => 'Management',
                'level' => 'Intermediate',
                'schedule_date' => Carbon::now()->addDays(7)->toDateTimeString(),
                'duration' => '4 weeks',
                'rating' => 4.5,
                'enrolled_count' => 11,
                'tags' => json_encode(['project management', 'planning', 'leadership']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([2]),
                'instructor' => 'Test Instructor',
                'content_url' => 'https://example.com/course1',
                'meeting_link' => 'https://meet.google.com/123-4567-8901',
                'assessment_link' => 'https://forms.google.com/456789123',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 3,
                'title' => 'Course 3',
                'description' => 'Testing Course 3',
                'objectives' => 'Test',
                'category' => 'Technical',
                'level' => 'Beginner',
                'schedule_date' => Carbon::now()->addDays(7)->toDateTimeString(),
                'duration' => '4 weeks',
                'rating' => 4.5,
                'enrolled_count' => 11,
                'tags' => json_encode(['project management', 'planning', 'leadership']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Test Instructor',
                'content_url' => 'https://example.com/course1',
                'meeting_link' => 'https://meet.google.com/123-4567-8901',
                'assessment_link' => 'https://forms.google.com/456789123',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'title' => 'Course 4',
                'description' => 'Testing Course 4',
                'objectives' => 'Test',
                'category' => 'Technical',
                'level' => 'Intermediate',
                'schedule_date' => Carbon::now()->addDays(7)->toDateTimeString(),
                'duration' => '4 weeks',
                'rating' => 4.5,
                'enrolled_count' => 11,
                'tags' => json_encode(['project management', 'planning', 'leadership']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Test Instructor',
                'content_url' => 'https://example.com/course1',
                'meeting_link' => 'https://meet.google.com/123-4567-8901',
                'assessment_link' => 'https://forms.google.com/456789123',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 5,
                'title' => 'Course 5',
                'description' => 'Testing Course 5',
                'objectives' => 'Test',
                'category' => 'Leadership',
                'level' => 'Advanced',
                'schedule_date' => Carbon::now()->addDays(7)->toDateTimeString(),
                'duration' => '4 weeks',
                'rating' => 4.5,
                'enrolled_count' => 11,
                'tags' => json_encode(['project management', 'planning', 'leadership']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Test Instructor',
                'content_url' => 'https://example.com/course1',
                'meeting_link' => 'https://meet.google.com/123-4567-8901',
                'assessment_link' => 'https://forms.google.com/456789123',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];
        DB::table('lms_courses')->insert($courses);

        $learningPlans = [
            [
                'id' => 1,
                'title' => 'Learning Plan 1',
                'description' => 'Testing Learning Plan 1 (Management)',
                'courses' => json_encode([1, 2]),
                'due_date' => Carbon::now()->addMonths(3)->toDateString(),
                'estimated_hours' => 60,
                'status' => 'active',
                'assigned_users' => json_encode([2]),
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'title' => 'Learning Plan 2',
                'description' => 'Testing Learning Plan 2 (Technical)',
                'courses' => json_encode([3, 4]),
                'due_date' => Carbon::now()->addMonths(3)->toDateString(),
                'estimated_hours' => 20,
                'status' => 'active',
                'assigned_users' => json_encode([]),
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];
        DB::table('lms_learning_plans')->insert($learningPlans);

        $progress = [
            // Sample learning progress data
            [
                'id' => 1,
                'user_id' => 2,
                'course_id' => 1,
                'course_title' => 'Course 1',
                'source' => 'learning_plan',
                'source_id' => 1,
                'enrollment_date' => Carbon::now()->subDays(10)->toDateString(),
                'progress' => 50,
                'status' => 'in_progress',
                'last_accessed' => Carbon::now()->subDays(1)->toDateTimeString(),
                'score' => null,
                'grade' => null,
                'certificate_url' => null,
                'created_at' => Carbon::now()->subDays(10),
                'updated_at' => Carbon::now()->subDays(1)
            ],
            [
                'id' => 2,
                'user_id' => 2,
                'course_id' => 2,
                'course_title' => 'Course 2',
                'source' => 'learning_plan',
                'source_id' => 1,
                'enrollment_date' => Carbon::now()->subDays(5)->toDateString(),
                'progress' => 20,
                'status' => 'in_progress',
                'last_accessed' => Carbon::now()->subDays(2)->toDateTimeString(),
                'score' => null,
                'grade' => null,
                'certificate_url' => null,
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(2)
            ]
        ];
        DB::table('lms_learning_progress')->insert($progress);

        $this->command->info('LMS data has been seeded successfully!');
    }
}