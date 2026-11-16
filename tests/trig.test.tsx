import React from 'react';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { render, fireEvent, act } from '@testing-library/react';
import type { TrigFrame } from '../src/types';
import { TrigSlide } from '../src/components/TrigSlide';
import {
  circleCoordinates,
  circleSolutionAngles,
  equivalentAngles,
  trigDomain,
  trigSeries,
  trigSolutions,
  satisfiesTrigRelation,
  angleLabel,
} from '../src/components/trig-model';
import { renderPrintSurface } from '../src/components/print-surfaces';
import { theme } from '../src/theme';
import App from '../src/App';
import { activities, exercises } from '../src/content';
import { definePresentation } from '../src/content/define';
import { ui } from '../src/ui';

const pi = Math.PI;
const close = (actual: number, expected: number, message = '') =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`);

it('the same real parameter gives the correct circle coordinates and curve ordinates', () => {
  // Independent geometric definition: the unit circle is (cos θ, sin θ),
  // but the angle of the triple-angle exercise is θ=3x, not x.
  for (const x of [-2 * pi, -pi / 3, 0, pi / 6, (5 * pi) / 4, 4 * pi]) {
    const point = circleCoordinates('winding', x);
    close(point.theta, x);
    close(point.cos, Math.cos(x));
    close(point.sin, Math.sin(x));
    close(point.cos ** 2 + point.sin ** 2, 1);
    const curves = trigSeries('winding');
    close(curves.find((curve) => curve.id === 'sin')!.value(x), point.sin);
    close(curves.find((curve) => curve.id === 'cos')!.value(x), point.cos);
  }
  const triple = circleCoordinates('sine-triple', pi / 6);
  close(triple.theta, pi / 2);
  close(triple.cos, 0);
  close(triple.sin, 1);
  close(trigSeries('sine-triple')[0].value(pi / 6), 1);
  assert.equal(trigSeries('sine-triple')[0].label, 'sin(3x)');
});

it('winding preserves distinct real preimages and uses signed angles', () => {
  const domain = trigDomain('winding');
  const angles = equivalentAngles(0, domain);
  assert.deepEqual(angles, [-2 * pi, 0, 2 * pi, 4 * pi]);
  for (const angle of angles) {
    const point = circleCoordinates('winding', angle);
    close(point.cos, 1);
    close(point.sin, 0);
    close(point.theta, angle);
  }
  const negative = circleCoordinates('winding', -pi / 2);
  close(negative.sin, -1);
  assert.equal(angleLabel(-pi / 2), '−π/2');
  assert.equal(angleLabel((13 * pi) / 6), '13π/6');
  assert.ok(
    angleLabel(0.37).startsWith('≈'),
    'Intermediate values must not claim exact π fractions',
  );
});

it('displayed equation roots cover the analytic families in each visible window', () => {
  const cases = [
    {
      kind: 'sine-triple' as const,
      start: pi / 6,
      period: (2 * pi) / 3,
      offsets: [0],
      equation: (x: number) => Math.sin(3 * x) - 1,
    },
    {
      kind: 'cosine-half' as const,
      start: 0,
      period: 2 * pi,
      offsets: [pi / 3, -pi / 3],
      equation: (x: number) => 4 * Math.cos(x) + 1 - 3,
    },
    {
      kind: 'sine-cosine' as const,
      start: pi / 4,
      period: pi,
      offsets: [0],
      equation: (x: number) => Math.cos(x) - Math.sin(x),
    },
  ];
  for (const { kind, start, period, offsets, equation } of cases) {
    const [lo, hi] = trigDomain(kind);
    const expected: number[] = [];
    for (let k = -10; k <= 10; k++)
      for (const offset of offsets) {
        const root = start + offset + k * period;
        if (root >= lo && root <= hi) expected.push(root);
      }
    expected.sort((a, b) => a - b);
    const roots = trigSolutions(kind);
    assert.equal(roots.length, expected.length, kind);
    roots.forEach((root, index) => {
      close(root, expected[index], kind);
      close(equation(root), 0, `${kind}: original equation`);
      assert.ok(satisfiesTrigRelation(kind, root));
    });
    for (const theta of circleSolutionAngles(kind)) {
      const matching = roots.some((x) => {
        const point = circleCoordinates(kind, x);
        return (
          Math.abs(point.cos - Math.cos(theta)) < 1e-9 &&
          Math.abs(point.sin - Math.sin(theta)) < 1e-9
        );
      });
      assert.ok(matching, `${kind}: every circle solution has a curve preimage`);
    }
  }
});

it('the strict cosine inequality excludes both equality endpoints and respects the imposed interval', () => {
  assert.deepEqual(trigDomain('cosine-inequality'), [0, 2 * pi]);
  const boundaries = trigSolutions('cosine-inequality');
  close(boundaries[0], pi / 6);
  close(boundaries[1], (11 * pi) / 6);
  for (const boundary of boundaries) {
    close(Math.cos(boundary), Math.sqrt(3) / 2);
    assert.equal(satisfiesTrigRelation('cosine-inequality', boundary), false);
  }
  for (const x of [-pi, 0, pi / 12, pi / 3, pi, (3 * pi) / 2, (23 * pi) / 12, 2 * pi, 3 * pi]) {
    const expected = x >= 0 && x <= 2 * pi && Math.cos(x) < Math.sqrt(3) / 2;
    assert.equal(satisfiesTrigRelation('cosine-inequality', x), expected, `x=${x}`);
  }
});

it('author validation rejects invalid angles and conflicting or misleading trigonometric surfaces', () => {
  const lesson = (trig: TrigFrame) => {
    const deck = structuredClone(exercises);
    deck[0].activities[0].steps = [
      { title: 'Repère', tex: 'x', why: 'Lire les coordonnées.', trig },
    ];
    return deck;
  };
  assert.throws(() => definePresentation(lesson({ kind: 'winding', angle: NaN })), /finite real/);
  assert.throws(
    () => definePresentation(lesson({ kind: 'winding', angle: 0, fromAngle: Infinity })),
    /finite real/,
  );
  assert.throws(
    () => definePresentation(lesson({ kind: 'cosine-half', angle: pi / 3, interactive: true })),
    /exploration/,
  );
  const conflict = lesson({ kind: 'winding', angle: 0 });
  conflict[0].activities[0].steps[0].graph = 'log';
  assert.throws(() => definePresentation(conflict), /one presentation surface/);
});

it('print keeps the circle, curves and real line together without exploration controls', () => {
  const host = document.createElement('div');
  host.innerHTML = renderPrintSurface({
    title: 'Un angle dans les deux vues',
    tex: String.raw`\sin(3x)=1`,
    why: 'L’angle du cercle vaut 3x.',
    trig: { kind: 'sine-triple', angle: pi / 6, fromAngle: 0, showSolutions: true },
  });
  const surface = host.querySelector('[data-trig-kind="sine-triple"]');
  assert.ok(surface);
  close(Number(surface.getAttribute('data-parameter')), pi / 6);
  close(Number(surface.getAttribute('data-circle-angle')), pi / 2);
  assert.ok(host.querySelectorAll('svg[role="img"]').length >= 3);
  assert.equal(host.querySelector('input,button'), null);
  assert.ok(host.textContent!.includes('sin(3x)'));
  assert.ok(!/NaN|Infinity/.test(host.innerHTML));
});

it('strict inequality boundaries remain visually open in all three views', () => {
  for (const angle of [pi / 6, (11 * pi) / 6]) {
    const host = document.createElement('div');
    host.innerHTML = renderPrintSurface({
      title: 'Bornes exclues',
      tex: String.raw`\cos x<\frac{\sqrt3}{2}`,
      why: 'L’égalité ne satisfait pas une inégalité stricte.',
      trig: { kind: 'cosine-inequality', angle, showSolutions: true },
    });
    const endpoints = [...host.querySelectorAll('[data-endpoint="excluded"]')];
    assert.ok(endpoints.length >= 6, 'Each boundary must be open on circle, curve and line');
    for (const endpoint of endpoints) {
      assert.ok(
        [theme.board, 'none'].includes(endpoint.getAttribute('fill') || ''),
        'Excluded endpoints must not use a filled solution dot',
      );
    }
    const current = host.querySelector('.trig-circle-current');
    assert.ok(current);
    assert.ok(
      [theme.board, 'none'].includes(current.getAttribute('fill') || ''),
      'Current point must not cover an excluded endpoint with a filled dot',
    );
  }
});

it('exploration moves circle and curve markers together and a full turn preserves both values', () => {
  const frame: TrigFrame = { kind: 'winding', angle: pi / 6, interactive: true };
  const { container, getByRole } = render(
    <TrigSlide frame={frame} tex="x" reduced animate={false} speed={1} pauseSignal={0} />,
  );
  const root = () => container.querySelector('[data-trig-kind]')!;
  fireEvent.change(getByRole('slider', { name: 'Angle θ en radians' }), {
    target: { value: String(-pi / 2) },
  });
  close(Number(root().getAttribute('data-parameter')), -pi / 2);
  close(Number(root().getAttribute('data-circle-angle')), -pi / 2);
  const point = () => container.querySelector('.trig-circle-current')!;
  close(Number(point().getAttribute('data-sin')), -1);
  const curve = () => container.querySelector('.trig-curve-current[data-function="sin θ"]')!;
  close(Number(curve().getAttribute('data-value')), -1);
  fireEvent.click(getByRole('button', { name: 'Ajouter un tour (+2π)' }));
  close(Number(root().getAttribute('data-parameter')), (3 * pi) / 2);
  close(Number(point().getAttribute('data-sin')), -1);
  close(Number(curve().getAttribute('data-value')), -1);
  fireEvent.click(getByRole('button', { name: 'Retirer un tour (−2π)' }));
  close(Number(root().getAttribute('data-parameter')), -pi / 2);
  assert.equal(
    getByRole('button', { name: 'Retirer un tour (−2π)' }).hasAttribute('disabled'),
    true,
  );
});

it('movement honors live speed, pause, replay and reduced motion without losing its angle', () => {
  const priorRequest = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const priorCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  let nextId = 0;
  const pending = new Map<number, FrameRequestCallback>();
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      const id = ++nextId;
      pending.set(id, callback);
      return id;
    },
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    value: (id: number) => pending.delete(id),
  });
  const advance = (now: number) =>
    act(() => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    });
  const frame: TrigFrame = { kind: 'winding', fromAngle: 0, angle: 2 * pi };
  try {
    const view = (speed: number, pauseSignal: number, reduced = false, replay = 0) => (
      <TrigSlide
        key={replay}
        frame={frame}
        tex="x"
        reduced={reduced}
        animate
        speed={speed}
        pauseSignal={pauseSignal}
      />
    );
    const { container, rerender, unmount } = render(view(1, 0));
    const angle = () =>
      Number(container.querySelector('[data-trig-kind]')!.getAttribute('data-parameter'));
    close(angle(), 0);
    advance(0);
    advance(400);
    const first = angle();
    assert.ok(first > 0 && first < 2 * pi);
    rerender(view(2, 0));
    close(angle(), first, 'Speed changes must not restart movement');
    advance(800);
    close(
      angle() - first,
      2 * first,
      'Twice the speed doubles progress over the same elapsed time',
    );
    const paused = angle();
    rerender(view(2, 1));
    advance(1400);
    close(angle(), paused, 'Pause must retain the current angle');
    assert.equal(pending.size, 0);
    rerender(view(1, 1, false, 1));
    close(angle(), 0, 'Replay starts from the authored source angle');
    advance(1500);
    advance(1800);
    assert.ok(angle() > 0);
    rerender(view(1, 1, true, 1));
    close(angle(), 2 * pi, 'Reduced motion must show the destination immediately');
    assert.equal(pending.size, 0);
    unmount();
  } finally {
    if (priorRequest) Object.defineProperty(globalThis, 'requestAnimationFrame', priorRequest);
    else delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame;
    if (priorCancel) Object.defineProperty(globalThis, 'cancelAnimationFrame', priorCancel);
    else delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame;
  }
});

it('the lesson keeps synchronized views and explanations aligned when jumping and going backward', () => {
  const activity = activities.find((entry) => entry.id === 'td3-6-rappel')!;
  const target = activity.steps.findIndex((step) => step.trig?.interactive);
  assert.ok(target > 0);
  window.location.hash = '#activity/td3-6-rappel';
  const { container, getByRole } = render(<App />);
  fireEvent.change(getByRole('combobox', { name: ui.chooseStep }), {
    target: { value: String(target) },
  });
  const slider = getByRole('slider', { name: 'Angle θ en radians' });
  fireEvent.keyDown(slider, { key: 'ArrowRight' });
  assert.equal(
    container.querySelector('.reading-explanation p')!.textContent,
    activity.steps[target].why,
  );
  const priorGraph = activity.steps.findIndex((step) => step.trig?.angle === -pi / 2);
  fireEvent.change(getByRole('combobox', { name: ui.chooseStep }), {
    target: { value: String(priorGraph) },
  });
  close(
    Number(container.querySelector('[data-trig-kind]')!.getAttribute('data-parameter')),
    -pi / 2,
  );
  fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
  const previous = activity.steps[priorGraph - 1];
  close(
    Number(container.querySelector('[data-trig-kind]')!.getAttribute('data-parameter')),
    previous.trig!.angle,
  );
  assert.equal(container.querySelector('.reading-explanation p')!.textContent, previous.why);
});
