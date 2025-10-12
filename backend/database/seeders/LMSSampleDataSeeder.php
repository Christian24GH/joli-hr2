<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LMSSampleDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert sample courses
        $courses = [
            [
                'id' => 1,
                'title' => 'Introduction to Project Management',
                'description' => 'Learn the fundamentals of project management including planning, execution, and monitoring.',
                'category' => 'Management',
                'level' => 'Beginner',
                'duration' => '4 weeks',
                'rating' => 4.5,
                'enrolled_count' => 25,
                'tags' => json_encode(['project management', 'planning', 'leadership']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([1, 2, 3]),
                'instructor' => 'John Smith',
                'content_url' => 'https://example.com/course1',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'title' => 'Advanced Excel Skills',
                'description' => 'Master advanced Excel functions, pivot tables, and data analysis techniques.',
                'category' => 'Technical Skills',
                'level' => 'Intermediate',
                'duration' => '3 weeks',
                'rating' => 4.8,
                'enrolled_count' => 35,
                'tags' => json_encode(['excel', 'data analysis', 'spreadsheets']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([1, 4, 5]),
                'instructor' => 'Sarah Johnson',
                'content_url' => 'https://example.com/course2',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 3,
                'title' => 'Communication Skills for Leaders',
                'description' => 'Develop effective communication strategies for leadership and team management.',
                'category' => 'Soft Skills',
                'level' => 'Intermediate',
                'duration' => '2 weeks',
                'rating' => 4.6,
                'enrolled_count' => 18,
                'tags' => json_encode(['communication', 'leadership', 'soft skills']),
                'prerequisites' => json_encode([1]),
                'enrolled_users' => json_encode([1, 2]),
                'instructor' => 'Michael Brown',
                'content_url' => 'https://example.com/course3',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 4,
                'title' => 'Digital Marketing Fundamentals',
                'description' => 'Learn the basics of digital marketing including SEO, social media, and content marketing.',
                'category' => 'Marketing',
                'level' => 'Beginner',
                'duration' => '5 weeks',
                'rating' => 4.3,
                'enrolled_count' => 42,
                'tags' => json_encode(['digital marketing', 'SEO', 'social media']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([3, 4, 5]),
                'instructor' => 'Lisa Davis',
                'content_url' => 'https://example.com/course4',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        DB::table('lms_courses')->insert($courses);

        // Insert sample learning plans
        $learningPlans = [
            [
                'id' => 1,
                'title' => 'Management Development Path',
                'description' => 'Comprehensive plan to develop management and leadership skills.',
                'courses' => json_encode([1, 3]),
                'due_date' => Carbon::now()->addMonths(3)->toDateString(),
                'estimated_hours' => 40,
                'status' => 'active',
                'assigned_users' => json_encode([1, 2]),
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'title' => 'Technical Skills Enhancement',
                'description' => 'Improve technical proficiency for better job performance.',
                'courses' => json_encode([2]),
                'due_date' => Carbon::now()->addMonths(2)->toDateString(),
                'estimated_hours' => 20,
                'status' => 'active',
                'assigned_users' => json_encode([1, 4, 5]),
                'created_by' => 1,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        DB::table('lms_learning_plans')->insert($learningPlans);

        // Insert sample learning progress
        $progress = [
            [
                'id' => 1,
                'user_id' => 1,
                'course_id' => 1,
                'course_title' => 'Introduction to Project Management',
                'source' => 'learning_plan',
                'source_id' => 1,
                'enrollment_date' => Carbon::now()->subWeeks(2)->toDateString(),
                'progress' => 75,
                'status' => 'in_progress',
                'last_accessed' => Carbon::now()->subDays(1),
                'score' => null,
                'notes' => 'Great progress so far!',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 2,
                'user_id' => 1,
                'course_id' => 2,
                'course_title' => 'Advanced Excel Skills',
                'source' => 'learning_plan',
                'source_id' => 2,
                'enrollment_date' => Carbon::now()->subWeeks(3)->toDateString(),
                'progress' => 100,
                'status' => 'completed',
                'last_accessed' => Carbon::now()->subDays(3),
                'score' => 92.5,
                'notes' => 'Excellent completion!',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'id' => 3,
                'user_id' => 1,
                'course_id' => 3,
                'course_title' => 'Communication Skills for Leaders',
                'source' => 'direct',
                'source_id' => null,
                'enrollment_date' => Carbon::now()->subDays(5)->toDateString(),
                'progress' => 25,
                'status' => 'in_progress',
                'last_accessed' => Carbon::now()->subHours(6),
                'score' => null,
                'notes' => 'Just started, looking forward to learning more.',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        DB::table('lms_learning_progress')->insert($progress);

        // Insert sample feedback
        $feedback = [
            [
                'id' => 1,
                'user_id' => 1,
                'course_id' => 2,
                'rating' => 5,
                'feedback_text' => 'Excellent course! Very practical and well-structured.',
                'submitted_at' => Carbon::now()->subDays(3),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        DB::table('lms_feedback')->insert($feedback);

        $this->command->info('LMS sample data has been seeded successfully!');
    }
}