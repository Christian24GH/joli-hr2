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
        // Add detailed fields to training_management table if they don't exist
        Schema::table('training_management', function (Blueprint $table) {
            if (!Schema::hasColumn('training_management', 'description')) {
                $table->text('description')->nullable()->after('provider');
            }
            if (!Schema::hasColumn('training_management', 'objectives')) {
                $table->text('objectives')->nullable()->after('description');
            }
            if (!Schema::hasColumn('training_management', 'trainer')) {
                $table->string('trainer')->nullable()->after('objectives');
            }
            if (!Schema::hasColumn('training_management', 'prerequisites')) {
                $table->text('prerequisites')->nullable()->after('trainer');
            }
            if (!Schema::hasColumn('training_management', 'start_date')) {
                $table->dateTime('start_date')->nullable()->after('prerequisites');
            }
            if (!Schema::hasColumn('training_management', 'end_date')) {
                $table->dateTime('end_date')->nullable()->after('start_date');
            }
            if (!Schema::hasColumn('training_management', 'max_participants')) {
                $table->integer('max_participants')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('training_management', 'location')) {
                $table->string('location')->nullable()->after('max_participants');
            }
            if (!Schema::hasColumn('training_management', 'enrolled_count')) {
                $table->integer('enrolled_count')->default(0)->after('location');
            }
            if (!Schema::hasColumn('training_management', 'training_type')) {
                $table->enum('training_type', ['Online', 'In-Person', 'Hybrid', 'Self-paced'])->default('In-Person')->after('enrolled_count');
            }
            if (!Schema::hasColumn('training_management', 'difficulty')) {
                $table->enum('difficulty', ['Beginner', 'Intermediate', 'Advanced'])->default('Beginner')->after('training_type');
            }
            if (!Schema::hasColumn('training_management', 'format')) {
                $table->string('format')->default('In-Person')->after('difficulty');
            }
            if (!Schema::hasColumn('training_management', 'topic')) {
                $table->string('topic')->nullable()->after('format');
            }
            if (!Schema::hasColumn('training_management', 'rating')) {
                $table->decimal('rating', 3, 2)->default(0.00)->after('topic');
            }
        });

        // Training Applications Table
        if (!Schema::hasTable('training_applications')) {
            Schema::create('training_applications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('training_id');
                $table->unsignedBigInteger('employee_id');
                $table->string('status')->default('applied'); // applied, approved, rejected, cancelled
                $table->text('notes')->nullable();
                $table->date('preferred_start_date')->nullable();
                $table->text('manager_approval_notes')->nullable();
                $table->timestamp('manager_approved_at')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamps();

                $table->foreign('training_id')->references('id')->on('training_management')->onDelete('cascade');
                // $table->foreign('employee_id')->references('id')->on('employee_self_service')->onDelete('cascade');
                // $table->foreign('approved_by')->references('id')->on('employee_self_service')->onDelete('set null');

                $table->index(['status', 'employee_id']);
                $table->index(['training_id', 'status']);
            });
        }

        // Training Completions Table
        if (!Schema::hasTable('training_completions')) {
            Schema::create('training_completions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->unsignedBigInteger('training_id');
                $table->unsignedBigInteger('application_id')->nullable();
                $table->date('completion_date');
                $table->decimal('score_percentage', 5, 2)->nullable();
                $table->string('grade')->nullable(); // A, B, C, D, F
                $table->text('completion_notes')->nullable();
                $table->boolean('certificate_issued')->default(false);
                $table->json('competencies_gained')->nullable();
                $table->timestamps();

                // $table->foreign('employee_id')->references('id')->on('employee_self_service')->onDelete('set null');
                $table->foreign('training_id')->references('id')->on('training_management');
                $table->foreign('application_id')->references('id')->on('training_applications');

                $table->index(['employee_id', 'completion_date']);
                $table->index(['training_id', 'completion_date']);
            });
        }

        // Training Certificates Table
        if (!Schema::hasTable('training_certificates')) {
            Schema::create('training_certificates', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('completion_id');
                $table->unsignedBigInteger('employee_id');
                $table->unsignedBigInteger('training_id');
                $table->string('certificate_number')->unique();
                $table->date('issue_date');
                $table->date('expiry_date')->nullable();
                $table->string('certificate_file_path')->nullable();
                $table->string('certificate_url')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('completion_id')->references('id')->on('training_completions')->onDelete('cascade');
                // $table->foreign('employee_id')->references('id')->on('employee_self_service');
                $table->foreign('training_id')->references('id')->on('training_management');

                $table->index(['employee_id', 'is_active']);
                $table->index(['certificate_number']);
            });
        }

        // Training Feedback Table
        if (!Schema::hasTable('training_feedback')) {
            Schema::create('training_feedback', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('training_application_id');
                $table->unsignedBigInteger('employee_id');
                $table->unsignedBigInteger('training_id');

                // Rating fields (1-5 scale)
                $table->integer('overall_rating')->nullable();
                $table->integer('content_quality')->nullable();
                $table->integer('trainer_effectiveness')->nullable();
                $table->integer('material_usefulness')->nullable();
                $table->integer('facilities_rating')->nullable();

                // Text feedback
                $table->text('strengths')->nullable();
                $table->text('areas_for_improvement')->nullable();
                $table->text('additional_comments')->nullable();

                // Would recommend
                $table->boolean('would_recommend')->nullable();

                // Learning outcomes
                $table->json('learning_outcomes')->nullable();
                $table->text('future_application')->nullable();

                $table->timestamps();

                $table->foreign('training_application_id')->references('id')->on('training_applications')->onDelete('cascade');
                // $table->foreign('employee_id')->references('id')->on('employee_self_service');
                $table->foreign('training_id')->references('id')->on('training_management');

                $table->index(['training_id', 'overall_rating']);
                $table->index(['employee_id']);
            });
        }

        // Remove foreign key constraints on employee_id fields to prevent issues with employee data
        // This allows the system to work even if employee records are moved or deleted

        // Check and drop foreign key constraint on training_applications.employee_id
        $constraintExists = DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'training_applications'
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND CONSTRAINT_NAME = 'training_applications_employee_id_foreign'
        ");

        if (!empty($constraintExists)) {
            Schema::table('training_applications', function (Blueprint $table) {
                $table->dropForeign(['employee_id']);
            });
        }

        // Check and drop foreign key constraint on training_completions.employee_id
        $constraintExists = DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'training_completions'
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND CONSTRAINT_NAME = 'training_completions_employee_id_foreign'
        ");

        if (!empty($constraintExists)) {
            Schema::table('training_completions', function (Blueprint $table) {
                $table->dropForeign(['employee_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order to handle foreign key constraints
        Schema::dropIfExists('training_feedback');
        Schema::dropIfExists('training_certificates');
        Schema::dropIfExists('training_completions');
        Schema::dropIfExists('training_applications');

        // Remove added columns from training_management table
        Schema::table('training_management', function (Blueprint $table) {
            $columns = [
                'description', 'objectives', 'trainer', 'prerequisites',
                'start_date', 'end_date', 'max_participants', 'location', 'enrolled_count',
                'training_type', 'difficulty', 'format', 'topic', 'rating'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('training_management', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
