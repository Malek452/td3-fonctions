import type { TrigFrame } from '../types';

export type TrigKind = TrigFrame['kind'];
export const TAU = 2 * Math.PI;
export const TRIG_THRESHOLD = Math.sqrt(3) / 2;
export const TRIG_STRICT_INTERVAL: readonly [number, number] = [Math.PI / 6, (11 * Math.PI) / 6];

/** The plotted parameter is x. In the angle-triple exercise the circle uses 3x. */
export function circleAngle(kind: TrigKind, x: number): number {
  return kind === 'sine-triple' ? 3 * x : x;
}

export function circleCoordinates(kind: TrigKind, x: number) {
  const theta = circleAngle(kind, x);
  return { theta, cos: Math.cos(theta), sin: Math.sin(theta) };
}

export function trigDomain(kind: TrigKind): readonly [number, number] {
  if (kind === 'cosine-inequality') return [0, TAU];
  if (kind === 'sine-triple') return [-TAU / 3, (2 * TAU) / 3];
  return [-TAU, 2 * TAU];
}

export function trigTicks(kind: TrigKind): number[] {
  if (kind === 'cosine-inequality') return [0, Math.PI, TAU];
  if (kind === 'sine-triple') return [-TAU / 3, 0, TAU / 3, (2 * TAU) / 3];
  return [-TAU, 0, TAU, 2 * TAU];
}

export function trigSeries(kind: TrigKind) {
  const sine = {
    id: 'sin' as const,
    label: kind === 'sine-triple' ? 'sin(3x)' : kind === 'winding' ? 'sin θ' : 'sin x',
    value: (x: number) => Math.sin(circleAngle(kind, x)),
  };
  const cosine = {
    id: 'cos' as const,
    label: kind === 'winding' ? 'cos θ' : 'cos x',
    value: (x: number) => Math.cos(x),
  };
  if (kind === 'sine-triple') return [sine];
  if (kind === 'cosine-half' || kind === 'cosine-inequality') return [cosine];
  return [sine, cosine];
}

/** Analytic solutions of each authored equation, limited to the visible window. */
export function trigSolutions(kind: TrigKind): number[] {
  if (kind === 'winding') return [];
  if (kind === 'cosine-inequality') return [...TRIG_STRICT_INTERVAL];
  const [lo, hi] = trigDomain(kind),
    values: number[] = [];
  for (let k = -8; k <= 8; k++) {
    const family =
      kind === 'sine-triple'
        ? [Math.PI / 6 + (k * TAU) / 3]
        : kind === 'cosine-half'
          ? [Math.PI / 3 + k * TAU, -Math.PI / 3 + k * TAU]
          : [Math.PI / 4 + k * Math.PI];
    for (const value of family) if (value >= lo - 1e-10 && value <= hi + 1e-10) values.push(value);
  }
  return values.sort((a, b) => a - b);
}

export function circleSolutionAngles(kind: TrigKind): number[] {
  if (kind === 'sine-triple') return [Math.PI / 2];
  if (kind === 'cosine-half') return [Math.PI / 3, (5 * Math.PI) / 3];
  if (kind === 'sine-cosine') return [Math.PI / 4, (5 * Math.PI) / 4];
  if (kind === 'cosine-inequality') return [...TRIG_STRICT_INTERVAL];
  return [];
}

export function satisfiesTrigRelation(kind: TrigKind, x: number): boolean {
  if (kind === 'cosine-inequality')
    return x > TRIG_STRICT_INTERVAL[0] && x < TRIG_STRICT_INTERVAL[1];
  if (kind === 'sine-triple') return Math.abs(Math.sin(3 * x) - 1) < 1e-10;
  if (kind === 'cosine-half') return Math.abs(Math.cos(x) - 0.5) < 1e-10;
  if (kind === 'sine-cosine') return Math.abs(Math.sin(x) - Math.cos(x)) < 1e-10;
  return true;
}

export function equivalentAngles(x: number, domain: readonly [number, number]): number[] {
  const out: number[] = [];
  const first = Math.ceil((domain[0] - x) / TAU - 1e-10);
  const last = Math.floor((domain[1] - x) / TAU + 1e-10);
  for (let k = first; k <= last; k++) out.push(x + k * TAU);
  return out;
}

export function decimal(value: number, places = 2): string {
  return (Math.abs(value) < 0.5 * 10 ** -places ? 0 : value).toFixed(places).replace('.', ',');
}

/** Exact multiples of π/12 are labelled exactly; intermediate animation values are approximate. */
export function angleLabel(angle: number): string {
  const multiple = (angle * 12) / Math.PI;
  if (Math.abs(multiple - Math.round(multiple)) > 1e-7) return '≈ ' + decimal(angle);
  let n = Math.round(multiple);
  if (n === 0) return '0';
  const sign = n < 0 ? '−' : '';
  n = Math.abs(n);
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(n, 12),
    numerator = n / divisor,
    denominator = 12 / divisor;
  return (
    sign + (numerator === 1 ? '' : numerator) + 'π' + (denominator === 1 ? '' : '/' + denominator)
  );
}

export function sampledPath(
  fn: (x: number) => readonly [number, number],
  from: number,
  to: number,
  samples = 200,
): string {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const point = fn(from + ((to - from) * index) / samples);
    return `${index ? 'L' : 'M'}${point[0].toFixed(3)},${point[1].toFixed(3)}`;
  }).join(' ');
}

export const trigDescriptions: Record<TrigKind, string> = {
  winding:
    'Enroulement de la droite réelle sur le cercle trigonométrique : θ est une mesure en radians. Le point M a pour coordonnées (cos θ ; sin θ). La droite et les courbes conservent les différents réels θ + 2kπ qui correspondent au même point du cercle. Les domaines de définition restent ℝ.',
  'sine-triple':
    'Le cercle utilise l’angle θ = 3x, tandis que l’abscisse de la courbe est x. L’ordonnée du point mobile vaut sin(3x) dans les deux vues. Les solutions de sin(3x) = 1 sont espacées de 2π/3 sur la droite réelle.',
  'cosine-half':
    'Le cosinus est l’abscisse du point du cercle et l’ordonnée du point de la courbe. La droite verticale d’abscisse 1/2 coupe le cercle en deux points ; la droite horizontale d’ordonnée 1/2 coupe la courbe aux réels x = ±π/3 + 2kπ.',
  'sine-cosine':
    'Les points du cercle dont l’abscisse et l’ordonnée sont égales appartiennent à la droite y = x. Ils correspondent aux intersections des courbes du sinus et du cosinus, aux réels x = π/4 + kπ.',
  'cosine-inequality':
    'Pour x dans [0 ; 2π], le cosinus est strictement inférieur à √3/2 sur l’arc du cercle situé à gauche de la droite d’abscisse √3/2. Sur la courbe, les points correspondants sont strictement sous le seuil. L’ensemble des solutions est ]π/6 ; 11π/6[ : les deux bornes sont exclues.',
};
