import FormModal from 'flarum/common/components/FormModal';
import Button from 'flarum/common/components/Button';
import { t, verb, titleOf } from '../util';

/** When did you watch / read / play / listen to it? Defaults to today. */
export default class LogModal extends FormModal {
  oninit(vnode) {
    super.oninit(vnode);
    this.today = dayjs().format('YYYY-MM-DD');
    this.doneOn = this.attrs.entry?.doneOn?.slice(0, 10) || this.today;
  }

  className() {
    return 'ShelfLogModal Modal--small';
  }

  title() {
    return t(`log.title_${verb(this.attrs.media.kind())}`, { title: <em>{titleOf(this.attrs.media)}</em> });
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="Form">
          <div className="Form-group">
            <label for="shelf-done-on">{t('log.date_label')}</label>
            <input
              id="shelf-done-on"
              className="FormControl"
              type="date"
              max={this.today}
              min="1900-01-02"
              value={this.doneOn}
              oninput={(e) => (this.doneOn = e.target.value)}
              required
            />
          </div>
          <div className="Form-group">
            <Button type="submit" className="Button Button--primary Button--block">
              {t('log.save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  onsubmit(e) {
    e.preventDefault();
    this.attrs.onsave(this.doneOn || this.today);
    this.hide();
  }
}
