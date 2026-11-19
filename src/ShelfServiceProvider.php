<?php

namespace Ernestdefoe\Shelf;

use Flarum\Foundation\AbstractServiceProvider;

class ShelfServiceProvider extends AbstractServiceProvider
{
    public function register(): void
    {
        // One of each per request, so what an endpoint loads before serialising
        // is what the fields read.
        $this->container->scoped(DiscussionLinks::class);
        $this->container->scoped(ShelfStats::class);
    }
}
