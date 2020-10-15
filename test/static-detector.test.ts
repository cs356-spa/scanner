import { isBundledFile } from '../src/static_detector';

describe('isBundledFile', () => {
  test('not js', () => {
    expect(isBundledFile({url: "file.js", content: ""})).toEqual(false);
  })
})