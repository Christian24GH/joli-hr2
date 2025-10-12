<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LMSCourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            [
                'title' => 'Introduction to Customer Service',
                'description' => 'Learn the fundamentals of excellent customer service and communication skills.',
                'category' => 'Soft Skills',
                'level' => 'Beginner',
                'duration' => '2 hours',
                'rating' => 4.5,
                'enrolled_count' => 25,
                'tags' => json_encode(['communication', 'customer-service', 'soft-skills']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Sarah Johnson',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Advanced Travel Booking Systems',
                'description' => 'Master the advanced features of our travel booking platform and reservation management.',
                'category' => 'Technical',
                'level' => 'Intermediate',
                'duration' => '4 hours',
                'rating' => 4.8,
                'enrolled_count' => 18,
                'tags' => json_encode(['travel', 'booking', 'technical', 'systems']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Mike Chen',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Leadership and Team Management',
                'description' => 'Develop essential leadership skills and learn how to effectively manage teams.',
                'category' => 'Leadership',
                'level' => 'Advanced',
                'duration' => '6 hours',
                'rating' => 4.7,
                'enrolled_count' => 12,
                'tags' => json_encode(['leadership', 'management', 'team-building']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Dr. Emily Rodriguez',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Safety and Compliance Training',
                'description' => 'Essential safety protocols and compliance requirements for travel industry operations.',
                'category' => 'Compliance',
                'level' => 'Beginner',
                'duration' => '3 hours',
                'rating' => 4.6,
                'enrolled_count' => 35,
                'tags' => json_encode(['safety', 'compliance', 'regulations']),
                'prerequisites' => json_encode([]),
                'enrolled_users' => json_encode([]),
                'instructor' => 'Robert Williams',
                'status' => 'active',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('lms_courses')->insert($courses);
    }
}
