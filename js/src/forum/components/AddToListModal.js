import app from 'flarum/forum/app';
import FormModal from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import { t, text, titleOf } from '../util';
import { myLists, addToList } from '../api';

/** Put a title on one of your lists, or on a new one. */
export default class AddToListModal extends FormModal {
  oninit(vnode) {
    super.oninit(vnode);
    this.lists = null;
    this.name = '';
    this.added = new Set();

    myLists().then((lists) => {
      this.lists = lists;
      m.redraw();
    });
  }

  className() {
    return 'ShelfAddModal Modal--small';
  }

  title() {
    return t('add.title', { title: <em>{titleOf(this.attrs.media)}</em> });
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">
          {this.lists === null ? (
            <LoadingIndicator />
          ) : this.lists.length ? (
            <ul className="ShelfAddModal-lists">
              {this.lists.map((list) => (
                <li>
                  <Button
                    className="Button Button--block"
                    icon={this.added.has(list.id()) ? 'fas fa-check' : 'fas fa-plus'}
                    disabled={this.added.has(list.id()) || this.loading}
                    onclick={() => this.add(list)}
                  >
                    {list.name()} <small>{t('lists.items', { count: list.itemCount() })}</small>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="Form-group">
            <label for="shelf-new-list">{t('add.new_list')}</label>
            <div className="ShelfAddModal-new">
              <input
                id="shelf-new-list"
                className="FormControl"
                maxlength="100"
                placeholder={text('add.new_list_placeholder')}
                value={this.name}
                oninput={(e) => (this.name = e.target.value)}
              />
              <Button type="submit" className="Button Button--primary" loading={this.loading} disabled={!this.name.trim()}>
                {t('add.create')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  add(list) {
    this.loading = true;
    addToList(list, this.attrs.media.id()).then(() => {
      this.loading = false;
      this.added.add(list.id());
      app.alerts.show({ type: 'success' }, t('add.added', { list: list.name() }));
      m.redraw();
    }, this.loaded.bind(this));
  }

  onsubmit(e) {
    e.preventDefault();
    if (!this.name.trim()) return;

    this.loading = true;
    addToList(null, this.attrs.media.id(), this.name.trim()).then((list) => {
      app.alerts.show({ type: 'success' }, t('add.added', { list: list.name() }));
      this.hide();
    }, this.loaded.bind(this));
  }
}
