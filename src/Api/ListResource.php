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
use Illuminate\Database\ConnectionInterface;
use Tobyz\JsonApiServer\Context as OriginalContext;

/**
 * A member's public list. Titles are added, removed and reordered through
 * write-only attributes, so the list never has to be sent back whole.
 *
 * @extends AbstractDatabaseResource<ShelfList>
 */
class ListResource extends AbstractDatabaseResource
{
    /** @var array<int, array{add?: int, remove?: int, order?: int[]}> */
    private array $changes = [];

    public function __construct(
        private DiscussionLinks $links,
        private TranslatorInterface $translator,
        private ConnectionInterface $db
    ) {
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
        $change = $this->changes[spl_object_id($model)] ?? null;
        unset($this->changes[spl_object_id($model)]);

        if (! $change) {
            return $model;
        }

        $this->db->transaction(function () use ($model, $change) {
            $items = $this->db->table('shelf_list_items')->where('list_id', $model->id);

            if (isset($change['remove'])) {
                (clone $items)->where('media_id', $change['remove'])->delete();
            }

            if (isset($change['add']) && ! (clone $items)->where('media_id', $change['add'])->exists()) {
                if ((clone $items)->count() >= ShelfList::MAX_ITEMS) {
                    throw new ValidationException(['add' => $this->translator->trans('ernestdefoe-shelf.api.list_full', ['count' => ShelfList::MAX_ITEMS])]);
                }

                $this->db->table('shelf_list_items')->insert([
                    'list_id' => $model->id,
                    'media_id' => $change['add'],
                    'position' => ((int) (clone $items)->max('position')) + 1,
                    'created_at' => Carbon::now(),
                ]);
            }

            if (isset($change['order'])) {
                foreach (array_values($change['order']) as $position => $mediaId) {
                    (clone $items)->where('media_id', $mediaId)->update(['position' => $position]);
                }
            }

            $model->item_count = (clone $items)->count();
            $model->preview = (clone $items)
                ->join('marquee_media', 'marquee_media.id', '=', 'shelf_list_items.media_id')
                ->orderBy('shelf_list_items.position')
                ->limit(4)
                ->get(['marquee_media.poster', 'marquee_media.kind'])
                ->map(fn ($row) => ['poster' => $row->poster, 'kind' => $row->kind])
                ->all();
            $model->updated_at = Carbon::now();
            $model->saveQuietly();
        });

        $model->unsetRelation('media');

        return $model;
    }

    private function change(ShelfList $list, string $key, mixed $value): void
    {
        $this->changes[spl_object_id($list)][$key] = $value;
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
