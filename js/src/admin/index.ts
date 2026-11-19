import app from 'flarum/admin/app';
import { registerEditorWidgets } from '../common/fofWidgets';

export { default as extend } from './extend';

// FoF's layout editor lists only widgets the admin registers too.
app.initializers.add('ernestdefoe-shelf', () => {
  registerEditorWidgets(app, 'ernestdefoe-shelf', [
    { key: 'shelfTopRated', icon: 'fas fa-star', title: () => app.translator.trans('ernestdefoe-shelf.admin.widget_top_rated') },
  ]);
});
