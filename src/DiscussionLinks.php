<?php

namespace Ernestdefoe\Shelf;

use Flarum\Api\Context;
use Flarum\Discussion\Discussion;
use Flarum\Http\SlugManager;
use Flarum\User\User;
use Illuminate\Support\Collection;
use WeakMap;

/**
 * Where a title links to: the busiest discussion about it that the viewer can
 * see. Loaded for every title on the page in one query, and kept per request
 * so one viewer's answer never reaches another.
 */
class DiscussionLinks
{
    /**
     * Shared by every instance, so a resource can load what a field reads.
     *
     * @var WeakMap<object, array<int, string|null>>|null
     */
    private static ?WeakMap $byRequest = null;

    public function __construct(private SlugManager $slugs)
    {
        self::$byRequest ??= new WeakMap();
    }

    /** @param Collection<int, mixed> $mediaIds */
    public function prime(Context $context, Collection $mediaIds): void
    {
        $known = self::$byRequest[$context->request] ?? [];
        $missing = $mediaIds->map(fn ($id) => (int) $id)->unique()->reject(fn ($id) => array_key_exists($id, $known))->values();

        if ($missing->isNotEmpty()) {
            $known += $this->load($context->getActor(), $missing->all());
        }

        self::$byRequest[$context->request] = $known;
    }

    public function slugFor(Context $context, int $mediaId): ?string
    {
        if (! array_key_exists($mediaId, self::$byRequest[$context->request] ?? [])) {
            $this->prime($context, collect([$mediaId]));
        }

        return self::$byRequest[$context->request][$mediaId];
    }

    /**
     * @param int[] $mediaIds
     * @return array<int, string|null>
     */
    public function load(User $actor, array $mediaIds): array
    {
        $found = array_fill_keys($mediaIds, null);
        $driver = $this->slugs->forResource(Discussion::class);

        Discussion::whereVisibleTo($actor)
            ->whereIn('marquee_media_id', $mediaIds)
            ->whereNull('marquee_season')
            ->orderByDesc('comment_count')
            ->get((new Discussion())->qualifyColumns(['id', 'title', 'slug', 'marquee_media_id']))
            ->each(function (Discussion $d) use (&$found, $driver) {
                $found[(int) $d->getAttribute('marquee_media_id')] ??= $driver->toSlug($d);
            });

        // A show with no whole-show discussion still has its seasons' ones.
        $left = array_keys(array_filter($found, fn ($slug) => $slug === null));
        if ($left) {
            Discussion::whereVisibleTo($actor)
                ->whereIn('marquee_media_id', $left)
                ->orderByDesc('comment_count')
                ->get((new Discussion())->qualifyColumns(['id', 'title', 'slug', 'marquee_media_id']))
                ->each(function (Discussion $d) use (&$found, $driver) {
                    $found[(int) $d->getAttribute('marquee_media_id')] ??= $driver->toSlug($d);
                });
        }

        return $found;
    }
}
