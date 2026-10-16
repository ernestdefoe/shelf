import Model from 'flarum/common/Model';

export class Entry extends Model {}

Object.assign(Entry.prototype, {
  rating: Model.attribute('rating'),
  status: Model.attribute('status'),
  owned: Model.attribute('owned'),
  doneOn: Model.attribute('doneOn'),
  ratedAt: Model.attribute('ratedAt', Model.transformDate),
  updatedAt: Model.attribute('updatedAt', Model.transformDate),
  user: Model.hasOne('user'),
  media: Model.hasOne('media'),
});

export class ShelfList extends Model {}

Object.assign(ShelfList.prototype, {
  name: Model.attribute('name'),
  description: Model.attribute('description'),
  itemCount: Model.attribute('itemCount'),
  preview: Model.attribute('preview'),
  createdAt: Model.attribute('createdAt', Model.transformDate),
  updatedAt: Model.attribute('updatedAt', Model.transformDate),
  user: Model.hasOne('user'),
  media: Model.hasMany('media'),
});
