import FormModal, { type IFormModalAttrs } from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';
import type Mithril from 'mithril';
import type { ShelfList } from '../models';
import { t } from '../util';
import { updateList } from '../api';

export interface ListEditModalAttrs extends IFormModalAttrs {
  list?: ShelfList;
  onsave?: (list: ShelfList) => void;
}

/** Create a list (no `list` attr) or rename and describe one. */
export default class ListEditModal extends FormModal<ListEditModalAttrs> {
  name = '';
  description = '';

  oninit(vnode: Mithril.Vnode<ListEditModalAttrs, this>) {
    super.oninit(vnode);
    const list = this.attrs.list;
    this.name = list ? list.name() : '';
    this.description = list?.description() || '';
  }

  className() {
    return 'ShelfListEditModal Modal--small';
  }

  title() {
    return t(this.attrs.list ? 'lists.edit_title' : 'lists.new_title');
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">
          <div className="Form-group">
            <label for="shelf-list-name">{t('lists.name_label')}</label>
            <input
              id="shelf-list-name"
              className="FormControl"
              maxlength="100"
              required
              value={this.name}
              oninput={(e: InputEvent & { target: HTMLInputElement }) => {
                this.name = e.target.value;
              }}
            />
          </div>
          <div className="Form-group">
            <label for="shelf-list-description">{t('lists.description_label')}</label>
            <textarea
              id="shelf-list-description"
              className="FormControl"
              rows="3"
              maxlength="1000"
              value={this.description}
              oninput={(e: InputEvent & { target: HTMLTextAreaElement }) => {
                this.description = e.target.value;
              }}
            />
          </div>
          <div className="Form-group">
            <Button type="submit" className="Button Button--primary Button--block" loading={this.loading} disabled={!this.name.trim()}>
              {t('lists.save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  onsubmit(e: SubmitEvent) {
    e.preventDefault();
    this.loading = true;

    updateList(this.attrs.list || null, { name: this.name.trim(), description: this.description.trim() || null }).then((list) => {
      this.hide();
      this.attrs.onsave?.(list);
    }, this.loaded.bind(this));
  }
}
