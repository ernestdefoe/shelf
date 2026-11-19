<?php

namespace Ernestdefoe\Shelf\Api;

use Ernestdefoe\Marquee\Media;
use Ernestdefoe\Shelf\DiscussionLinks;
use Ernestdefoe\Shelf\ShelfStats;
use Flarum\Api\Context;
use Flarum\Api\Resource\DiscussionResource;
use Flarum\Api\Schema;

/**
 * The members' rating and the viewer's own entry, on the titles a discussion
 * page shows (PrimeShelfStats loads them together); never on the discussion
 * list, so that costs nothing extra.
 */
class MediaFields
{
    public function __construct(private DiscussionLinks $links, private ShelfStats $stats)
    {
    }

    public function __invoke(): array
    {
        $onCard = fn (Media $media, Context $context) => $context->showing(DiscussionResource::class) || $context->updating(DiscussionResource::class);

        return [
            Schema\Arr::make('shelf')
                ->visible($onCard)
                ->get(fn (Media $media, Context $context) => $this->stats->for($context->getActor(), $media->id)),

            // Where a title on a shelf or list links to. The resource loads these
            // for every title on the page together (two queries) before serialising.
            Schema\Str::make('shelfSlug')
                ->nullable()
                ->visible(fn (Media $media, Context $context) => $context->listing(EntryResource::class) || $context->showing(ListResource::class))
                ->get(fn (Media $media, Context $context) => $this->links->slugFor($context, $media->id)),
        ];
    }
}
