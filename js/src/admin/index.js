import app from 'flarum/admin/app';

app.initializers.add('ernestdefoe-shelf', () => {
  app.registry
    .for('ernestdefoe-shelf')
    .registerSetting({
      setting: 'ernestdefoe-shelf.min_ratings',
      type: 'number',
      min: 1,
      max: 100,
      label: app.translator.trans('ernestdefoe-shelf.admin.min_ratings_label'),
      help: app.translator.trans('ernestdefoe-shelf.admin.min_ratings_help'),
    })
    .registerPermission(
      {
        icon: 'fas fa-star',
        label: app.translator.trans('ernestdefoe-shelf.admin.permission_use'),
        permission: 'ernestdefoe-shelf.use',
      },
      'reply',
      90
    )
    .registerPermission(
      {
        icon: 'fas fa-layer-group',
        label: app.translator.trans('ernestdefoe-shelf.admin.permission_moderate'),
        permission: 'ernestdefoe-shelf.moderate',
      },
      'moderate',
      90
    );
});
