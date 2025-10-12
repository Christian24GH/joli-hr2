<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->text('meeting_link')->nullable()->after('content_url'); // Zoom/Google Meet link
            $table->text('assessment_link')->nullable()->after('meeting_link'); // Google Forms assessment link
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lms_courses', function (Blueprint $table) {
            $table->dropColumn(['meeting_link', 'assessment_link']);
        });
    }
};
