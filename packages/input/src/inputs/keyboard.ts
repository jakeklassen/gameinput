import { IDocument } from '../apis.ts';
import { Control, TriggerControl } from '../core/control.ts';
import { findKeyValue, getKeyLabel } from '../maps/keyboard.ts';
import { store } from '../store.ts';
import { Vector2 } from '../utils/math.ts';

const arrowKeyTemplates: { [name: string]: [string, string[]] } = {
  arrows: ['Arrow keys', ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']],
  wasd: ['WASD', ['W', 'A', 'S', 'D']],
};

export class Keyboard {
  private document: IDocument;

  private pressedKeys: Set<string> = new Set();
  private queuedKeys: Set<string> = new Set();

  constructor({ doc = document }: { doc?: IDocument } = {}) {
    this.document = doc;

    this.document.addEventListener('keydown', (event: KeyboardEvent) => {
      store.preferGamepad = false;
      let key = event.key;

      if (key === key.toUpperCase()) key = key.toLowerCase();

      this.pressedKeys.add(key);
      this.queuedKeys.add(key);

      return false;
    });

    this.document.addEventListener('keyup', (event: KeyboardEvent) => {
      store.preferGamepad = false;
      let key = event.key;

      if (key === key.toUpperCase()) key = key.toLowerCase();

      this.pressedKeys.delete(key);
      this.queuedKeys.delete(key);

      return false;
    });
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public key(key: 'any' | (string & {})): TriggerControl<boolean> {
    if (key === 'any') {
      return {
        label: 'Any key',
        query: () => this.pressedKeys.size > 0,
        trigger: {
          label: 'Any key',
          query: () => {
            const size = this.pressedKeys.size;

            this.pressedKeys.clear();

            return size > 0;
          },
        },
      };
    }

    const keyValue = findKeyValue(key);
    const label = getKeyLabel(keyValue);

    return {
      label: getKeyLabel(keyValue),
      query: () => this.pressedKeys.has(keyValue),
      trigger: {
        label,
        query: () => this.queuedKeys.delete(keyValue),
      },
    };
  }

  public directionalKeys(
    keys: string[] | string,
    label?: string,
  ): Control<Vector2> {
    let defaultLabel;
    let keyValues: string[];

    if (typeof keys === 'string') {
      const templateId = keys.toLowerCase();

      if (templateId in arrowKeyTemplates) {
        const template = arrowKeyTemplates[templateId];
        defaultLabel = template[0];
        keyValues = template[1];
      } else {
        throw new Error(`Directional key template "${keys}" not found!`);
      }
    } else {
      if (keys.length === 4) {
        keyValues = keys.map((key) => findKeyValue(key));
        defaultLabel = keys.map((key) => getKeyLabel(key)).join('');
      } else {
        throw new Error(
          'Directional key templates have to consist of four keys!',
        );
      }
    }

    return {
      label: label ?? defaultLabel,
      query: () => {
        const vector = new Vector2();

        if (this.key(keyValues[0]).query()) vector.y -= 1; // Up
        if (this.key(keyValues[1]).query()) vector.x -= 1; // Left
        if (this.key(keyValues[2]).query()) vector.y += 1; // Down
        if (this.key(keyValues[3]).query()) vector.x += 1; // Right

        return vector;
      },
    };
  }
}
