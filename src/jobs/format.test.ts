import { describe, expect, it } from 'vitest'
import { scoreTone, scoreValue, timeAgo } from './format'

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

describe('scoreTone', () => {
  it.each([
    [null, 'none'],
    [0, 'low'],
    [44, 'low'],
    [45, 'mid'],
    [59, 'mid'],
    [60, 'high'],
  ] as const)('puts %j in band %s', (score, tone) => {
    expect(scoreTone(score)).toBe(tone)
  })
})
