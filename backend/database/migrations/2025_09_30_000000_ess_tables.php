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
        // ===========================================
        // EMPLOYEE SELF SERVICE TABLES
        // ===========================================

        // Modify employee_self_service table
        Schema::table('employee_self_service', function (Blueprint $table) {
            // Add auth_user_id column with index
            if (!Schema::hasColumn('employee_self_service', 'auth_user_id')) {
                $table->unsignedBigInteger('auth_user_id')->nullable()->after('id');
                $table->index('auth_user_id');
            }

            // Make department and position nullable
            $table->string('department')->nullable()->change();
            $table->string('position')->nullable()->change();

            // Make hire_date nullable
            $table->date('hire_date')->nullable()->change();
        });

        // Add admin fields to leave_requests table
        Schema::table('leave_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('leave_requests', 'admin_notes')) {
                $table->text('admin_notes')->nullable()->after('status');
            }
            if (!Schema::hasColumn('leave_requests', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('admin_notes');
            }
            if (!Schema::hasColumn('leave_requests', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
        });

        // Create timesheet_adjustments table (only if it doesn't exist)
        if (!Schema::hasTable('timesheet_adjustments')) {
            Schema::create('timesheet_adjustments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->date('date');
                $table->time('new_time_in');
                $table->time('new_time_out');
                $table->text('reason');
                $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
                $table->text('admin_notes')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamps();

                $table->foreign('employee_id')->references('id')->on('employee_self_service')->onDelete('cascade');
                $table->foreign('approved_by')->references('id')->on('employee_self_service')->onDelete('set null');
            });
        }

        // Create reimbursements table (only if it doesn't exist)
        if (!Schema::hasTable('reimbursements')) {
            Schema::create('reimbursements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->string('type');
                $table->decimal('amount', 10, 2);
                $table->date('date');
                $table->text('description');
                $table->string('receipt_path')->nullable();
                $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
                $table->text('admin_notes')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->timestamps();

                $table->foreign('employee_id')->references('id')->on('employee_self_service')->onDelete('cascade');
                $table->foreign('approved_by')->references('id')->on('employee_self_service')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop reimbursements table
        Schema::dropIfExists('reimbursements');

        // Drop timesheet_adjustments table
        Schema::dropIfExists('timesheet_adjustments');

        // Remove admin fields from leave_requests table
        Schema::table('leave_requests', function (Blueprint $table) {
            if (Schema::hasColumn('leave_requests', 'admin_notes')) {
                $table->dropColumn('admin_notes');
            }
            if (Schema::hasColumn('leave_requests', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('leave_requests', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
        });

        // Revert employee_self_service table changes
        Schema::table('employee_self_service', function (Blueprint $table) {
            // Remove auth_user_id column and index
            if (Schema::hasColumn('employee_self_service', 'auth_user_id')) {
                $table->dropIndex(['auth_user_id']);
                $table->dropColumn('auth_user_id');
            }

            // Make department and position non-nullable
            $table->string('department')->nullable(false)->change();
            $table->string('position')->nullable(false)->change();

            // Make hire_date non-nullable
            $table->date('hire_date')->nullable(false)->change();
        });
    }
};