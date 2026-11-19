<?php

namespace Ernestdefoe\Shelf\Api;

use Flarum\Api\Context;
use Flarum\Api\Schema;

/** What the viewer may do with Shelf, for the forum's buttons. */
class ForumFields
{
    public function __invoke(): array
    {
        return [
            Schema\Boolean::make('canUseShelf')
                ->get(fn ($forum, Context $context) => $context->getActor()->hasPermission('ernestdefoe-shelf.use')),
            Schema\Boolean::make('canModerateShelf')
                ->get(fn ($forum, Context $context) => $context->getActor()->hasPermission('ernestdefoe-shelf.moderate')),
        ];
    }
}
