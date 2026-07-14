"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type MotionMode = "drift" | "bounce" | "orbit";
type Tempo = "calm" | "alive" | "loud";
type Mood = "electric" | "sunset" | "cool" | "ink";
type Point = { x: number; y: number };
type LabObject = Point & {
  id: number;
  kind: "disc" | "block" | "ring" | "capsule" | "star" | "dot";
  label: string;
};

const initialObjects: LabObject[] = [
  { id: 1, kind: "disc", label: "violet disc", x: 16, y: 24 },
  { id: 2, kind: "block", label: "coral block", x: 72, y: 20 },
  { id: 3, kind: "ring", label: "cyan ring", x: 47, y: 42 },
  { id: 4, kind: "capsule", label: "lemon capsule", x: 21, y: 72 },
  { id: 5, kind: "star", label: "mint star", x: 78, y: 68 },
  { id: 6, kind: "dot", label: "orange dot", x: 55, y: 78 },
];

const modeCopy: Record<MotionMode, string> = {
  drift: "Slow currents, soft corners.",
  bounce: "A little spring in everything.",
  orbit: "Round and round, never the same.",
};

const moodLabels: Record<Mood, string> = {
  electric: "Electric",
  sunset: "Sunset",
  cool: "Cool",
  ink: "Ink",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function Home() {
  const [mode, setMode] = useState<MotionMode>("drift");
  const [tempo, setTempo] = useState<Tempo>("alive");
  const [mood, setMood] = useState<Mood>("electric");
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [objects, setObjects] = useState(initialObjects);
  const [sparks, setSparks] = useState<Array<Point & { id: number }>>([]);
  const [sparkCount, setSparkCount] = useState(0);
  const [paletteShift, setPaletteShift] = useState(0);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [status, setStatus] = useState("KINETICA is ready to play.");

  const stageRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const timerIds = useRef<number[]>([]);
  const sparkId = useRef(0);
  const dragState = useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preferenceTimer = window.setTimeout(() => {
      const savedMood = window.localStorage.getItem("kinetica-mood") as Mood | null;
      if (savedMood && savedMood in moodLabels) setMood(savedMood);

      const savedMotion = window.localStorage.getItem("kinetica-motion");
      if (savedMotion === "paused") setMotionEnabled(false);
      if (savedMotion === "playing") setMotionEnabled(true);
      if (!savedMotion) setMotionEnabled(!media.matches);
    }, 0);

    const syncWithSystem = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem("kinetica-motion")) {
        setMotionEnabled(!event.matches);
      }
    };
    media.addEventListener("change", syncWithSystem);
    return () => {
      window.clearTimeout(preferenceTimer);
      media.removeEventListener("change", syncWithSystem);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) =>
      observer.observe(node),
    );
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!motionEnabled || !finePointer.matches) return;

    const followPointer = (event: globalThis.PointerEvent) => {
      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${event.clientX - 18}px, ${event.clientY - 18}px, 0)`;
      }
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", followPointer, { passive: true });
    return () => window.removeEventListener("pointermove", followPointer);
  }, [motionEnabled]);

  useEffect(
    () => () => timerIds.current.forEach((timerId) => window.clearTimeout(timerId)),
    [],
  );

  const createSpark = (x: number, y: number) => {
    sparkId.current += 1;
    const id = sparkId.current;
    setSparks((current) => [...current.slice(-11), { id, x, y }]);
    setSparkCount((current) => current + 1);
    setStatus(`A spark was created in ${mode} mode.`);
    const timerId = window.setTimeout(
      () => setSparks((current) => current.filter((spark) => spark.id !== id)),
      motionEnabled ? 850 : 160,
    );
    timerIds.current.push(timerId);
  };

  const handleStagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    createSpark(
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    );
  };

  const handleObjectPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    object: LabObject,
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      id: object.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: object.x,
      originY: object.y,
    };
    setDraggingId(object.id);
  };

  const handleObjectPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const bounds = stage.getBoundingClientRect();
    const nextX = drag.originX + ((event.clientX - drag.startX) / bounds.width) * 100;
    const nextY = drag.originY + ((event.clientY - drag.startY) / bounds.height) * 100;
    setObjects((current) =>
      current.map((object) =>
        object.id === drag.id
          ? { ...object, x: clamp(nextX, 8, 92), y: clamp(nextY, 10, 90) }
          : object,
      ),
    );
  };

  const handleObjectPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setDraggingId(null);
  };

  const moveObjectWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    object: LabObject,
  ) => {
    const offsets: Partial<Record<string, Point>> = {
      ArrowLeft: { x: -3, y: 0 },
      ArrowRight: { x: 3, y: 0 },
      ArrowUp: { x: 0, y: -3 },
      ArrowDown: { x: 0, y: 3 },
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    setObjects((current) =>
      current.map((item) =>
        item.id === object.id
          ? {
              ...item,
              x: clamp(item.x + offset.x, 8, 92),
              y: clamp(item.y + offset.y, 10, 90),
            }
          : item,
      ),
    );
    setStatus(`${object.label} moved ${event.key.replace("Arrow", "").toLowerCase()}.`);
  };

  const shuffleColors = () => {
    setPaletteShift((current) => (current + 1) % 4);
    setStatus("The lab colors were shuffled.");
  };

  const resetLab = () => {
    sparkId.current = 0;
    setObjects(initialObjects);
    setSparks([]);
    setSparkCount(0);
    setPaletteShift(0);
    setMode("drift");
    setTempo("alive");
    setStatus("The play lab was reset.");
  };

  const changeMood = (nextMood: Mood) => {
    setMood(nextMood);
    window.localStorage.setItem("kinetica-mood", nextMood);
    setStatus(`${moodLabels[nextMood]} frequency selected.`);
  };

  const toggleMotion = () => {
    setMotionEnabled((current) => {
      const next = !current;
      window.localStorage.setItem("kinetica-motion", next ? "playing" : "paused");
      setStatus(next ? "Ambient motion resumed." : "Ambient motion paused.");
      return next;
    });
  };

  const playAgain = () => {
    shuffleColors();
    document.getElementById("play")?.scrollIntoView({
      behavior: motionEnabled ? "smooth" : "auto",
    });
  };

  return (
    <main
      id="top"
      className={`kinetica mood-${mood} ${motionEnabled ? "motion-on" : "motion-paused"}`}
      data-mode={mode}
      data-tempo={tempo}
      data-palette-shift={paletteShift}
    >
      <a className="skip-link" href="#main-content">
        Skip to playground
      </a>
      <div ref={auraRef} className="pointer-aura" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="site-header" aria-label="Site header">
        <a className="brand magnetic" href="#top" aria-label="KINETICA home">
          KINETICA<span aria-hidden="true">✦</span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#play">Play</a>
          <a href="#why">Why</a>
          <a href="#mix">Mix</a>
        </nav>
        <div className="header-actions">
          <button className="motion-toggle" type="button" onClick={toggleMotion}>
            <span className="motion-indicator" aria-hidden="true" />
            {motionEnabled ? "Pause motion" : "Resume motion"}
          </button>
          <a className="header-cta" href="#play">
            Turn it up <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <div id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-orbits" aria-hidden="true">
            <div className="orbit orbit-one"><span /></div>
            <div className="orbit orbit-two"><span /></div>
            <div className="gel gel-violet" />
            <div className="gel gel-cyan" />
            <div className="gel gel-coral" />
          </div>
          <p className="eyebrow hero-eyebrow">Digital joy lab / 2026</p>
          <h1 id="hero-title">
            <span>Good things</span>
            <span>happen</span>
            <span className="outline-word">in motion.</span>
          </h1>
          <div className="hero-footer">
            <p>
              A technicolor playground for restless cursors, curious fingers,
              and anyone who thinks the web should feel alive.
            </p>
            <a className="hero-cta" href="#play">
              <span>Touch the current</span>
              <b aria-hidden="true">↘</b>
            </a>
            <div className="energy-readout" aria-label={`Energy ${68 + (sparkCount % 31)} percent`}>
              <span aria-hidden="true" /> Energy: {68 + (sparkCount % 31)}%
            </div>
          </div>
          <div className="side-note side-note-left" aria-hidden="true">No boring scrolling</div>
          <div className="side-note side-note-right" aria-hidden="true">Move / Tap / Play</div>
        </section>

        <div className="ticker" aria-label="Interaction ideas">
          <div className="ticker-track">
            <span>Hover ✦ Drag ● Tap ✦ Shift ● Delight ✦ Repeat ●</span>
            <span aria-hidden="true">Hover ✦ Drag ● Tap ✦ Shift ● Delight ✦ Repeat ●</span>
          </div>
          <div className="ticker-track ticker-reverse" aria-hidden="true">
            <span>Good things happen in motion ● KINETICA ✦</span>
            <span>Good things happen in motion ● KINETICA ✦</span>
          </div>
        </div>

        <section id="play" className="play-section" aria-labelledby="play-title">
          <div className="section-heading" data-reveal>
            <span className="section-number">(01)</span>
            <div>
              <p className="eyebrow">The play lab</p>
              <h2 id="play-title">Don’t just look.<br />Move something.</h2>
            </div>
            <p className="section-intro">
              Drag a shape. Tap the stage. Change the physics. There is no wrong move here.
            </p>
          </div>

          <div className="lab-shell" data-reveal>
            <div className="lab-controls" aria-label="Play lab controls">
              <fieldset className="segmented-control mode-control">
                <legend>Motion mode</legend>
                {(["drift", "bounce", "orbit"] as MotionMode[]).map((item) => (
                  <label key={item}>
                    <input
                      type="radio"
                      name="motion-mode"
                      value={item}
                      checked={mode === item}
                      onChange={() => {
                        setMode(item);
                        setStatus(`${item} motion mode selected.`);
                      }}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </fieldset>
              <div className="lab-action-group">
                <button type="button" onClick={shuffleColors}>Shuffle color</button>
                <button type="button" onClick={resetLab}>Reset</button>
              </div>
              <fieldset className="segmented-control tempo-control">
                <legend>Tempo</legend>
                {(["calm", "alive", "loud"] as Tempo[]).map((item) => (
                  <label key={item}>
                    <input
                      type="radio"
                      name="tempo"
                      value={item}
                      checked={tempo === item}
                      onChange={() => {
                        setTempo(item);
                        setStatus(`${item} tempo selected.`);
                      }}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </fieldset>
            </div>

            <div
              ref={stageRef}
              className="lab-stage"
              onPointerDown={handleStagePointerDown}
              aria-label="Interactive stage. Click or tap empty space to create a spark."
            >
              <div className="stage-grid" aria-hidden="true" />
              <p className="mode-note" aria-hidden="true">{modeCopy[mode]}</p>
              {objects.map((object) => (
                <button
                  key={object.id}
                  type="button"
                  className={`lab-object object-${object.kind} ${draggingId === object.id ? "is-dragging" : ""}`}
                  style={{ left: `${object.x}%`, top: `${object.y}%` }}
                  aria-label={`Move the ${object.label}. Drag it or use arrow keys.`}
                  onPointerDown={(event) => handleObjectPointerDown(event, object)}
                  onPointerMove={handleObjectPointerMove}
                  onPointerUp={handleObjectPointerUp}
                  onPointerCancel={handleObjectPointerUp}
                  onKeyDown={(event) => moveObjectWithKeyboard(event, object)}
                  onClick={() => createSpark(object.x, object.y)}
                >
                  {object.kind === "star" ? "✦" : <span aria-hidden="true" />}
                </button>
              ))}
              {sparks.map((spark) => (
                <span
                  key={spark.id}
                  className="spark"
                  style={{ left: `${spark.x}%`, top: `${spark.y}%` } as CSSProperties}
                  aria-hidden="true"
                >
                  ✦
                </span>
              ))}
              <div className="spark-readout">
                Sparks created: <strong>{String(sparkCount).padStart(2, "0")}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="principles" aria-labelledby="why-title">
          <div className="section-heading compact" data-reveal>
            <span className="section-number">(02)</span>
            <div>
              <p className="eyebrow">Why it moves</p>
              <h2 id="why-title">Motion with manners.</h2>
            </div>
          </div>
          <div className="principle-grid">
            <article className="principle-card responsive-card" data-reveal>
              <span className="card-number">01</span>
              <div className="responsive-demo" aria-hidden="true"><i /><i /><i /></div>
              <h3>Responsive</h3>
              <p>It answers before you have to ask.</p>
              <span className="stamp">Right on cue</span>
            </article>
            <article className="principle-card playful-card" data-reveal>
              <span className="card-number">02</span>
              <div className="swap-word" aria-hidden="true"><span>Nice</span><b>Ooh!</b></div>
              <h3>Playful</h3>
              <p>Surprise, with enough restraint to stay elegant.</p>
              <span className="stamp">Tiny delight</span>
            </article>
            <article className="principle-card human-card" data-reveal>
              <span className="card-number">03</span>
              <div className="human-pulse" aria-hidden="true"><span /></div>
              <h3>Human</h3>
              <p>Fast when you act. Slow when you pause.</p>
              <span className="stamp">Made for hands</span>
            </article>
          </div>
        </section>

        <section className="statement" aria-label="The web can move">
          <div className="statement-band band-one" data-reveal><span>The web doesn’t</span></div>
          <div className="statement-band band-two" data-reveal><span>have to sit</span></div>
          <div className="statement-band band-three" data-reveal><span>still.</span></div>
          <div className="rebellion-seal" aria-hidden="true">
            A small rebellion<br />against beige
          </div>
        </section>

        <section id="mix" className="mixer" aria-labelledby="mix-title">
          <div className="mixer-copy" data-reveal>
            <span className="section-number">(03)</span>
            <p className="eyebrow">Mood mixer</p>
            <h2 id="mix-title">Pick a<br />frequency.</h2>
            <p>You’re the art director now. Your choice stays with you for the next lap.</p>
          </div>
          <fieldset className="mood-grid" data-reveal>
            <legend className="sr-only">Choose a color frequency</legend>
            {(Object.keys(moodLabels) as Mood[]).map((item, index) => (
              <label key={item} className={`mood-option mood-option-${item}`}>
                <input
                  type="radio"
                  name="mood"
                  value={item}
                  checked={mood === item}
                  onChange={() => changeMood(item)}
                />
                <span className="mood-index">0{index + 1}</span>
                <span className="mood-swatch" aria-hidden="true"><i /><i /></span>
                <strong>{moodLabels[item]}</strong>
                <em>{mood === item ? "Playing now" : "Tune in"}</em>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="finale" aria-labelledby="finale-title">
          <div className="finale-ring" aria-hidden="true"><span>✦</span></div>
          <p className="eyebrow">You made it brighter</p>
          <h2 id="finale-title">Still here?<br />Good.</h2>
          <p>Take one more lap, make one more spark, leave the screen brighter than you found it.</p>
          <div className="finale-actions">
            <button type="button" onClick={playAgain}>Play again <span aria-hidden="true">↖</span></button>
            <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
          </div>
          <footer>
            <span>KINETICA / 2026</span>
            <span>Designed to move / Built to be touched</span>
          </footer>
        </section>
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {status}
      </div>
    </main>
  );
}
