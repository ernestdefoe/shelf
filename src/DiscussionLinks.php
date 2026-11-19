<?php

namespace Ernestdefoe\Shelf;

use Ernestdefoe\Marquee\Link;
use Ernestdefoe\Marquee\Media;
use Flarum\Api\Context;
use Flarum\Discussion\Discussion;
use Flarum\Http\SlugManager;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use WeakMap;

/**
 * Where a title links to: the busiest discussion about it that the viewer can
 * see. Loaded for every title on the page in two queries, and kept per actor
 * (one object per request; the request object itself is cloned between the
 * endpoint and the fields) so one viewer's answer never reaches another.
 */
class DiscussionLinks
{
    /**
     * One instance per request (ShelfServiceProvider), so what a resource
     * loads is what a field reads.
     *
     * @var WeakMap<User, array<int, string|null>>
     */
    private WeakMap $byActor;

    public function __construct(private SlugManager $slugs)
    {
        $this->byActor = new WeakMap();
    }

    /** @param Collection<int, mixed> $mediaIds */
    public function prime(Context $context, Collection $mediaIds): void
    {
        $known = $this->byActor[$context->getActor()] ?? [];
        $missing = $mediaIds->map(fn ($id) => (int) $id)->unique()->reject(fn ($id) => array_key_exists($id, $known))->values();

        if ($missing->isNotEmpty()) {
            $known += $this->load($context->getActor(), $missing->all());
        }

        $this->byActor[$context->getActor()] = $known;
    }

    public function slugFor(Context $context, int $mediaId): ?string
    {
        if (! array_key_exists($mediaId, $this->byActor[$context->getActor()] ?? [])) {
            $this->prime($context, collect([$mediaId]));
        }

        return $this->byActor[$context->getActor()][$mediaId];
    }

    /**
     * @param int[] $mediaIds
     * @return array<int, string|null>
     */
    public function load(User $actor, array $mediaIds): array
    {
        $found = array_fill_keys($mediaIds, null);
        $picked = $this->busiest($actor, $mediaIds);
        $discussions = Discussion::query()
            ->whereIn('id', array_filter($picked))
            ->get(['id', 'title', 'slug'])
            ->keyBy('id');
        $driver = $this->slugs->forResource(Discussion::class);

        foreach ($picked as $mediaId => $discussionId) {
            $discussion = $discussionId ? $discussions->get($discussionId) : null;
            $found[$mediaId] = $discussion ? $driver->toSlug($discussion) : null;
        }

        return $found;
    }

    /**
     * Each title's busiest visible discussion, whole-show ones first (a show
     * with none still has its seasons' ones): one row per title, whatever
     * the number of discussions linked to it.
     *
     * @param int[] $mediaIds
     * @return array<int, int|null> title id => discussion id
     */
    private function busiest(User $actor, array $mediaIds): array
    {
        return Media::query()
            ->whereIn('id', $mediaIds)
            ->select('id')
            ->selectSub($this->busiestOf($actor, true), 'whole_show')
            ->selectSub($this->busiestOf($actor, false), 'busiest')
            ->toBase()
            ->get()
            ->mapWithKeys(function ($row) {
                $id = $row->whole_show ?? $row->busiest;

                return [(int) $row->id => $id === null ? null : (int) $id];
            })
            ->all();
    }

    /**
     * The busiest visible discussion linked to the outer query's title.
     *
     * @return Builder<Discussion>
     */
    private function busiestOf(User $actor, bool $wholeShow): Builder
    {
        $pick = Discussion::whereVisibleTo($actor)->select('discussions.id');

        // Marquee 1.20 and older kept the link on `discussions`. Only until a
        // forum updates Marquee: 1.21 refuses older Shelf releases.
        if (class_exists(Link::class)) {
            $pick->join('marquee_discussions', 'marquee_discussions.discussion_id', '=', 'discussions.id');
            [$media, $season] = ['marquee_discussions.media_id', 'marquee_discussions.season'];
        } else {
            [$media, $season] = ['discussions.marquee_media_id', 'discussions.marquee_season'];
        }

        return $pick
            ->whereColumn($media, 'marquee_media.id')
            ->when($wholeShow, fn ($q) => $q->whereNull($season))
            ->orderByDesc('discussions.comment_count')
            ->limit(1);
    }
}
