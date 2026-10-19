import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildModelPools } from '../src/providers/antigravity';

test('buildModelPools: 依家族分池，池內以剩餘最少的模型為代表', () => {
  const windows = buildModelPools({
    cascadeModelConfigData: {
      clientModelConfigs: [
        { label: 'Gemini 3 Pro', modelId: 'gemini-3-pro', quotaInfo: { remainingFraction: 0.8 } },
        { label: 'Claude Sonnet', modelId: 'claude-sonnet', quotaInfo: { remainingFraction: 0.9 } },
        {
          label: 'Claude Opus',
          modelId: 'claude-opus',
          quotaInfo: { remainingFraction: 0.25, resetTime: '2026-10-13T15:00:00Z' },
        },
        { label: 'Gemini Flash', modelId: 'gemini-flash', quotaInfo: {} },
      ],
    },
  });
  assert.deepEqual(
    windows.map((w) => [w.label, w.usedPercent]),
    [
      ['Claude pool', 75],
      ['Gemini pool', 20],
    ]
  );
  assert.equal(windows[0]?.resetsAt?.toISOString(), '2026-10-13T15:00:00.000Z');
});

test('buildModelPools: Gemini 4 Argon 與 Gemini 3.8 Flash 分開計算配額池', () => {
  const windows = buildModelPools({
    cascadeModelConfigData: {
      clientModelConfigs: [
        {
          label: 'Gemini 4 Argon (High)',
          modelId: 'gemini-4-argon-high',
          quotaInfo: { remainingFraction: 0.85, resetTime: '2026-10-25T03:20:36Z' },
        },
        {
          label: 'Gemini 4 Argon (Low)',
          modelId: 'gemini-4-argon-low',
          quotaInfo: { remainingFraction: 0.85, resetTime: '2026-10-25T03:20:36Z' },
        },
        {
          label: 'Gemini 3.8 Flash (High)',
          modelId: 'gemini-3.8-flash-high',
          quotaInfo: { remainingFraction: 0.95, resetTime: '2026-10-18T08:20:30Z' },
        },
        {
          label: 'Claude Opus 5.5 (High)',
          modelId: 'claude-opus-5-5-high',
          quotaInfo: { remainingFraction: 1, resetTime: '2026-10-18T08:30:23Z' },
        },
      ],
    },
  });
  assert.deepEqual(
    windows.map((w) => [w.label, w.usedPercent, w.resetsAt?.toISOString()]),
    [
      ['Claude pool', 0, '2026-10-18T08:30:23.000Z'],
      ['Gemini 4 Argon pool', 15, '2026-10-25T03:20:36.000Z'],
      ['Gemini 3.8 Flash pool', 5, '2026-10-18T08:20:30.000Z'],
    ]
  );
});

test('buildModelPools: 沒有模型設定時回空陣列', () => {
  assert.deepEqual(buildModelPools({}), []);
});
