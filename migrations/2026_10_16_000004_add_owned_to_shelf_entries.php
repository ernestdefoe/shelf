<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->table('shelf_entries', function (Blueprint $table) {
            // In the member's collection: owned, whatever they've watched or rated.
            $table->boolean('owned')->default(false);
            $table->index(['user_id', 'owned']);
        });
    },
    'down' => function (Builder $schema) {
        $schema->table('shelf_entries', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'owned']);
            $table->dropColumn('owned');
        });
    },
];
