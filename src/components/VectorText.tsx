import '../styles/vector-notation.css';

/** Draw vector accents instead of relying on combining-glyph font support. */
export function VectorText({text}:{text:string}) {
  return <>{text.split(/([A-Za-z0-9]+\u20d7)/g).map((part,i)=>part.endsWith('\u20d7') ?
    <span className="vector-symbol" key={i} role="img" aria-label={`${part.slice(0,-1)} vector`}>
      <svg aria-hidden="true" viewBox="0 0 40 10" preserveAspectRatio="none"><path d="M1 5H38M31 1L38 5L31 9"/></svg>
      <span aria-hidden="true">{part.slice(0,-1)}</span>
    </span> : part)}</>;
}
