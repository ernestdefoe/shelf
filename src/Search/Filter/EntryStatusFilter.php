<?php

namespace Ernestdefoe\Shelf\Search\Filter;

use Ernestdefoe\Shelf\Entry;
use Flarum\Foundation\ValidationException;
use Flarum\Locale\TranslatorInterface;
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

    public function __construct(
        private TranslatorInterface $translator
    ) {
    }

    public function getFilterKey(): string
    {
        return 'status';
    }

    public function filter(SearchState $state, string|array $value, bool $negate): void
    {
        /** @var DatabaseSearchState $state */
        // rated | owned | want | done
        $value = $this->asString($value);
        $query = $state->getQuery();

        if ($value === 'rated') {
            $negate ? $query->whereNull('shelf_entries.rating') : $query->whereNotNull('shelf_entries.rating');
        } elseif ($value === 'owned') {
            $query->where('shelf_entries.owned', ! $negate);
        } elseif (in_array($value, Entry::STATUSES, true)) {
            $query->where('shelf_entries.status', $negate ? '!=' : '=', $value);
        } else {
            throw new ValidationException(['status' => $this->translator->trans('validation.in', ['attribute' => 'status'])]);
        }
    }
}
