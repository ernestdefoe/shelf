<?php

namespace Ernestdefoe\Shelf\Api;

use Ernestdefoe\Marquee\Link;
use Ernestdefoe\Marquee\Media;
use Ernestdefoe\Shelf\ShelfStats;
use Flarum\Api\Context;
use Flarum\Api\Endpoint\Show;
use Flarum\Api\Endpoint\Update;
use Flarum\Discussion\Discussion;

/**
 * A discussion page's title and its related titles get their shelf ratings in
 * one go, before MediaFields reads them one by one.
 */
class PrimeShelfStats
{
    public function __construct(private ShelfStats $stats)
    {
    }

    public function __invoke(Show|Update $endpoint): Show|Update
    {
        return $endpoint->beforeSerialization(function (Context $context, object $discussion) {
            if ($discussion instanceof Discussion && $ids = self::titleIds($discussion)) {
                $this->stats->prime($context->getActor(), $ids);
            }
        });
    }

    /** @return int[] the titles on the discussion's card */
    private static function titleIds(Discussion $discussion): array
    {
        // Marquee 1.20 and older kept the titles on `discussions`. Only until a
        // forum updates Marquee: 1.21 refuses older Shelf releases.
        if (! class_exists(Link::class)) {
            return array_filter(array_map('intval', [$discussion->getAttribute('marquee_media_id'), ...(array) ($discussion->getAttribute('marquee_related') ?? [])]));
        }

        // Core has not loaded these two yet when this runs (it would while
        // serialising); loaded here, the serializer reuses them, so this adds
        // no query of its own (ShelfTest counts them).
        $discussion->loadMissing(['marqueeMedia', 'marqueeRelatedMedia']);

        /** @var iterable<Media|null> $related */
        $related = $discussion->getRelation('marqueeRelatedMedia');
        $ids = [];
        foreach ([$discussion->getRelation('marqueeMedia'), ...$related] as $media) {
            if ($media instanceof Media) {
                $ids[] = (int) $media->id;
            }
        }

        return $ids;
    }
}
