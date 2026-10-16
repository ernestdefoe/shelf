<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->create('shelf_entries', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('media_id');
            // Half stars: 1 = ½★ … 10 = ★★★★★.
            $table->unsignedTinyInteger('rating')->nullable();
            // want = on the shelf to get to; done = watched / read / played / listened.
            $table->string('status', 8)->nullable();
            $table->date('done_on')->nullable();
            $table->dateTime('rated_at')->nullable();
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->unique(['user_id', 'media_id']);
            $table->index(['user_id', 'updated_at']);
            $table->index(['rated_at', 'media_id']);
            $table->index(['media_id', 'rating']);

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('media_id')->references('id')->on('marquee_media')->cascadeOnDelete();
        });
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('shelf_entries');
    },
];
