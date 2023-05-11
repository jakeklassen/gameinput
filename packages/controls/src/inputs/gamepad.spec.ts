import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IGamepad, IGamepadButton, INavigator, IWindow } from '../apis.ts';
import { store } from '../store.ts';
import { Vector2 } from '../utils/math.ts';
import { MockEventTarget } from '../utils/mock.ts';
import { Gamepad } from './gamepad.ts';

class MockWindow extends MockEventTarget implements IWindow {}

class MockNavigator extends MockEventTarget implements INavigator {
  public gamepads: IGamepad[] = [];

  public getGamepads(): IGamepad[] {
    return this.gamepads;
  }
}

class MockGamepad implements IGamepad {
  public index = 0;
  public buttons: IGamepadButton[] = [];
  public axes: number[] = [];
  public connected = true;
  public timestamp = 1000;
  public mapping = 'standard';
}

interface MockPack {
  win: MockWindow;
  nav: MockNavigator;
  gamepad: Gamepad;
}

function mockPack(): MockPack {
  const win = new MockWindow();
  const nav = new MockNavigator();
  const gamepad = new Gamepad({ win, nav });
  return { win, nav, gamepad };
}

describe('The `Gamepad` class', () => {
  it('should register the required listeners on the window', () => {
    const { win } = mockPack();

    expect(Object.keys(win.listeners).sort()).to.deep.equal(
      ['gamepadconnected', 'gamepaddisconnected'].sort(),
    );
  });

  describe('should have an `isConnected()` method that', () => {
    const { win, nav, gamepad } = mockPack();

    it('returns `false` before any gamepad was connected', () => {
      expect(gamepad.isConnected()).to.equal(false);
    });

    it('returns `true` after a gamepad was connected', () => {
      nav.gamepads[0] = new MockGamepad();
      win.listeners.gamepadconnected({ gamepad: nav.gamepads[0] });
      expect(gamepad.isConnected()).to.equal(true);
    });

    it('returns `false` after the gamepad was disconnected', () => {
      nav.gamepads.pop();
      win.listeners.gamepaddisconnected({ gamepad: { index: 0 } });
      expect(gamepad.isConnected()).to.equal(false);
    });

    it('returns `false` after a non-standard gamepad was connected', () => {
      nav.gamepads[0] = new MockGamepad();
      nav.gamepads[0].mapping = 'non-standard';
      win.listeners.gamepadconnected({ gamepad: nav.gamepads[0] });
      expect(gamepad.isConnected()).to.equal(false);
    });

    it('returns `true` again after a gamepad was connected', () => {
      nav.gamepads[0] = new MockGamepad();
      win.listeners.gamepadconnected({ gamepad: nav.gamepads[0] });
      expect(gamepad.isConnected()).to.equal(true);
    });

    afterAll(() => {
      nav.gamepads.pop();
      win.listeners.gamepaddisconnected({ gamepad: { index: 0 } });
    });
  });

  describe('in its disconnected state', () => {
    const { gamepad } = mockPack();

    it('should set `store.preferGamepad` to `false`', () => {
      expect(store.preferGamepad).to.equal(false);
    });

    describe('should have an `button()` method that returns a component that', () => {
      it('when queried `false`', () => {
        expect(gamepad.button(0).query()).to.equal(false);
      });

      it('when queried in `trigger` moder returns `false`', () => {
        expect(gamepad.button(0).trigger.query()).to.equal(false);
      });
    });

    describe('should have a `stick()` method that returns a component that', () => {
      it('returns a zero vector when queried', () => {
        expect(gamepad.stick('left').query()).to.deep.equal({ x: 0, y: 0 });
      });
    });

    describe('should have a `vibrate()` method that', () => {
      it("doesn't throw an error when called", async () => {
        await gamepad.vibrate(1000);
      });
    });
  });

  describe('in its connected state', () => {
    const { win, nav, gamepad } = mockPack();

    beforeAll(() => {
      nav.gamepads[0] = {
        index: 0,
        buttons: [{ pressed: false }],
        axes: [0, 0, 0, 0],
        connected: true,
        timestamp: 0,
        mapping: 'standard',
      };

      win.listeners.gamepadconnected({ gamepad: nav.gamepads[0] });
    });

    it('should not allow another gamepad to be connected', () => {
      nav.gamepads[1] = {
        index: 1,
        buttons: [{ pressed: true }],
        axes: [0, 0, 0, 0],
        connected: true,
        timestamp: 0,
        mapping: 'standard',
      };

      win.listeners.gamepadconnected({ gamepad: nav.gamepads[1] });

      expect(gamepad.button(0).query()).to.equal(false);
    });

    it('should stay connected gamepad if another gamepad is disconnected', () => {
      win.listeners.gamepaddisconnected({ gamepad: nav.gamepads[1] });

      expect(gamepad.isConnected()).to.equal(true);
    });

    it('should set `store.preferGamepad` to `true`', () => {
      expect(store.preferGamepad).to.equal(true);
    });

    describe('should have a `button()` method that returns a component that', () => {
      it('returns `false` when the button is not pressed', () => {
        expect(gamepad.button(0).query()).to.equal(false);
      });

      it('returns `true` when the button is pressed', () => {
        nav.gamepads[0].buttons[0].pressed = true;
        expect(gamepad.button(0).query()).to.equal(true);
      });

      it('returns `true` when any button is pressed', () => {
        nav.gamepads[0].buttons[0].pressed = false;
        nav.gamepads[0].buttons[1] = { pressed: true };

        expect(gamepad.button('*').query()).to.equal(true);
      });

      it('returns `false` when any button is not pressed', () => {
        nav.gamepads[0].buttons[0].pressed = false;
        nav.gamepads[0].buttons[1] = { pressed: false };

        expect(gamepad.button('*').query()).to.equal(false);
      });

      describe('when queried in `trigger` mode', () => {
        it('returns `false` when the key is not pressed', () => {
          nav.gamepads[0].buttons[0].pressed = false;
          expect(gamepad.button(0).trigger.query()).to.equal(false);
        });

        it('returns `true` once after the key was pressed', () => {
          nav.gamepads[0].buttons[0].pressed = true;
          expect(gamepad.button(0).trigger.query()).to.equal(true);
        });

        it('returns `false` after the key state was queried', () => {
          expect(gamepad.button(0).trigger.query()).to.equal(false);
        });
      });
    });

    describe('should have a `stick()` method that returns a component that', () => {
      it('throws an error when initialized with an invalid stick', () => {
        expect(() => gamepad.stick('lol')).to.throw(
          Error,
          'Gamepad stick "lol" not found!',
        );
      });

      it('returns a (0, 0) vector when initially queried', () => {
        expect(gamepad.stick('left').query()).to.deep.equal(new Vector2());
      });

      it('returns the correct vector when queried after change', () => {
        nav.gamepads[0].axes[0] = 0.56;
        nav.gamepads[0].axes[1] = 0.31;
        expect(gamepad.stick('left').query()).to.deep.equal(
          new Vector2(0.56, 0.31),
        );
      });

      it('also works with custom axis numbers', () => {
        nav.gamepads[0].axes[2] = 0.42;
        nav.gamepads[0].axes[3] = 0.69;
        expect(
          gamepad.stick({ label: '', xAxis: 2, yAxis: 3 }).query(),
        ).to.deep.equal(new Vector2(0.42, 0.69));
      });
    });

    describe('should have a `vibrate()` method that', () => {
      it('correctly passes along the provided options', () => {
        let playEffectArgs: any[] = [];

        nav.gamepads[0].vibrationActuator = {
          type: 'dual-rumble',
          playEffect: async (...args) => {
            playEffectArgs = args;
          },
        };

        gamepad.vibrate(1000, { weakMagnitude: 0.5, strongMagnitude: 1 });

        expect(playEffectArgs).to.deep.equal([
          'dual-rumble',
          { duration: 1000, weakMagnitude: 0.5, strongMagnitude: 1 },
        ]);
      });

      it('ignores actuators that are not of type `dual-rumble`', () => {
        let playEffectCalled = false;

        nav.gamepads[0].vibrationActuator = {
          type: 'not-dual-rumble',
          playEffect: async () => {
            playEffectCalled = true;
          },
        };

        gamepad.vibrate(1000);
        expect(playEffectCalled).to.equal(false);
      });
    });
  });
});
