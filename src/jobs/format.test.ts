import { describe, expect, it } from 'vitest'
import { BAND_LABELS, scoreBand, scoreValue, timeAgo } from './format'

describe('timeAgo', () => {
  const now = new Date('2026-11-25T12:00:00Z')

  it.each([
    ['2026-11-25T11:59:40Z', 'just now'],
    ['2026-11-25T12:05:00Z', 'just now'],
    ['2026-11-25T11:55:00Z', '5 min ago'],
    ['2026-11-25T09:00:00Z', '3 h ago'],
    ['2026-11-23T11:00:00Z', '2 d ago'],
  ])('formats %s as %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected)
  })
})

describe('scoreValue', () => {
  it.each([
    [63, 63],
    ['63', 63],
    [0, 0],
    [null, null],
    ['', null],
    ['abc', null],
  ])('reads %j as %j', (input, expected) => {
    expect(scoreValue(input)).toBe(expected)
  })
})

describe('scoreBand', () => {
  it.each([
    [null, 'none'],
    [0, 'rejected'],
    [1, 'weak'],
    [34, 'weak'],
    [35, 'maybe'],
    [54, 'maybe'],
    [55, 'good'],
    [74, 'good'],
    [75, 'excellent'],
    [100, 'excellent'],
  ] as const)('puts %j in band %s', (score, band) => {
    expect(scoreBand(score)).toBe(band)
  })

  it('has a label for every band', () => {
    expect(Object.values(BAND_LABELS)).toEqual(['Excellent', 'Good', 'Maybe', 'Weak', 'Rejected', 'Not scored'])
  })
})
