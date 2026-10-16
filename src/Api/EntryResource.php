<?php

namespace Ernestdefoe\Shelf\Api;

use Carbon\Carbon;
use Ernestdefoe\Shelf\DiscussionLinks;
use Ernestdefoe\Shelf\Entry;
use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema;
use Flarum\Api\Sort\SortColumn;
use Flarum\Foundation\ValidationException;
use Flarum\Locale\TranslatorInterface;
use Illuminate\Support\Arr;
use Tobyz\JsonApiServer\Context as OriginalContext;

/**
 * A member's rating and log for one title. Posting one for a title that is
 * already on your shelf updates it, so the client never has to know whether
 * the row exists yet.
 *
 * @extends AbstractDatabaseResource<Entry>
 */
class EntryResource extends AbstractDatabaseResource
{
    public function __construct(private DiscussionLinks $links, private TranslatorInterface $translator)
    {
    }

    public function type(): string
    {
        return 'shelf-entries';
    }

    public function model(): string
    {
        return Entry::class;
    }

    public function endpoints(): array
    {
        return [
            Endpoint\Index::make()
                ->paginate(24, 60)
                ->defaultInclude(['media'])
                ->defaultSort('-updatedAt')
                ->eagerLoad(['media'])
                ->beforeSerialization($this->primeLinks(...)),
            Endpoint\Create::make()
                ->authenticated()
                ->can('ernestdefoe-shelf.use')
                ->defaultInclude(['media']),
            Endpoint\Update::make()
                ->authenticated()
                ->can('update')
                ->defaultInclude(['media']),
            Endpoint\Delete::make()
                ->authenticated()
                ->can('delete'),
        ];
    }

    /**
     * Every title on the page and the discussion it links to, in one go.
     *
     * @param array{models: iterable<Entry>} $results
     */
    private function primeLinks(Context $context, array $results): void
    {
        $ids = [];
        foreach ($results['models'] as $entry) {
            $ids[] = $entry->media_id;
        }

        $this->links->prime($context, collect($ids));
    }

    /** Upsert: an existing entry for this member and title is the one written to. */
    public function newModel(OriginalContext $context): object
    {
        $mediaId = (int) Arr::get($context->body(), 'data.relationships.media.data.id');
        $actor = $context->getActor();

        $entry = $mediaId ? Entry::query()->where('user_id', $actor->id)->where('media_id', $mediaId)->first() : null;

        if ($entry) {
            return $entry;
        }

        $entry = new Entry();
        $entry->user_id = $actor->id;

        return $entry;
    }

    public function saving(object $model, OriginalContext $context): ?object
    {
        /** @var Entry $model */
        if ($model->isDirty('rating')) {
            $model->rated_at = $model->rating ? Carbon::now() : null;
        }

        if ($model->status === 'done' && ! $model->done_on) {
            $model->done_on = Carbon::today();
        }

        if ($model->status !== 'done') {
            $model->done_on = null;
        }

        if (! $model->rating && ! $model->status && ! $model->owned) {
            throw new ValidationException(['rating' => $this->translator->trans('ernestdefoe-shelf.api.empty_entry')]);
        }

        return $model;
    }

    public function fields(): array
    {
        return [
            Schema\Integer::make('rating')
                ->nullable()
                ->writable()
                ->rule('integer')
                ->rule('between:1,10'),
            Schema\Str::make('status')
                ->nullable()
                ->writable()
                ->in(Entry::STATUSES),
            Schema\Boolean::make('owned')
                ->writable(),
            Schema\Date::make('doneOn')
                ->nullable()
                ->writable()
                ->rule('before_or_equal:today')
                ->rule('after:1900-01-01'),
            Schema\DateTime::make('ratedAt'),
            Schema\DateTime::make('updatedAt'),
            Schema\Relationship\ToOne::make('user')
                ->type('users')
                ->includable(),
            Schema\Relationship\ToOne::make('media')
                ->type('marquee-media')
                ->includable()
                ->writableOnCreate()
                ->requiredOnCreate(),
        ];
    }

    public function sorts(): array
    {
        return [
            SortColumn::make('updatedAt'),
            SortColumn::make('rating'),
            SortColumn::make('doneOn'),
        ];
    }
}
