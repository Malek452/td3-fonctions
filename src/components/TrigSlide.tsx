import { useEffect, useId, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { TrigFrame } from '../types';
import { theme } from '../theme';
import { MathView } from './Math';
import {
  TAU,
  TRIG_STRICT_INTERVAL,
  TRIG_THRESHOLD,
  angleLabel,
  circleAngle,
  circleCoordinates,
  circleSolutionAngles,
  decimal,
  equivalentAngles,
  sampledPath,
  trigDescriptions,
  trigDomain,
  trigSeries,
  trigSolutions,
  trigTicks,
} from './trig-model';

const ink = theme.mathInk,
  sine = theme.active,
  cosine = theme.second,
  selected = theme.base;
const epsilon = 1e-8;
const near = (a: number, b: number) => Math.abs(a - b) < epsilon;
const openEndpoint = (frame: TrigFrame, x: number) =>
  frame.kind === 'cosine-inequality' && TRIG_STRICT_INTERVAL.some((bound) => near(x, bound));

/** Measure each panel, so labels retain their screen size when panels stack. */
function usePanelWidth(ref: RefObject<HTMLDivElement>, fallback: number, print: boolean) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (print || !ref.current) return;
    const node = ref.current;
    const measure = () => {
      const measured = node.getBoundingClientRect().width;
      if (measured > 0) setWidth(Math.max(240, Math.round(measured)));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref, print]);
  return width;
}

function CirclePanel({ frame, x, width }: { frame: TrigFrame; x: number; width: number }) {
  const point = circleCoordinates(frame.kind, x);
  const cx = width / 2,
    cy = 138,
    r = Math.min(91, (width - 94) / 2);
  const X = (v: number) => cx + r * v,
    Y = (v: number) => cy - r * v;
  const px = X(point.cos),
    py = Y(point.sin);
  const residual = point.theta % TAU;
  const show = frame.showSolutions;
  const boundary = openEndpoint(frame, x);
  const circleRoots = show ? circleSolutionAngles(frame.kind) : [];
  const arc = sampledPath(
    (a) => [cx + (r + 13) * Math.cos(a), cy - (r + 13) * Math.sin(a)],
    0,
    residual,
    120,
  );
  const sign = Math.sign(residual),
    ex = cx + (r + 13) * Math.cos(residual),
    ey = cy - (r + 13) * Math.sin(residual);
  const dx = -Math.sin(residual) * sign,
    dy = -Math.cos(residual) * sign;
  return (
    <svg
      className="trig-svg trig-circle"
      viewBox={`0 0 ${width} 280`}
      role="img"
      aria-label={trigDescriptions[frame.kind]}
    >
      <title>Cercle trigonométrique : abscisse cos θ, ordonnée sin θ</title>
      <g stroke={theme.line} strokeWidth="1.5" fill="none">
        <line x1={cx - r - 24} x2={cx + r + 24} y1={cy} y2={cy} />
        <line x1={cx} x2={cx} y1={cy - r - 22} y2={cy + r + 22} />
        <circle cx={cx} cy={cy} r={r} stroke={ink} strokeWidth="2" />
      </g>
      <g fill={ink} fontSize="15">
        <text x={cx - 12} y={cy + 19} textAnchor="end">
          O
        </text>
        <text x={cx + r + 12} y={cy + 20}>
          1
        </text>
        <text x={cx - r - 9} y={cy + 20} textAnchor="end">
          −1
        </text>
        <text x={cx - 12} y={cy - r - 4} textAnchor="end">
          1
        </text>
        <text x={cx - 12} y={cy + r + 22} textAnchor="end">
          −1
        </text>
        <text x={cx} y="18" textAnchor="middle">
          {frame.kind === 'sine-triple' ? 'θ = 3x' : 'M = (cos θ ; sin θ)'}
        </text>
      </g>
      {frame.kind === 'cosine-inequality' && (
        <>
          {show && (
            <path
              d={sampledPath((a) => [X(Math.cos(a)), Y(Math.sin(a))], ...TRIG_STRICT_INTERVAL, 180)}
              fill="none"
              stroke={selected}
              strokeWidth="8"
              className="trig-selected-arc"
            />
          )}
          <line
            x1={X(TRIG_THRESHOLD)}
            x2={X(TRIG_THRESHOLD)}
            y1={cy - r - 17}
            y2={cy + r + 17}
            stroke={ink}
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        </>
      )}
      {frame.kind === 'cosine-half' && (
        <>
          <line
            x1={X(0.5)}
            x2={X(0.5)}
            y1={cy - r - 13}
            y2={cy + r + 13}
            stroke={ink}
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <text x={X(0.5) + 8} y={cy + 22} fontSize="15" fill={ink}>
            1/2
          </text>
        </>
      )}
      {frame.kind === 'sine-triple' && (
        <line
          x1={cx - r - 10}
          x2={cx + r + 10}
          y1={Y(1)}
          y2={Y(1)}
          stroke={ink}
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      )}
      {frame.kind === 'sine-cosine' && (
        <line
          x1={X(-1.15)}
          x2={X(1.15)}
          y1={Y(-1.15)}
          y2={Y(1.15)}
          stroke={ink}
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      )}
      <path
        d={arc}
        stroke={ink}
        strokeWidth="2"
        fill="none"
        opacity=".65"
        className="trig-winding-arc"
      />
      {Math.abs(residual) > 0.07 && (
        <path
          d={`M${ex - 7 * dx + 4 * dy},${ey - 7 * dy - 4 * dx} L${ex},${ey} L${ex - 7 * dx - 4 * dy},${ey - 7 * dy + 4 * dx}`}
          stroke={ink}
          strokeWidth="2"
          fill="none"
        />
      )}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={ink} strokeWidth="2" />
      <line x1={px} x2={cx} y1={py} y2={py} stroke={sine} strokeWidth="2" strokeDasharray="4 4" />
      <line x1={px} x2={px} y1={py} y2={cy} stroke={cosine} strokeWidth="2" strokeDasharray="4 4" />
      <line x1={cx} x2={cx} y1={cy} y2={py} stroke={sine} strokeWidth="4" />
      <line x1={cx} x2={px} y1={cy} y2={cy} stroke={cosine} strokeWidth="4" strokeDasharray="7 4" />
      <circle
        className="trig-circle-current"
        data-circle-angle={point.theta}
        data-cos={point.cos}
        data-sin={point.sin}
        cx={px}
        cy={py}
        r="6"
        fill={boundary ? theme.board : ink}
        stroke={ink}
        strokeWidth="2"
        data-endpoint={boundary ? 'excluded' : undefined}
      />
      {!show && (
        <text
          x={px + (point.cos >= 0 ? 12 : -12)}
          y={py + (point.sin >= 0 ? -10 : 23)}
          fill={ink}
          fontSize="17"
          textAnchor={point.cos >= 0 ? 'start' : 'end'}
        >
          M
        </text>
      )}
      {circleRoots.map((a, index) => {
        const excluded = frame.kind === 'cosine-inequality';
        return (
          <circle
            key={index}
            className="trig-solution"
            data-solution-angle={a}
            data-endpoint={excluded ? 'excluded' : 'included'}
            cx={X(Math.cos(a))}
            cy={Y(Math.sin(a))}
            r="6"
            fill={excluded ? theme.board : selected}
            stroke={selected}
            strokeWidth="3"
          />
        );
      })}
      <text x={cx} y="272" fill={ink} fontSize="15" textAnchor="middle">
        {frame.kind === 'sine-triple'
          ? `Angle du cercle : θ ${angleLabel(point.theta).startsWith('≈') ? '' : '='} ${angleLabel(point.theta)}`
          : `Depuis I(1 ; 0) : θ ${angleLabel(point.theta).startsWith('≈') ? '' : '='} ${angleLabel(point.theta)}`}
      </text>
    </svg>
  );
}

function CurvePanel({ frame, x, width }: { frame: TrigFrame; x: number; width: number }) {
  const domain = trigDomain(frame.kind),
    series = trigSeries(frame.kind);
  const left = 47,
    right = width - 18,
    top = 34,
    bottom = 226;
  const X = (v: number) =>
    left + 7 + ((v - domain[0]) / (domain[1] - domain[0])) * (right - left - 14);
  const Y = (v: number) => top + ((1.2 - v) / 2.4) * (bottom - top);
  const threshold =
    frame.kind === 'sine-triple' ? 1 : frame.kind === 'cosine-half' ? 0.5 : TRIG_THRESHOLD;
  const show = frame.showSolutions,
    boundary = openEndpoint(frame, x);
  const roots = show ? trigSolutions(frame.kind) : [];
  return (
    <svg
      className="trig-svg trig-curves"
      viewBox={`0 0 ${width} 280`}
      role="img"
      aria-label={
        frame.kind === 'sine-triple'
          ? 'Courbe de sin(3x), avec x sur l’axe horizontal et sin(3x) sur l’axe vertical.'
          : 'Courbes représentatives : le réel est en abscisse, la valeur de la fonction en ordonnée.'
      }
    >
      <title>Courbes et lecture des ordonnées</title>
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        fill="none"
        stroke={theme.line}
      />
      {[-1, 0, 1].map((y) => (
        <g key={y}>
          <line
            x1={left}
            x2={right}
            y1={Y(y)}
            y2={Y(y)}
            stroke={y === 0 ? ink : theme.line}
            strokeWidth={y === 0 ? 1.5 : 1}
          />
          <text x={left - 10} y={Y(y) + 5} fill={ink} fontSize="15" textAnchor="end">
            {y}
          </text>
        </g>
      ))}
      {trigTicks(frame.kind).map((tick, i, ticks) => (
        <g key={tick}>
          <line
            x1={X(tick)}
            x2={X(tick)}
            y1={top}
            y2={bottom}
            stroke={theme.line}
            strokeWidth="1"
          />
          <text
            x={X(tick)}
            y={bottom + 23}
            textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}
            fill={ink}
            fontSize="15"
          >
            {angleLabel(tick)}
          </text>
        </g>
      ))}
      <text x={left} y="20" fontSize="15" fill={ink}>
        Valeur de la fonction
      </text>
      <text x={right} y="272" textAnchor="end" fontSize="15" fill={ink}>
        {frame.kind === 'winding' ? 'θ' : 'x'} (radians)
      </text>
      {show && frame.kind === 'cosine-inequality' && (
        <rect
          x={X(TRIG_STRICT_INTERVAL[0])}
          y={top}
          width={X(TRIG_STRICT_INTERVAL[1]) - X(TRIG_STRICT_INTERVAL[0])}
          height={bottom - top}
          fill={selected}
          opacity=".08"
        />
      )}
      {series.map((s) => (
        <path
          key={s.id}
          className="trig-function"
          data-function={s.label}
          d={sampledPath((v) => [X(v), Y(s.value(v))], ...domain, 400)}
          stroke={s.id === 'sin' ? sine : cosine}
          strokeWidth="3"
          strokeDasharray={s.id === 'cos' ? '8 5' : undefined}
          fill="none"
        />
      ))}
      {show && frame.kind === 'cosine-inequality' && (
        <path
          className="trig-selected-curve"
          d={sampledPath((v) => [X(v), Y(Math.cos(v))], ...TRIG_STRICT_INTERVAL, 180)}
          stroke={selected}
          strokeWidth="5"
          fill="none"
        />
      )}
      {frame.kind !== 'winding' && frame.kind !== 'sine-cosine' && (
        <>
          <line
            x1={left}
            x2={right}
            y1={Y(threshold)}
            y2={Y(threshold)}
            stroke={ink}
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <text x={right - 5} y={Y(threshold) - 8} textAnchor="end" fill={ink} fontSize="15">
            {frame.kind === 'sine-triple' ? '1' : frame.kind === 'cosine-half' ? '1/2' : '√3/2'}
          </text>
        </>
      )}
      <line
        x1={X(x)}
        x2={X(x)}
        y1={top}
        y2={bottom}
        stroke={ink}
        strokeWidth="1.5"
        strokeDasharray="3 4"
      />
      {series.map((s) => (
        <circle
          key={s.id}
          className="trig-curve-current"
          data-function={s.label}
          data-parameter={x}
          data-value={s.value(x)}
          data-endpoint={boundary ? 'excluded' : undefined}
          cx={X(x)}
          cy={Y(s.value(x))}
          r="5"
          fill={boundary ? theme.board : s.id === 'sin' ? sine : cosine}
          stroke={s.id === 'sin' ? sine : cosine}
          strokeWidth="2"
        />
      ))}
      {roots.map((root) => (
        <circle
          className="trig-solution"
          data-solution-parameter={root}
          data-endpoint={frame.kind === 'cosine-inequality' ? 'excluded' : 'included'}
          key={root}
          cx={X(root)}
          cy={Y(series[0].value(root))}
          r="5.5"
          stroke={selected}
          strokeWidth="2.5"
          fill={frame.kind === 'cosine-inequality' ? theme.board : selected}
        />
      ))}
    </svg>
  );
}

function ParameterLine({ frame, x, width }: { frame: TrigFrame; x: number; width: number }) {
  const domain = trigDomain(frame.kind),
    left = 25,
    right = width - 25,
    baseline = 62;
  const X = (v: number) => left + ((v - domain[0]) / (domain[1] - domain[0])) * (right - left);
  const winding = frame.kind === 'winding',
    show = frame.showSolutions;
  const roots = show ? trigSolutions(frame.kind) : [];
  const angleText = angleLabel(x);
  return (
    <svg
      className="trig-svg trig-parameter-line"
      viewBox={`0 0 ${width} 116`}
      role="img"
      aria-label={
        winding
          ? 'Droite réelle : le paramètre n’est pas réduit modulo deux pi. Les points cerclés correspondent au même point M.'
          : 'Report des solutions sur la droite réelle.'
      }
    >
      <title>
        {winding
          ? 'Enroulement : de la droite réelle au cercle'
          : 'Report des solutions sur la droite réelle'}
      </title>
      <text x={left} y="17" fontSize="15" fill={ink}>
        {winding ? 'Droite réelle ℝ' : 'Valeurs de x'}
      </text>
      <line x1={left} x2={right} y1={baseline} y2={baseline} stroke={ink} strokeWidth="1.5" />
      {winding && (
        <line x1={X(0)} x2={X(x)} y1={baseline} y2={baseline} stroke={ink} strokeWidth="4" />
      )}
      {show && frame.kind === 'cosine-inequality' && (
        <line
          className="trig-selected-interval"
          x1={X(TRIG_STRICT_INTERVAL[0])}
          x2={X(TRIG_STRICT_INTERVAL[1])}
          y1={baseline}
          y2={baseline}
          stroke={selected}
          strokeWidth="6"
        />
      )}
      {trigTicks(frame.kind).map((tick) => (
        <g key={tick}>
          <line x1={X(tick)} x2={X(tick)} y1={baseline - 4} y2={baseline + 4} stroke={ink} />
          <text
            x={X(tick)}
            y={baseline + 25}
            textAnchor={near(tick, domain[0]) ? 'start' : near(tick, domain[1]) ? 'end' : 'middle'}
            fontSize="15"
            fill={ink}
          >
            {angleLabel(tick)}
          </text>
        </g>
      ))}
      {winding &&
        equivalentAngles(x, domain).map((a) => (
          <circle
            key={a}
            data-equivalent-angle={a}
            cx={X(a)}
            cy={baseline}
            r="5.5"
            fill={near(a, x) ? ink : theme.board}
            stroke={ink}
            strokeWidth="2"
          />
        ))}
      {!winding && (
        <line
          x1={X(x)}
          x2={X(x)}
          y1={baseline - 12}
          y2={baseline - 3}
          stroke={ink}
          strokeWidth="2"
        />
      )}
      {roots.map((root) => (
        <circle
          key={root}
          className="trig-solution"
          data-solution-parameter={root}
          data-endpoint={frame.kind === 'cosine-inequality' ? 'excluded' : 'included'}
          cx={X(root)}
          cy={baseline}
          r="5.5"
          stroke={selected}
          strokeWidth="2.5"
          fill={frame.kind === 'cosine-inequality' ? theme.board : selected}
        />
      ))}
      <text
        x={Math.max(left, Math.min(right, X(x)))}
        y={baseline - 16}
        textAnchor={
          x < domain[0] + (domain[1] - domain[0]) * 0.15
            ? 'start'
            : x > domain[1] - (domain[1] - domain[0]) * 0.15
              ? 'end'
              : 'middle'
        }
        fontSize="15"
        fill={ink}
      >
        {winding ? 'θ' : 'x'} {angleText.startsWith('≈') ? '' : '='} {angleText}
      </text>
      {show && frame.kind === 'cosine-inequality' && (
        <text x={width / 2} y="113" textAnchor="middle" fontSize="15" fill={ink}>
          ]π/6 ; 11π/6[ · bornes exclues
        </text>
      )}
    </svg>
  );
}

interface TrigSlideProps {
  frame: TrigFrame;
  tex: string;
  reduced: boolean;
  animate: boolean;
  speed: number;
  pauseSignal: number;
  print?: boolean;
  /** Stop lesson autoplay without interrupting the local exploration transition. */
  onInteract?: () => void;
}

export function TrigSlide({
  frame,
  tex,
  reduced,
  animate,
  speed,
  pauseSignal,
  print = false,
  onInteract,
}: TrigSlideProps) {
  const initial =
    animate && !reduced && !print && frame.fromAngle !== undefined ? frame.fromAngle : frame.angle;
  const [parameter, setParameter] = useState(initial),
    [moving, setMoving] = useState(false);
  const value = useRef(initial),
    liveSpeed = useRef(speed),
    raf = useRef<number | null>(null),
    pause = useRef(pauseSignal);
  const run = useRef<{
    from: number;
    to: number;
    elapsed: number;
    last: number | null;
    duration: number;
  } | null>(null);
  const circleRef = useRef<HTMLDivElement>(null),
    plotRef = useRef<HTMLDivElement>(null),
    lineRef = useRef<HTMLDivElement>(null);
  const circleWidth = usePanelWidth(circleRef, 340, print),
    plotWidth = usePanelWidth(plotRef, 500, print),
    lineWidth = usePanelWidth(lineRef, 860, print);
  const inputId = useId();
  liveSpeed.current = speed;
  const stop = () => {
    if (raf.current !== null && typeof cancelAnimationFrame !== 'undefined')
      cancelAnimationFrame(raf.current);
    raf.current = null;
    run.current = null;
    setMoving(false);
  };
  const setValue = (next: number) => {
    value.current = next;
    setParameter(next);
  };
  const start = (from: number, to: number) => {
    stop();
    if (reduced || print || near(from, to) || typeof requestAnimationFrame === 'undefined') {
      setValue(to);
      return;
    }
    setValue(from);
    setMoving(true);
    run.current = {
      from,
      to,
      elapsed: 0,
      last: null,
      duration: Math.min(
        5500,
        Math.max(1600, (Math.abs(circleAngle(frame.kind, to - from)) / TAU) * 3600),
      ),
    };
    const tick = (now: number) => {
      const state = run.current;
      if (!state) return;
      if (state.last !== null) state.elapsed += Math.max(0, now - state.last) * liveSpeed.current;
      state.last = now;
      const progress = Math.min(1, state.elapsed / state.duration);
      setValue(state.from + (state.to - state.from) * progress);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
      else {
        run.current = null;
        raf.current = null;
        setMoving(false);
        setValue(state.to);
      }
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => {
    if (animate && !reduced && !print && frame.fromAngle !== undefined)
      start(frame.fromAngle, frame.angle);
    else {
      stop();
      setValue(frame.angle);
    }
    return () => {
      if (raf.current !== null && typeof cancelAnimationFrame !== 'undefined')
        cancelAnimationFrame(raf.current);
      run.current = null;
    };
  }, [frame.kind, frame.angle, frame.fromAngle, animate, reduced, print]);
  useEffect(() => {
    if (pause.current !== pauseSignal) {
      pause.current = pauseSignal;
      stop();
    }
  }, [pauseSignal]);
  const point = circleCoordinates(frame.kind, parameter),
    series = trigSeries(frame.kind),
    domain = trigDomain(frame.kind);
  const winding = frame.kind === 'winding',
    turns = Math.trunc(point.theta / TAU),
    remainder = point.theta - turns * TAU;
  const windingStatus =
    turns === 0
      ? 'Depuis 0 : longueur orientée ' + angleLabel(point.theta) + ' sur un cercle de rayon 1.'
      : `${Math.abs(turns)} tour${Math.abs(turns) > 1 ? 's' : ''} ${turns < 0 ? 'dans le sens horaire' : 'dans le sens direct'} ; reste ${angleLabel(remainder)}.`;
  return (
    <div
      className="trig-slide"
      data-trig-kind={frame.kind}
      data-parameter={parameter}
      data-circle-angle={point.theta}
      data-motion={moving ? 'moving' : 'settled'}
    >
      <p className="trig-target-label">
        {!frame.interactive && !near(parameter, frame.angle)
          ? 'À l’arrivée de l’animation'
          : 'Relation étudiée'}
      </p>
      <MathView tex={tex} display className="trig-formula" />
      <div className="trig-panels">
        <div className="trig-panel" ref={circleRef}>
          <h3>Cercle trigonométrique</h3>
          <CirclePanel frame={frame} x={parameter} width={circleWidth} />
        </div>
        <div className="trig-panel" ref={plotRef}>
          <h3>
            {series.length === 2 ? 'Courbes du sinus et du cosinus' : 'Courbe représentative'}
          </h3>
          <CurvePanel frame={frame} x={parameter} width={plotWidth} />
        </div>
      </div>
      <div className="trig-readings">
        <span className="trig-parameter">
          {winding ? 'θ' : 'x'} {angleLabel(parameter).startsWith('≈') ? '' : '='}{' '}
          {angleLabel(parameter)}
        </span>
        {frame.kind === 'sine-triple' && (
          <span>
            θ = 3x {angleLabel(point.theta).startsWith('≈') ? '' : '='} {angleLabel(point.theta)}
          </span>
        )}
        {series.map((s) => (
          <span key={s.id}>
            <i className={'trig-swatch ' + s.id} aria-hidden="true" />
            {s.label} ≈ {decimal(s.value(parameter))}
          </span>
        ))}
      </div>
      <p className="trig-note">
        {frame.kind === 'sine-triple'
          ? 'Le cercle utilise 3x ; la courbe place x en abscisse et sin(3x) en ordonnée.'
          : frame.kind === 'cosine-half' || frame.kind === 'cosine-inequality'
            ? 'Cosinus : abscisse sur le cercle, ordonnée sur la courbe.'
            : 'Sur le cercle : cosinus en abscisse, sinus en ordonnée. Sur les courbes : les deux valeurs se lisent en ordonnée.'}
      </p>
      <div ref={lineRef}>
        <ParameterLine frame={frame} x={parameter} width={lineWidth} />
      </div>
      {winding && <p className="trig-status">{windingStatus}</p>}
      {frame.interactive && !print && (
        <div className="trig-explore" data-swipe-ignore>
          <label htmlFor={inputId}>Explorer l’angle θ (radians)</label>
          <div className="trig-explore-row">
            <button
              type="button"
              aria-label="Retirer un tour (−2π)"
              disabled={parameter - TAU < domain[0] - epsilon}
              onClick={() => {
                onInteract?.();
                start(value.current, value.current - TAU);
              }}
            >
              −2π
            </button>
            <input
              id={inputId}
              aria-label="Angle θ en radians"
              type="range"
              min={domain[0]}
              max={domain[1]}
              step={Math.PI / 12}
              value={parameter}
              onChange={(e) => {
                onInteract?.();
                stop();
                setValue(Number(e.target.value));
              }}
              aria-valuetext={angleLabel(parameter) + ' radians'}
            />
            <button
              type="button"
              aria-label="Ajouter un tour (+2π)"
              disabled={parameter + TAU > domain[1] + epsilon}
              onClick={() => {
                onInteract?.();
                start(value.current, value.current + TAU);
              }}
            >
              +2π
            </button>
          </div>
          <p className="trig-status" aria-live="polite">
            {moving
              ? 'Enroulement en cours.'
              : `θ ${angleLabel(parameter).startsWith('≈') ? '' : '='} ${angleLabel(parameter)} ; les points cerclés sur la droite correspondent au même point M.`}
          </p>
        </div>
      )}
    </div>
  );
}
