<?php

namespace Ernestdefoe\Shelf;

use Flarum\User\User;
use WeakMap;

/**
 * The members' rating of a title and the viewer's own entry, as a Marquee card
 * shows them. A discussion page carries its title and up to a dozen related
 * ones, so the endpoint loads them all in two queries before serialising, and
 * the field reads from here. Kept per actor, like DiscussionLinks.
 */
class ShelfStats
{
    /** @var WeakMap<User, array<int, array{average: float|null, count: int, mine: array<string, mixed>|null}>> */
    private WeakMap $byActor;

    public function __construct()
    {
        $this->byActor = new WeakMap();
    }

    /** @param int[] $mediaIds */
    public function prime(User $actor, array $mediaIds): void
    {
        $known = $this->byActor[$actor] ?? [];
        $missing = array_values(array_diff(array_unique(array_map('intval', $mediaIds)), array_keys($known)));

        if ($missing) {
            $known += $this->load($actor, $missing);
        }

        $this->byActor[$actor] = $known;
    }

    /** @return array{average: float|null, count: int, mine: array<string, mixed>|null} */
    public function for(User $actor, int $mediaId): array
    {
        $this->prime($actor, [$mediaId]);

        return $this->byActor[$actor][$mediaId];
    }

    /**
     * @param int[] $mediaIds
     * @return array<int, array{average: float|null, count: int, mine: array<string, mixed>|null}>
     */
    private function load(User $actor, array $mediaIds): array
    {
        // An aggregate per title: AVG and COUNT have no builder method that groups.
        $stats = Entry::query()
            ->whereIn('media_id', $mediaIds)
            ->whereNotNull('rating')
            ->groupBy('media_id')
            ->select('media_id')
            ->selectRaw('AVG(rating) AS average, COUNT(*) AS ratings')
            ->toBase()
            ->get()
            ->keyBy('media_id');

        $mine = $actor->isGuest() ? collect() : Entry::query()
            ->where('user_id', $actor->id)
            ->whereIn('media_id', $mediaIds)
            ->get()
            ->keyBy('media_id');

        $found = [];
        foreach ($mediaIds as $id) {
            $row = $stats->get($id);
            $entry = $mine->get($id);

            $found[$id] = [
                // Ratings are half stars (1-10); the average is shown out of five.
                'average' => $row ? round(((float) $row->average) / 2, 2) : null,
                'count' => $row ? (int) $row->ratings : 0,
                'mine' => $entry ? [
                    'id' => (string) $entry->id,
                    'rating' => $entry->rating,
                    'status' => $entry->status,
                    'owned' => $entry->owned,
                    'doneOn' => $entry->done_on?->toDateString(),
                ] : null,
            ];
        }

        return $found;
    }
}
