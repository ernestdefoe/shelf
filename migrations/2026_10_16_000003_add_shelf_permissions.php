<?php

use Flarum\Database\Migration;
use Flarum\Group\Group;

return Migration::addPermissions([
    'ernestdefoe-shelf.use' => Group::MEMBER_ID,
    'ernestdefoe-shelf.moderate' => Group::MODERATOR_ID,
]);
