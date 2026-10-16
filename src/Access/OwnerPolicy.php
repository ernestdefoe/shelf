<?php

namespace Ernestdefoe\Shelf\Access;

use Ernestdefoe\Shelf\Entry;
use Ernestdefoe\Shelf\ShelfList;
use Flarum\User\Access\AbstractPolicy;
use Flarum\User\User;

/** Members change only their own shelf; moderators may delete anything on it. */
class OwnerPolicy extends AbstractPolicy
{
    public function update(User $actor, Entry|ShelfList $model): ?string
    {
        return $model->user_id === $actor->id && $actor->hasPermission('ernestdefoe-shelf.use') ? $this->allow() : $this->deny();
    }

    public function delete(User $actor, Entry|ShelfList $model): ?string
    {
        return $model->user_id === $actor->id || $actor->hasPermission('ernestdefoe-shelf.moderate') ? $this->allow() : $this->deny();
    }
}
