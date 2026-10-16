<?php

namespace Ernestdefoe\Shelf\Search;

use Ernestdefoe\Shelf\ShelfList;
use Flarum\Search\Database\AbstractSearcher;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;

class ListSearcher extends AbstractSearcher
{
    /** @return Builder<ShelfList> */
    public function getQuery(User $actor): Builder
    {
        return ShelfList::query()
            ->select('shelf_lists.*')
            ->whereIn('shelf_lists.user_id', User::query()->whereVisibleTo($actor)->select('users.id'));
    }
}
