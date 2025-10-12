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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
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