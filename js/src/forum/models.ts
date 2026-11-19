import Model from 'flarum/common/Model';
import type User from 'flarum/common/models/User';

/** A list's first four posters, kept on the list so cards cost nothing. */
export interface PreviewPoster {
  poster: string | null;
  kind: string;
}

export class Entry extends Model {
  rating() {
    return Model.attribute<number | null>('rating').call(this);
  }
  status() {
    return Model.attribute<'want' | 'done' | null>('status').call(this);
  }
  owned() {
    return Model.attribute<boolean>('owned').call(this);
  }
  doneOn() {
    return Model.attribute<string | null>('doneOn').call(this);
  }
  ratedAt() {
    return Model.attribute('ratedAt', Model.transformDate).call(this);
  }
  updatedAt() {
    return Model.attribute('updatedAt', Model.transformDate).call(this);
  }
  user() {
    return Model.hasOne<User>('user').call(this);
  }
  media() {
    return Model.hasOne<MarqueeMedia>('media').call(this);
  }
}

export class ShelfList extends Model {
  name() {
    return Model.attribute<string>('name').call(this);
  }
  description() {
    return Model.attribute<string | null>('description').call(this);
  }
  itemCount() {
    return Model.attribute<number>('itemCount').call(this);
  }
  preview() {
    return Model.attribute<PreviewPoster[] | null>('preview').call(this);
  }
  createdAt() {
    return Model.attribute('createdAt', Model.transformDate).call(this);
  }
  updatedAt() {
    return Model.attribute('updatedAt', Model.transformDate).call(this);
  }
  user() {
    return Model.hasOne<User>('user').call(this);
  }
  media() {
    return Model.hasMany<MarqueeMedia>('media').call(this);
  }
}
