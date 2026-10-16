<?php

namespace Ernestdefoe\Shelf\Search;

use Ernestdefoe\Shelf\Entry;
use Flarum\Search\Database\AbstractSearcher;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;

class EntrySearcher extends AbstractSearcher
{
    /** @return Builder<Entry> */
    public function getQuery(User $actor): Builder
    {
        return Entry::query()
            ->select('shelf_entries.*')
            ->whereIn('shelf_entries.user_id', User::query()->whereVisibleTo($actor)->select('users.id'));
    }
}
