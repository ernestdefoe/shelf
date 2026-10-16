<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->create('shelf_lists', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedInteger('item_count')->default(0);
            // The first four posters, kept with the list so list cards cost nothing.
            $table->json('preview')->nullable();
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->index(['user_id', 'updated_at']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        $schema->create('shelf_list_items', function (Blueprint $table) {
            $table->unsignedInteger('list_id');
            $table->unsignedInteger('media_id');
            $table->unsignedInteger('position')->default(0);
            $table->dateTime('created_at');

            $table->primary(['list_id', 'media_id']);
            $table->index(['list_id', 'position']);
            $table->foreign('list_id')->references('id')->on('shelf_lists')->cascadeOnDelete();
            $table->foreign('media_id')->references('id')->on('marquee_media')->cascadeOnDelete();
        });
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('shelf_list_items');
        $schema->dropIfExists('shelf_lists');
    },
];
