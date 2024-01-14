import { store } from '../store.js';
import { Control } from './control.js';

export function or(...controls: Control<unknown>[]): Control<unknown> {
  if (controls.length < 2) throw new Error('Less than two controls specified!');

  return {
    get label() {
      const hasGamepadControls = controls.some(
        (control) => control.fromGamepad,
      );

      if (!hasGamepadControls) return controls[0].label;

      const control = store.preferGamepad
        ? controls.find((control) => control.fromGamepad)
        : controls.find(
            (control) => control.fromGamepad == null || !control.fromGamepad,
          );

      if (control == null) throw new Error('No control found!');

      return control.label;
    },
    query: () => {
      let sampleQueryValue;

      for (const control of controls) {
        const queryValue = control.query();
        sampleQueryValue = queryValue;

        if (Boolean(queryValue)) return queryValue;
      }

      if (typeof sampleQueryValue === 'boolean') return false;
    },
  };
}
