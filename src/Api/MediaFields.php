<?php

namespace Ernestdefoe\Shelf\Api;

use Ernestdefoe\Marquee\Media;
use Ernestdefoe\Shelf\DiscussionLinks;
use Ernestdefoe\Shelf\Entry;
use Flarum\Api\Context;
use Flarum\Api\Resource\DiscussionResource;
use Flarum\Api\Schema;

/**
 * The members' rating and the viewer's own entry, on the title a discussion
 * page shows; never on the discussion list, so that costs nothing extra.
 */
class MediaFields
{
    public function __construct(private DiscussionLinks $links)
    {
    }

    public function __invoke(): array
    {
        $onCard = fn (Media $media, Context $context) => $context->showing(DiscussionResource::class) || $context->updating(DiscussionResource::class);

        return [
            Schema\Arr::make('shelf')
                ->visible($onCard)
                ->get(fn (Media $media, Context $context) => $this->shelf($media, $context)),

            // Where a title on a shelf or list links to. The resource loads these
            // for every title on the page in one query before serialising.
            Schema\Str::make('shelfSlug')
                ->nullable()
                ->visible(fn (Media $media, Context $context) => $context->listing(EntryResource::class) || $context->showing(ListResource::class))
                ->get(fn (Media $media, Context $context) => $this->links->slugFor($context, $media->id)),
        ];
    }

    /** @return array{average: float|null, count: int, mine: array<string, mixed>|null} */
    private function shelf(Media $media, Context $context): array
    {
        $stats = Entry::query()
            ->where('media_id', $media->id)
            ->whereNotNull('rating')
            ->selectRaw('AVG(rating) AS average, COUNT(*) AS ratings')
            ->toBase()
            ->first();

        $actor = $context->getActor();
        $mine = $actor->isGuest() ? null : Entry::query()->where('user_id', $actor->id)->where('media_id', $media->id)->first();

        return [
            'average' => $stats && $stats->ratings ? round(((float) $stats->average) / 2, 2) : null,
            'count' => (int) ($stats->ratings ?? 0),
            'mine' => $mine ? [
                'id' => (string) $mine->id,
                'rating' => $mine->rating,
                'status' => $mine->status,
                'doneOn' => $mine->done_on?->toDateString(),
            ] : null,
        ];
    }
}
