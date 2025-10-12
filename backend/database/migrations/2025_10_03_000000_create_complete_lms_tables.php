<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Course Catalog Table
        Schema::create('lms_courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category');
            $table->string('level')->default('Beginner'); // Beginner, Intermediate, Advanced
            $table->string('duration');
            $table->decimal('rating', 2, 1)->default(0.0);
            $table->integer('enrolled_count')->default(0);
            $table->json('tags')->nullable();
            $table->json('prerequisites')->nullable(); // Array of course IDs
            $table->json('enrolled_users')->nullable(); // Array of user IDs
            $table->string('instructor')->nullable();
            $table->text('content_url')->nullable();
            $table->enum('status', ['active', 'inactive', 'draft'])->default('active');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->index(['category', 'level', 'status']);
            $table->index('created_by');
        });

        // Learning Plans Table
        Schema::create('lms_learning_plans', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->json('courses'); // Array of course IDs
            $table->date('due_date')->nullable();
            $table->integer('estimated_hours')->nullable();
            $table->enum('status', ['active', 'completed', 'overdue', 'draft'])->default('active');
            $table->json('assigned_users')->nullable(); // Array of user IDs
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->index('status');
            $table->index('created_by');
            $table->index('due_date');
        });

        // Learning Progress Table
        Schema::create('lms_learning_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('course_id');
            $table->string('course_title');
            $table->enum('source', ['direct', 'learning_plan'])->default('direct');
            $table->unsignedBigInteger('source_id')->nullable(); // Learning plan ID if source is learning_plan
            $table->date('enrollment_date');
            $table->integer('progress')->default(0); // Percentage 0-100
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'overdue'])->default('not_started');
            $table->timestamp('last_accessed')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('course_id')->references('id')->on('lms_courses')->onDelete('cascade');
            $table->unique(['user_id', 'course_id']);
            $table->index(['user_id', 'status']);
            $table->index('course_id');
        });

        // Course Modules Table (for detailed course structure)
        Schema::create('lms_course_modules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->string('type')->default('lesson'); // lesson, quiz, assignment, video
            $table->text('content_url')->nullable();
            $table->integer('duration_minutes')->default(0);
            $table->boolean('is_required')->default(true);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            
            $table->foreign('course_id')->references('id')->on('lms_courses')->onDelete('cascade');
            $table->index(['course_id', 'order']);
        });

        // User Module Progress Table
        Schema::create('lms_module_progress', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('module_id');
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
            $table->integer('progress')->default(0); // Percentage 0-100
            $table->decimal('score', 5, 2)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('course_id')->references('id')->on('lms_courses')->onDelete('cascade');
            $table->foreign('module_id')->references('id')->on('lms_course_modules')->onDelete('cascade');
            $table->unique(['user_id', 'module_id']);
            $table->index(['user_id', 'course_id']);
        });

        // Feedback Table
        Schema::create('lms_feedback', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('course_id');
            $table->integer('rating')->unsigned()->min(1)->max(5);
            $table->text('feedback_text')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            // Ensure one feedback per user per course
            $table->unique(['user_id', 'course_id']);
            $table->foreign('course_id')->references('id')->on('lms_courses')->onDelete('cascade');
        });

        // Insert Sample Data
        // $this->insertSampleData();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lms_feedback');
        Schema::dropIfExists('lms_module_progress');
        Schema::dropIfExists('lms_course_modules');
        Schema::dropIfExists('lms_learning_progress');
        Schema::dropIfExists('lms_learning_plans');
        Schema::dropIfExists('lms_courses');
    }
};