import { extend } from 'flarum/common/extend';

/**
 * fof/forum-widgets-core, shared by the forum (which renders the widgets) and
 * the admin (whose layout editor places them).
 *
 * 🚨 OPT-IN. FoF shows any registered widget that no saved layout mentions, in
 * its default section, so a widget registered only on the forum side appeared
 * in a right-hand column on every forum with FoF installed, even one whose
 * layout had no widgets at all, and FoF's editor could not take it out (the
 * same bug as Cadence's, Discuss d/39992/14). Now a widget shows only once the
 * admin has dragged it into a section and saved; until then it waits in the
 * editor's list of available widgets.
 */

import type Mithril from 'mithril';

/** A widget instance in FoF's saved layout. */
interface Placed {
  id?: string;
}

/** A saved layout: where widgets are placed, and the ones left out. */
interface Layout {
  instances?: (Placed | null)[];
  disabled?: string[];
}

/** FoF's layout editor, as far as Shelf touches it. */
interface LayoutEditor {
  config?: Layout;
  oninit(): void;
}

/** What FoF keeps on the app: its widget manager and the saved layout. */
export interface WidgetHost {
  widgets?: {
    widgets: { extension: string }[];
    config?: Layout;
  };
}

/** A widget offered to FoF's layout editor. */
export interface EditorWidget {
  key: string;
  icon: string;
  title: () => Mithril.Children;
  placement?: string;
}

/** A module of fof/forum-widgets-core, at runtime — never a build-time import. */
// `any`: FoF ships no typings, and its classes are only known at run time.
export function fof(path: string): any {
  const mod = flarum.reg.get('fof-forum-widgets-core', path) as { default?: unknown } | undefined;
  return mod?.default ?? mod;
}

export function hasFofWidgets(): boolean {
  return 'fof-forum-widgets-core' in flarum.extensions;
}

/** Whether the saved layout places this widget in a section. */
export function placed(host: WidgetHost, extension: string, key: string): boolean {
  return (host.widgets?.config?.instances || []).some((i) => i?.id === `${extension}:${key}`);
}

/**
 * Offer the widgets to FoF's layout editor, which lists only widgets
 * registered on the admin side too. Registered as the editor opens; a widget
 * no saved layout places goes in the editor's list of available widgets, not
 * into a section — FoF would otherwise draw it placed, while the forum rightly
 * shows nothing until it is saved.
 */
export function registerEditorWidgets(app: object, extension: string, widgets: EditorWidget[]): void {
  const Widgets = fof('common/extend/Widgets');
  const WidgetEditor = fof('admin/components/WidgetEditor');
  if (!Widgets || !WidgetEditor) return;

  const host = app as WidgetHost;

  // FoF has no public hook for this: its editor is the only place that knows
  // which widgets a layout leaves out, and without this an unplaced widget
  // shows on every forum (see the OPT-IN note above). Skipped if FoF moves it.
  extend(WidgetEditor.prototype as LayoutEditor, 'oninit', function () {
    const manager = host.widgets;
    if (!manager) return;

    if (!manager.widgets.some((w) => w.extension === extension)) {
      const add = new Widgets();
      widgets.forEach((w, position) =>
        add.add({
          key: w.key,
          component: { component: () => null },
          title: w.title,
          icon: w.icon,
          isDisabled: false,
          isUnique: true,
          placement: w.placement || 'end',
          position,
        })
      );
      add.extend(app, extension);
    }

    const config: Layout = this.config || {};
    const disabled = config.disabled || [];
    const unplaced = widgets
      .map((w) => `${extension}:${w.key}`)
      .filter((id) => !disabled.includes(id) && !(config.instances || []).some((i) => i?.id === id));
    config.disabled = [...disabled, ...unplaced];
  });
}
