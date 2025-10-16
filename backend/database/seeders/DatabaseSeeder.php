<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            LMS_seeder::class,
            TMS_seeder::class,
            CompetencyManagementSeeder::class,
            SuccessionPlanningSeeder::class,
        ]);
    }
}