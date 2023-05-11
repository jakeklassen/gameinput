import { describe, expect, it } from 'vitest';
import { findButtonNumber } from './gamepad.ts';

describe('The `Gamepad` mapping helper function', () => {
  describe('`findButtonNumber()`', () => {
    it('should return numbers unchanged', () => {
      expect(findButtonNumber(0)).to.equal(0);
    });

    it('should return the correct key value for a given alias', () => {
      expect(findButtonNumber('B')).to.equal(1);
    });

    it('should throw an error for nonexistent aliases', () => {
      expect(() => findButtonNumber('NonExistentButton')).to.throw(
        Error,
        'There is no gamepad button called "NonExistentButton"!',
      );
    });
  });
});
