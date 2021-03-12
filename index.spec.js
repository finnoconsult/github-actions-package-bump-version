import { getBumpTypes, parseRegex } from './index.js';

describe('test makeRegex', () => {
  it('string', () => expect(parseRegex('fix')).toEqual(/fix/));
  it('string', () => expect(parseRegex('^fix')).toEqual(/^fix/));
  it('with regex notation / / ', () => expect(parseRegex('/^fix/')).toEqual(/^fix/));
  it('with regex notation / / with / ', () => expect(parseRegex('/^fix\//')).toEqual(/^fix\//));
  it('with modifier ', () => expect(parseRegex('/^fix/gi')).toEqual(/^fix/gi));
  it('with modifier ', () => expect(parseRegex('/^fix/gi')).not.toEqual(/^fix/i));
  it('string with /', () => expect(parseRegex('^fix/')).toEqual(/^fix\//));
})

describe('check regex config', () => {
  const types = {
    major: '/^major/',
    minor: '/^feat/',
    patch: '/^fix/',
  }
  it('minor', () => expect(getBumpTypes(['feature', 'not relevant', 'nothing'], types)).toEqual(['minor']));
  it('nothing', () => expect(getBumpTypes(['not fix', 'nothing'], types)).toEqual([]));
  it('fix', () => expect(getBumpTypes(['any', 'fix', 'nothing'], types)).toEqual(['patch']));
  it('fix', () => expect(getBumpTypes(['fix/sometitle'], types)).toEqual(['patch']));
});

describe('check simple string config', () => {
  const types = {
    major: 'major',
    minor: 'feat',
    patch: 'fix',
  }
  it('minor', () => expect(getBumpTypes(['feature', 'not relevant', 'nothing'], types)).toEqual(['minor']));
  it('minor', () => expect(getBumpTypes(['feat', 'not relevant', 'nothing'], types)).toEqual(['minor']));
  it('fix', () => expect(getBumpTypes(['not fix', 'nothing'], types)).toEqual(['patch']));
  it('fix', () => expect(getBumpTypes(['any', 'fix', 'nothing'], types)).toEqual(['patch']));
  it('fix', () => expect(getBumpTypes(['fix/sometitle'], types)).toEqual(['patch']));
});


describe('check string config', () => {
  const types = {
    major: 'major',
    minor: '^feat/',
    patch: 'fix/',
  }
  it('major', () => expect(getBumpTypes(['feature', 'not relevant', 'this is a major change '], types)).toEqual(['major']));
  it('nothing', () => expect(getBumpTypes(['feat', 'nothing'], types)).toEqual([]));
  it('nothing', () => expect(getBumpTypes(['feature', 'nothing'], types)).toEqual([]));
  it('minor', () => expect(getBumpTypes(['feat/', 'any'], types)).toEqual(['minor']));
  it('minor', () => expect(getBumpTypes(['feat/'], types)).toEqual(['minor']));
});

describe('multiple', () => {
  const types = {
    major: 'major',
    minor: '^feat/',
    patch: 'fix/',
  }
  it('major', () => expect(getBumpTypes(['feat/', 'major'], types)).toEqual(['major', 'minor']));
  it('major', () => expect(getBumpTypes(['major', 'feat/'], types)).toEqual(['major', 'minor']));
  it('major', () => expect(getBumpTypes(['fix/', 'feat/'], types)).toEqual(['minor', 'patch']));
  it('major', () => expect(getBumpTypes(['feat/', 'fix/'], types)).toEqual(['minor', 'patch']));
});
