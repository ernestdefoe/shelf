<?php

namespace Ernestdefoe\Shelf;

use Carbon\Carbon;
use Ernestdefoe\Marquee\Media;
use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One member's rating and log for one title.
 *
 * @property int $id
 * @property int $user_id
 * @property int $media_id
 * @property int|null $rating
 * @property string|null $status
 * @property Carbon|null $done_on
 * @property bool $owned
 * @property Carbon|null $rated_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property User $user
 * @property Media $media
 */
class Entry extends AbstractModel
{
    public const STATUSES = ['want', 'done'];

    protected $table = 'shelf_entries';

    public $timestamps = true;

    protected $casts = [
        'user_id' => 'integer',
        'media_id' => 'integer',
        'rating' => 'integer',
        'owned' => 'boolean',
        'done_on' => 'date',
        'rated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Media, $this> */
    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
