import app from 'flarum/forum/app';
import FormModal from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';
import { t } from '../util';
import { updateList } from '../api';

/** Create a list (no `list` attr) or rename and describe one. */
export default class ListEditModal extends FormModal {
  oninit(vnode) {
    super.oninit(vnode);
    const list = this.attrs.list;
    this.name = list ? list.name() : '';
    this.description = (list && list.description()) || '';
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
              oninput={(e) => (this.name = e.target.value)}
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
              oninput={(e) => (this.description = e.target.value)}
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

  onsubmit(e) {
    e.preventDefault();
    this.loading = true;

    const attributes = { name: this.name.trim(), description: this.description.trim() || null };
    const save = this.attrs.list
      ? updateList(this.attrs.list, attributes)
      : app
          .request({ method: 'POST', url: `${app.forum.attribute('apiUrl')}/shelf-lists`, body: { data: { type: 'shelf-lists', attributes } } })
          .then((payload) => app.store.pushPayload(payload));

    save.then((list) => {
      this.hide();
      if (this.attrs.onsave) this.attrs.onsave(list);
    }, this.loaded.bind(this));
  }
}
