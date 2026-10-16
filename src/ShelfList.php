<?php

namespace Ernestdefoe\Shelf;

use Carbon\Carbon;
use Ernestdefoe\Marquee\Media;
use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * A member's public list of titles, in their order.
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $description
 * @property int $item_count
 * @property list<array{poster: string|null, kind: string}>|null $preview
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property User $user
 * @property Collection<int, Media> $media
 */
class ShelfList extends AbstractModel
{
    public const MAX_PER_USER = 50;
    public const MAX_ITEMS = 500;

    protected $table = 'shelf_lists';

    public $timestamps = true;

    protected $casts = [
        'user_id' => 'integer',
        'item_count' => 'integer',
        'preview' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsToMany<Media, $this> */
    public function media(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'shelf_list_items', 'list_id', 'media_id')
            ->withPivot('position')
            ->orderBy('shelf_list_items.position');
    }
}
