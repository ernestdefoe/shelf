<?php

namespace Ernestdefoe\Shelf\Search\Filter;

use Flarum\Search\Database\DatabaseSearchState;
use Flarum\Search\Filter\FilterInterface;
use Flarum\Search\SearchState;
use Flarum\Search\ValidateFilterTrait;

/**
 * @implements FilterInterface<DatabaseSearchState>
 */
class EntryStatusFilter implements FilterInterface
{
    use ValidateFilterTrait;

    public function getFilterKey(): string
    {
        return 'status';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        /** @var DatabaseSearchState $state */
        // rated | want | done
        $value = $this->asString($value);
        $query = $state->getQuery();

        if ($value === 'rated') {
            $negate ? $query->whereNull('shelf_entries.rating') : $query->whereNotNull('shelf_entries.rating');
        } else {
            $query->where('shelf_entries.status', $negate ? '!=' : '=', $value);
        }
    }
}
