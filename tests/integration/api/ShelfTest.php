<?php

namespace Ernestdefoe\Shelf\Tests\integration\api;

use Carbon\Carbon;
use Flarum\Discussion\Discussion;
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use PHPUnit\Framework\Attributes\Test;
use Psr\Http\Message\ResponseInterface;

class ShelfTest extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('flarum-tags', 'ernestdefoe-marquee', 'ernestdefoe-shelf');

        $now = Carbon::now()->toDateTimeString();
        $media = fn (int $id, string $kind, string $title, array $extra = []) => [
            'id' => $id, 'kind' => $kind, 'external_id' => (string) (600 + $id), 'title' => $title, 'year' => 2000 + $id,
            'poster' => "/p$id.jpg", 'fetched_at' => $now, 'data' => json_encode(['title' => $title] + $extra),
        ];

        $this->prepareDatabase([
            User::class => [
                $this->normalUser(),
                ['id' => 3, 'username' => 'reader', 'email' => 'reader@machine.local', 'is_email_confirmed' => 1],
                ['id' => 4, 'username' => 'critic', 'email' => 'critic@machine.local', 'is_email_confirmed' => 1],
            ],
            'group_user' => [
                ['user_id' => 3, 'group_id' => 3],
                ['user_id' => 4, 'group_id' => 3],
            ],
            'marquee_media' => [
                $media(1, 'movie', 'The Matrix'),
                $media(2, 'book', 'Dune'),
                $media(3, 'music', 'Kid A', ['artist' => 'Radiohead']),
                $media(4, 'game', 'Hades'),
            ],
            Discussion::class => [
                ['id' => 1, 'title' => 'The Matrix (1999)', 'slug' => 'the-matrix', 'user_id' => 1, 'created_at' => $now, 'comment_count' => 3, 'marquee_media_id' => 1],
                // Hidden: nobody but staff should be sent to it.
                ['id' => 2, 'title' => 'Dune (1965)', 'slug' => 'dune', 'user_id' => 1, 'created_at' => $now, 'comment_count' => 1, 'marquee_media_id' => 2, 'hidden_at' => $now],
            ],
        ]);
    }

    private function json(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true) ?? [];
    }

    private function get(string $path, array $query = [], ?int $as = null): ResponseInterface
    {
        return $this->send($this->request('GET', $path, $as ? ['authenticatedAs' => $as] : [])->withQueryParams($query));
    }

    private function rate(int $as, int $media, array $attributes): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/shelf-entries', [
            'authenticatedAs' => $as,
            'json' => ['data' => [
                'type' => 'shelf-entries',
                'attributes' => $attributes,
                'relationships' => ['media' => ['data' => ['type' => 'marquee-media', 'id' => (string) $media]]],
            ]],
        ]));
    }

    private function list(int $as, array $attributes, ?int $id = null): ResponseInterface
    {
        return $this->send($this->request($id ? 'PATCH' : 'POST', '/api/shelf-lists'.($id ? "/$id" : ''), [
            'authenticatedAs' => $as,
            'json' => ['data' => ['type' => 'shelf-lists', 'attributes' => $attributes] + ($id ? ['id' => (string) $id] : [])],
        ]));
    }

    #[Test]
    public function guests_cannot_rate(): void
    {
        $response = $this->send($this->request('POST', '/api/shelf-entries', [
            'json' => ['data' => ['type' => 'shelf-entries', 'attributes' => ['rating' => 8],
                'relationships' => ['media' => ['data' => ['type' => 'marquee-media', 'id' => '1']]]]],
        ]));

        $this->assertContains($response->getStatusCode(), [400, 401]);
    }

    #[Test]
    public function rating_twice_updates_the_same_entry(): void
    {
        $first = $this->rate(3, 1, ['rating' => 7]);
        $this->assertSame(201, $first->getStatusCode(), (string) $first->getBody());
        $id = $this->json($first)['data']['id'];
        $this->assertNotNull($this->json($first)['data']['attributes']['ratedAt']);

        $second = $this->rate(3, 1, ['rating' => 9, 'status' => 'done']);
        $this->assertSame(201, $second->getStatusCode(), (string) $second->getBody());
        $this->assertSame($id, $this->json($second)['data']['id']);
        $this->assertSame(9, $this->json($second)['data']['attributes']['rating']);
        // Logged without a date: today.
        $this->assertSame(Carbon::today()->toDateString(), substr($this->json($second)['data']['attributes']['doneOn'], 0, 10));
    }

    #[Test]
    public function bad_values_are_refused(): void
    {
        $this->assertSame(422, $this->rate(3, 1, ['rating' => 11])->getStatusCode());
        $this->assertSame(422, $this->rate(3, 1, ['rating' => 0])->getStatusCode());
        $this->assertSame(422, $this->rate(3, 1, ['status' => 'loved'])->getStatusCode());
        $this->assertSame(422, $this->rate(3, 1, ['status' => 'done', 'doneOn' => Carbon::now()->addDays(3)->toDateString()])->getStatusCode());
        // Nothing to keep.
        $this->assertSame(422, $this->rate(3, 1, [])->getStatusCode());
    }

    #[Test]
    public function members_cannot_touch_each_others_entries(): void
    {
        $id = $this->json($this->rate(3, 1, ['rating' => 6]))['data']['id'];

        $patch = $this->send($this->request('PATCH', "/api/shelf-entries/$id", [
            'authenticatedAs' => 4,
            'json' => ['data' => ['type' => 'shelf-entries', 'id' => $id, 'attributes' => ['rating' => 1]]],
        ]));
        $this->assertSame(403, $patch->getStatusCode());

        $delete = $this->send($this->request('DELETE', "/api/shelf-entries/$id", ['authenticatedAs' => 4]));
        $this->assertSame(403, $delete->getStatusCode());

        $own = $this->send($this->request('DELETE', "/api/shelf-entries/$id", ['authenticatedAs' => 3]));
        $this->assertSame(204, $own->getStatusCode());
    }

    #[Test]
    public function a_shelf_lists_entries_with_titles_and_visible_discussions_only(): void
    {
        $this->rate(3, 1, ['rating' => 8]);
        $this->rate(3, 2, ['status' => 'want']);
        $this->rate(4, 3, ['rating' => 10]);

        $response = $this->get('/api/shelf-entries', ['filter' => ['user' => '3']]);
        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $body = $this->json($response);

        $this->assertCount(2, $body['data']);
        $slugs = array_column(array_column(array_filter($body['included'], fn ($r) => $r['type'] === 'marquee-media'), 'attributes'), 'shelfSlug');
        // The Matrix links to its discussion; Dune's only discussion is hidden from guests.
        $this->assertContains('1-the-matrix', $slugs);
        $this->assertContains(null, $slugs);
        $this->assertCount(2, array_filter($body['included'] ?? [], fn ($r) => $r['type'] === 'marquee-media'));

        $want = $this->json($this->get('/api/shelf-entries', ['filter' => ['user' => '3', 'status' => 'want']]));
        $this->assertCount(1, $want['data']);
        $rated = $this->json($this->get('/api/shelf-entries', ['filter' => ['user' => '3', 'status' => 'rated']]));
        $this->assertCount(1, $rated['data']);
    }

    #[Test]
    public function the_card_carries_the_average_and_the_viewers_own_entry(): void
    {
        $this->rate(3, 1, ['rating' => 8]);
        $this->rate(4, 1, ['rating' => 5]);

        $body = $this->json($this->send($this->request('GET', '/api/discussions/1', ['authenticatedAs' => 3])));
        $media = collect($body['included'])->firstWhere('type', 'marquee-media');

        $this->assertSame(3.25, $media['attributes']['shelf']['average']);
        $this->assertSame(2, $media['attributes']['shelf']['count']);
        $this->assertSame(8, $media['attributes']['shelf']['mine']['rating']);

        // Not on the discussion list.
        $list = $this->json($this->send($this->request('GET', '/api/discussions', ['authenticatedAs' => 3])));
        $listMedia = collect($list['included'] ?? [])->firstWhere('type', 'marquee-media');
        $this->assertArrayNotHasKey('shelf', $listMedia['attributes']);
    }

    #[Test]
    public function top_rated_needs_enough_ratings_and_this_months_only(): void
    {
        $this->rate(3, 1, ['rating' => 8]);
        $this->rate(4, 1, ['rating' => 6]);
        $this->rate(3, 3, ['rating' => 10]);
        $this->rate(4, 3, ['rating' => 10]);
        // One rating is not enough (default minimum 2).
        $this->rate(3, 4, ['rating' => 10]);
        // Rated long ago: counts for all time only.
        $this->rate(3, 2, ['rating' => 2]);
        $this->rate(4, 2, ['rating' => 2]);
        $this->database()->table('shelf_entries')->where('media_id', 2)->update(['rated_at' => Carbon::now()->subYears(2)]);

        $month = $this->json($this->send($this->request('GET', '/api/shelf/top')))['data'];
        $this->assertSame([3, 1], array_column($month, 'id'));
        $this->assertSame(5.0, (float) $month[0]['average']);
        $this->assertSame('Radiohead', $month[0]['artist']);
        $this->assertSame('1-the-matrix', $month[1]['discussionSlug']);

        $all = $this->json($this->get('/api/shelf/top', ['period' => 'all']))['data'];
        $this->assertSame([3, 1, 2], array_column($all, 'id'));
        // A guest is not sent to the hidden Dune discussion.
        $this->assertNull($all[2]['discussionSlug']);

        $books = $this->json($this->get('/api/shelf/top', ['period' => 'all', 'kind' => 'book']))['data'];
        $this->assertSame([2], array_column($books, 'id'));
    }

    #[Test]
    public function lists_add_remove_and_reorder_titles(): void
    {
        $created = $this->list(3, ['name' => 'Favourites', 'add' => 1]);
        $this->assertSame(201, $created->getStatusCode(), (string) $created->getBody());
        $id = (int) $this->json($created)['data']['id'];

        $this->list(3, ['add' => 3], $id);
        $this->list(3, ['add' => 4], $id);
        // Adding twice does nothing.
        $this->list(3, ['add' => 4], $id);
        $this->list(3, ['remove' => 1], $id);
        $ordered = $this->json($this->list(3, ['order' => [4, 3]], $id));

        $this->assertSame(2, $ordered['data']['attributes']['itemCount']);
        $this->assertSame(['/p4.jpg', '/p3.jpg'], array_column($ordered['data']['attributes']['preview'], 'poster'));

        $shown = $this->json($this->send($this->request('GET', "/api/shelf-lists/$id")));
        $this->assertSame(['4', '3'], array_column($shown['data']['relationships']['media']['data'], 'id'));
        $this->assertArrayHasKey('shelfSlug', $shown['included'][array_search('marquee-media', array_column($shown['included'], 'type'))]['attributes']);

        $this->assertSame(422, $this->list(3, ['add' => 999], $id)->getStatusCode());
        $this->assertSame(403, $this->list(4, ['name' => 'Mine now'], $id)->getStatusCode());
        $this->assertSame(403, $this->send($this->request('DELETE', "/api/shelf-lists/$id", ['authenticatedAs' => 4]))->getStatusCode());
        // A moderator (here the admin) can remove a list.
        $this->assertSame(204, $this->send($this->request('DELETE', "/api/shelf-lists/$id", ['authenticatedAs' => 1]))->getStatusCode());
    }

    #[Test]
    public function a_list_needs_a_name(): void
    {
        $this->assertSame(422, $this->list(3, ['name' => '   '])->getStatusCode());
        $this->assertSame(422, $this->list(3, ['name' => str_repeat('x', 101)])->getStatusCode());
    }

    #[Test]
    public function members_without_permission_cannot_shelve(): void
    {
        $this->database()->table('group_permission')->where('permission', 'ernestdefoe-shelf.use')->delete();

        $this->assertSame(403, $this->rate(3, 1, ['rating' => 6])->getStatusCode());
        $this->assertSame(403, $this->list(3, ['name' => 'Nope'])->getStatusCode());
    }
}
