<?php

use Ernestdefoe\Marquee\Api\MediaResource;
use Ernestdefoe\Shelf\Access\OwnerPolicy;
use Ernestdefoe\Shelf\Api;
use Ernestdefoe\Shelf\Entry;
use Ernestdefoe\Shelf\Search;
use Ernestdefoe\Shelf\ShelfServiceProvider;
use Ernestdefoe\Shelf\ShelfList;
use Flarum\Api\Resource\DiscussionResource;
use Flarum\Api\Resource\ForumResource;
use Flarum\Extend;
use Flarum\Search\Database\DatabaseSearchDriver;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->jsDirectory(__DIR__.'/js/dist/forum')
        ->css(__DIR__.'/less/forum.less')
        ->route('/shelf', 'shelf.top')
        ->route('/shelf/lists/{id:\d+}', 'shelf.list')
        ->route('/u/{username}/shelf', 'user.shelf'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    new Extend\Locales(__DIR__.'/locale'),

    new Extend\ApiResource(Api\EntryResource::class),
    new Extend\ApiResource(Api\ListResource::class),

    (new Extend\ApiResource(MediaResource::class))
        ->fields(Api\MediaFields::class),

    (new Extend\ApiResource(DiscussionResource::class))
        ->endpoint(['show', 'update'], Api\PrimeShelfStats::class),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(Api\ForumFields::class),

    (new Extend\ServiceProvider())
        ->register(ShelfServiceProvider::class),

    (new Extend\Routes('api'))
        ->get('/shelf/top', 'shelf.api.top', Api\TopRatedController::class),

    (new Extend\SearchDriver(DatabaseSearchDriver::class))
        ->addSearcher(Entry::class, Search\EntrySearcher::class)
        ->addFilter(Search\EntrySearcher::class, Search\Filter\EntryUserFilter::class)
        ->addFilter(Search\EntrySearcher::class, Search\Filter\EntryMediaFilter::class)
        ->addFilter(Search\EntrySearcher::class, Search\Filter\EntryStatusFilter::class)
        ->addSearcher(ShelfList::class, Search\ListSearcher::class)
        ->addFilter(Search\ListSearcher::class, Search\Filter\ListUserFilter::class),

    (new Extend\Policy())
        ->modelPolicy(Entry::class, OwnerPolicy::class)
        ->modelPolicy(ShelfList::class, OwnerPolicy::class),

    (new Extend\Settings())
        ->default('ernestdefoe-shelf.min_ratings', 2),
];
