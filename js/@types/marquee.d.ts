// Marquee ships no typings: just the modules Shelf imports from it. No
// top-level imports here, so these stay ambient module declarations.

declare module 'ext:ernestdefoe/marquee/forum/components/MediaHero' {
  import Component from 'flarum/common/Component';
  import type ItemList from 'flarum/common/utils/ItemList';
  import type Mithril from 'mithril';

  export default class MediaHero extends Component<{ link: { media: MarqueeMedia } }> {
    actionItems(): ItemList<Mithril.Children>;
  }
}

declare module 'ext:ernestdefoe/marquee/forum/utils/posterUrl' {
  export default function posterUrl(path: string, size: string): string;
}
