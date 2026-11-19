<?php

namespace Ernestdefoe\Shelf\Api;

use Carbon\Carbon;
use Ernestdefoe\Shelf\DiscussionLinks;
use Ernestdefoe\Shelf\ShelfList;
use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Api\Sort\SortColumn;
use Flarum\Foundation\ValidationException;
use Flarum\Locale\TranslatorInterface;
use Flarum\User\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Tobyz\JsonApiServer\Context as OriginalContext;
use Tobyz\JsonApiServer\Exception\BadRequestException;
use WeakMap;

/**
 * A member's public list. Titles are added, removed and reordered through
 * write-only attributes, so the list never has to be sent back whole.
 *
 * @extends AbstractDatabaseResource<ShelfList>
 */
class ListResource extends AbstractDatabaseResource
{
    /**
     * Each list's pending changes (add, remove: a title id; order: title ids)
     * until it is saved; gone with the list object if the save never happens.
     *
     * @var WeakMap<ShelfList, array<string, mixed>>
     */
    private WeakMap $changes;

    public function __construct(
        private DiscussionLinks $links,
        private TranslatorInterface $translator,
        private ConnectionInterface $db
    ) {
        $this->changes = new WeakMap();
    }

    public function type(): string
    {
        return 'shelf-lists';
    }

    public function model(): string
    {
        return ShelfList::class;
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Index::make()
                ->paginate(20, 50)
                ->before($this->refuseTitles(...))
                ->defaultInclude(['user'])
                ->defaultSort('-updatedAt'),
            Endpoint\Show::make()
                ->defaultInclude(['user', 'media'])
                ->beforeSerialization(fn (Context $context, object $list) => $this->links->prime($context, $list->media->pluck('id'))),
            Endpoint\Create::make()
                ->authenticated()
                ->can('ernestdefoe-shelf.use')
                ->defaultInclude(['user', 'media']),
            Endpoint\Update::make()
                ->authenticated()
                ->can('update')
                ->defaultInclude(['user', 'media']),
            Endpoint\Delete::make()
                ->authenticated()
                ->can('delete'),
        ];
    }

    /**
     * A page holds up to 50 lists of up to 500 titles each, so titles come
     * with one list at a time (Show), never with the index.
     */
    private function refuseTitles(Context $context): void
    {
        $include = $context->queryParam('include', '');
        $paths = is_array($include) ? $include : explode(',', (string) $include);

        foreach ($paths as $path) {
            if (strtok(trim((string) $path), '.') === 'media') {
                throw (new BadRequestException('Invalid include [media]'))->setSource(['parameter' => 'include']);
            }
        }
    }

    public function creating(object $model, OriginalContext $context): ?object
    {
        /** @var ShelfList $model */
        $actor = $context->getActor();

        if (ShelfList::query()->where('user_id', $actor->id)->count() >= ShelfList::MAX_PER_USER) {
            throw new ValidationException(['name' => $this->translator->trans('ernestdefoe-shelf.api.too_many_lists', ['count' => ShelfList::MAX_PER_USER])]);
        }

        $model->user_id = $actor->id;

        return $model;
    }

    public function saved(object $model, OriginalContext $context): ?object
    {
        /** @var ShelfList $model */
        $change = $this->changes[$model] ?? null;
        unset($this->changes[$model]);

        if (! $change) {
            return $model;
        }

        $this->db->transaction(function () use ($model, $change) {
            if (isset($change['remove'])) {
                $model->media()->detach($change['remove']);
            }

            if (isset($change['add'])) {
                $this->add($model, $change['add']);
            }

            if (isset($change['order']) && $change['order']) {
                $this->reorder($model, $change['order']);
            }

            $this->summarise($model);
        });

        $model->unsetRelation('media');

        return $model;
    }

    /** At the end of the list, unless it is there already. */
    private function add(ShelfList $list, int $mediaId): void
    {
        $items = $list->media()->newPivotQuery();

        if ((clone $items)->where('media_id', $mediaId)->exists()) {
            return;
        }

        if ((clone $items)->count() >= ShelfList::MAX_ITEMS) {
            throw new ValidationException(['add' => $this->translator->trans('ernestdefoe-shelf.api.list_full', ['count' => ShelfList::MAX_ITEMS])]);
        }

        $list->media()->attach($mediaId, [
            'position' => ((int) (clone $items)->max('position')) + 1,
            'created_at' => Carbon::now(),
        ]);
    }

    /** @param int[] $order every title's id, in the new order */
    private function reorder(ShelfList $list, array $order): void
    {
        // A title listed twice takes its last position; titles not on the list are ignored.
        $positions = array_intersect_key(array_flip(array_values($order)), array_flip($list->media()->newPivotQuery()->pluck('media_id')->all()));

        // One statement for the whole list (up to MAX_ITEMS titles), not one per title:
        // every row exists, so the upsert only ever updates `position`.
        $list->media()->newPivotStatement()->upsert(
            array_map(fn ($mediaId, $position) => ['list_id' => $list->id, 'media_id' => $mediaId, 'position' => $position, 'created_at' => Carbon::now()], array_keys($positions), $positions),
            ['list_id', 'media_id'],
            ['position']
        );
    }

    /** The count and first four posters, kept on the list so list cards cost nothing. */
    private function summarise(ShelfList $list): void
    {
        $list->item_count = $list->media()->newPivotQuery()->count();
        $list->preview = $list->media()
            ->limit(4)
            ->get(['marquee_media.poster', 'marquee_media.kind'])
            ->map(fn ($media) => ['poster' => $media->poster, 'kind' => $media->kind])
            ->all();
        $list->updated_at = Carbon::now();
        $list->saveQuietly();
    }

    /**
     * Lists of members the viewer can't see stay hidden when fetched by id
     * too, as they are from the index (ListSearcher).
     */
    public function scope(Builder $query, OriginalContext $context): void
    {
        $query->whereIn('shelf_lists.user_id', User::query()->whereVisibleTo($context->getActor())->select('users.id'));
    }

    private function change(ShelfList $list, string $key, mixed $value): void
    {
        $this->changes[$list] = [$key => $value] + ($this->changes[$list] ?? []);
    }

    public function fields(): array
    {
        return [
            Schema\Str::make('name')
                ->writable()
                ->requiredOnCreate()
                ->rule('string')
                ->rule('max:100')
                ->rule('regex:/\S/'),
            Schema\Str::make('description')
                ->nullable()
                ->writable()
                ->rule('max:1000'),
            Schema\Integer::make('itemCount'),
            Schema\DateTime::make('createdAt'),
            Schema\DateTime::make('updatedAt'),

            // Write-only: one title to add or remove, or the new order of every title.
            Schema\Integer::make('add')
                ->hidden()
                ->writable()
                ->rule('integer')
                ->rule('exists:marquee_media,id')
                ->set(fn (ShelfList $list, mixed $value) => $this->change($list, 'add', (int) $value)),
            Schema\Integer::make('remove')
                ->hidden()
                ->writableOnUpdate()
                ->set(fn (ShelfList $list, mixed $value) => $this->change($list, 'remove', (int) $value)),
            Schema\Arr::make('order')
                ->hidden()
                ->writableOnUpdate()
                ->rule('max:'.ShelfList::MAX_ITEMS)
                ->set(fn (ShelfList $list, mixed $value) => $this->change($list, 'order', array_map('intval', array_slice((array) $value, 0, ShelfList::MAX_ITEMS)))),

            Schema\Arr::make('preview')
                ->get(fn (ShelfList $list) => $list->preview ?? []),

            Schema\Relationship\ToOne::make('user')
                ->type('users')
                ->includable(),
            Schema\Relationship\ToMany::make('media')
                ->type('marquee-media')
                ->includable(),
        ];
    }

    public function sorts(): array
    {
        return [
            SortColumn::make('updatedAt'),
            SortColumn::make('createdAt'),
        ];
    }
}
