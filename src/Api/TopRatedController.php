<?php

namespace Ernestdefoe\Shelf\Api;

use Ernestdefoe\Shelf\DiscussionLinks;
use Ernestdefoe\Shelf\TopRated;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class TopRatedController implements RequestHandlerInterface
{
    public function __construct(private TopRated $top, private DiscussionLinks $links)
    {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertCan('viewForum');

        $params = $request->getQueryParams();
        $period = in_array($p = Arr::get($params, 'period'), TopRated::PERIODS, true) ? $p : 'month';
        $kind = in_array($k = Arr::get($params, 'kind'), TopRated::KINDS, true) ? $k : null;
        $limit = max(1, min(25, (int) Arr::get($params, 'limit', 10)));

        $items = $this->top->get($period, $kind, $limit);
        $slugs = $items ? $this->links->load($actor, array_column($items, 'id')) : [];

        foreach ($items as &$item) {
            $item['discussionSlug'] = $slugs[$item['id']] ?? null;
        }

        return new JsonResponse(['data' => $items, 'meta' => ['period' => $period, 'kind' => $kind]]);
    }
}
