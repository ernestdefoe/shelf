import { Admin } from 'flarum/common/extenders';
import app from 'flarum/admin/app';

const t = (key) => app.translator.trans(`ernestdefoe-shelf.admin.${key}`);

// Callbacks, not values: this module runs before the app has booted.
export default [
  new Admin()
    .setting(() => ({
      setting: 'ernestdefoe-shelf.min_ratings',
      type: 'number',
      min: 1,
      max: 100,
      label: t('min_ratings_label'),
      help: t('min_ratings_help'),
    }))
    .permission(() => ({ icon: 'fas fa-star', label: t('permission_use'), permission: 'ernestdefoe-shelf.use' }), 'reply', 90)
    .permission(() => ({ icon: 'fas fa-layer-group', label: t('permission_moderate'), permission: 'ernestdefoe-shelf.moderate' }), 'moderate', 90),
];
