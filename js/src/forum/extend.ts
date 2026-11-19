import Extend from 'flarum/common/extenders';
import { Entry, ShelfList } from './models';

export default [
  new Extend.Store().add('shelf-entries', Entry).add('shelf-lists', ShelfList),

  // Pages load on first visit, not with every forum page.
  new Extend.Routes()
    .add('shelf.top', '/shelf', () => import('./components/TopRatedPage'))
    .add('shelf.list', '/shelf/lists/:id', () => import('./components/ListPage'))
    .add('user.shelf', '/u/:username/shelf', () => import('./components/ShelfPage')),
];
