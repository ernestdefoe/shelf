<?php

namespace Ernestdefoe\Shelf;

use Carbon\Carbon;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Database\ConnectionInterface;

/**
 * The best-rated titles over a period, from every member's ratings. The same
 * for every viewer, so it is cached for a few minutes; which discussion each
 * title links to is worked out per viewer afterwards.
 */
class TopRated
{
    public const PERIODS = ['month', 'year', 'all'];
    public const KINDS = ['movie', 'tv', 'game', 'music', 'book'];
    public const MIN_RATINGS = 'ernestdefoe-shelf.min_ratings';
    private const CACHE_MINUTES = 10;

    public function __construct(
        private ConnectionInterface $db,
        private Cache $cache,
        private SettingsRepositoryInterface $settings
    ) {
    }

    /** @return list<array{id: int, kind: string, title: string, year: int|null, poster: string|null, artist: string|null, average: float, count: int}> */
    public function get(string $period, ?string $kind, int $limit): array
    {
        $min = max(1, (int) $this->settings->get(self::MIN_RATINGS));

        return $this->cache->remember(
            "ernestdefoe-shelf.top.$period.".($kind ?? 'all').".$limit.$min",
            Carbon::now()->addMinutes(self::CACHE_MINUTES),
            fn () => $this->query($period, $kind, $limit, $min)
        );
    }

    /** @return list<array{id: int, kind: string, title: string, year: int|null, poster: string|null, artist: string|null, average: float, count: int}> */
    private function query(string $period, ?string $kind, int $limit, int $min): array
    {
        $since = match ($period) {
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => null,
        };

        $rows = $this->db->table('shelf_entries')
            ->join('marquee_media', 'marquee_media.id', '=', 'shelf_entries.media_id')
            ->whereNotNull('shelf_entries.rating')
            ->when($since, fn ($q) => $q->where('shelf_entries.rated_at', '>=', $since))
            ->when($kind, fn ($q) => $q->where('marquee_media.kind', $kind))
            ->groupBy('marquee_media.id', 'marquee_media.kind', 'marquee_media.title', 'marquee_media.year', 'marquee_media.poster')
            ->havingRaw('COUNT(*) >= ?', [$min])
            ->select('marquee_media.id', 'marquee_media.kind', 'marquee_media.title', 'marquee_media.year', 'marquee_media.poster')
            ->selectRaw('AVG(rating) AS average, COUNT(*) AS ratings')
            ->orderByDesc('average')
            ->orderByDesc('ratings')
            ->orderBy('marquee_media.id')
            ->limit($limit)
            ->get();

        // The artist lives in the stored details; only albums have one.
        $artists = $this->db->table('marquee_media')
            ->whereIn('id', $rows->where('kind', 'music')->pluck('id'))
            ->pluck('data', 'id')
            ->map(fn ($data) => json_decode((string) $data, true)['artist'] ?? null);

        return $rows->map(fn ($row) => [
            'id' => (int) $row->id,
            'kind' => $row->kind,
            'title' => $row->title,
            'year' => $row->year === null ? null : (int) $row->year,
            'poster' => $row->poster,
            'artist' => $artists[$row->id] ?? null,
            // Ratings are half stars (1-10); the average is shown out of five.
            'average' => round(((float) $row->average) / 2, 2),
            'count' => (int) $row->ratings,
        ])->values()->all();
    }
}
