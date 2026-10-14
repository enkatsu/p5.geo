// Browser checks for behavior the unit tests can't cover (DOM, MapLibre, p5 lifecycle).
// Open http://localhost:8000/test/browser/ with `npm run dev`. Results appear on the page, in
// window.__results, and in the tab title (PASS / FAIL). Runs in instance mode, one sketch per check.
//
// Background tabs pause requestAnimationFrame, so pump() renders the map and the sketch by hand.

const TOKYO = { lat: 35.68, lon: 139.76 };
const results = [];
window.__results = results;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

function sketch(width, height, setup, renderer) {
  return new Promise((resolve) => {
    new p5((p) => {
      p.draws = 0;
      p.setup = () => {
        p.createCanvas(width, height, renderer);
        setup?.(p);
        resolve(p);
      };
      p.draw = () => {
        p.draws++;
        p.clear();
      };
    });
  });
}

async function pump(p, ms = 300) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    p.myMap?.maplibre?.redraw();
    await p.redraw();
    await wait(16);
  }
}

// toScreen() against MapLibre's own projection, in pixels.
function drift(myMap, lat, lon) {
  const a = myMap.toScreen(lat, lon);
  const b = myMap.maplibre.project([lon, lat]);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// One line per check, with the measured facts folded away (open when the check failed).
function render(result) {
  const details = document.createElement('details');
  details.open = !result.ok;
  const summary = document.createElement('summary');
  summary.className = result.ok ? 'pass' : 'fail';
  summary.textContent = `${result.ok ? '✓' : '✗'} ${result.name}`;
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(result.error ? { ...result.facts, error: result.error } : result.facts, null, 2);
  details.append(summary, pre);
  document.getElementById('out').append(details);
}

async function check(name, fn) {
  const facts = {};
  let result;
  try {
    result = { name, ok: await fn(facts), facts };
  } catch (err) {
    result = { name, ok: false, facts, error: String(err.stack || err) };
  }
  results.push(result);
  render(result);
}

async function newMapSketch(width = 800, height = 600, options = {}, renderer) {
  const p = await sketch(width, height, (p) => {
    p.myMap = p.createGeoMap({ center: TOKYO, zoom: 11, ...options });
  }, renderer);
  await p.myMap.ready;
  await pump(p);
  return p;
}

(async () => {
  await check('resizeCanvas() resizes the map and the projection', async (f) => {
    const p = await newMapSketch();
    p.resizeCanvas(400, 300);
    await pump(p);
    const wrapper = p.canvas.parentElement;
    f.wrapper = [wrapper.offsetWidth, wrapper.offsetHeight];
    f.mapCanvas = [p.myMap.maplibre.getCanvas().clientWidth, p.myMap.maplibre.getCanvas().clientHeight];
    const c = p.myMap.toScreen(TOKYO);
    f.center = [c.x, c.y];
    f.drift = drift(p.myMap, 35.6586, 139.7454);
    p.remove();
    return f.wrapper[0] === 400 && f.wrapper[1] === 300 && f.mapCanvas[0] === 400 && f.mapCanvas[1] === 300
      && close(c.x, 200) && close(c.y, 150) && f.drift < 1e-6;
  });

  await check('remove() cleans up, and a new sketch gets exactly one map', async (f) => {
    const p = await newMapSketch();
    const mapInstance = p.myMap.maplibre;
    const canvas = p.canvas;
    p.remove();
    await wait(50);
    f.wrappersAfterRemove = document.querySelectorAll('.p5geo-wrapper').length;
    f.mapLibreRemoved = mapInstance._removed === true;
    f.canvasInDocument = document.contains(canvas);
    const q = await newMapSketch();
    f.wrappersAfterNewSketch = document.querySelectorAll('.p5geo-wrapper').length;
    f.mapContainers = document.querySelectorAll('.maplibregl-map').length;
    q.remove();
    return f.wrappersAfterRemove === 0 && f.mapLibreRemoved && !f.canvasInDocument
      && f.wrappersAfterNewSketch === 1 && f.mapContainers === 1;
  });

  await check('myMap.remove() alone puts the canvas back and keeps the sketch', async (f) => {
    const p = await newMapSketch();
    const parent = p.canvas.parentElement.parentElement;
    p.myMap.remove();
    f.wrappers = document.querySelectorAll('.p5geo-wrapper').length;
    f.canvasBackInPlace = p.canvas.parentElement === parent;
    p.remove();
    await wait(50);
    f.canvasGoneWithSketch = !document.contains(p.canvas);
    return f.wrappers === 0 && f.canvasBackInPlace && f.canvasGoneWithSketch;
  });

  await check('center() / zoom() / fit() / flyTo() move the basemap', async (f) => {
    const p = await newMapSketch();
    const { myMap } = p;
    const m = myMap.maplibre;

    myMap.center(34.69, 135.5).zoom(10);
    await pump(p, 100);
    f.afterSet = { center: m.getCenter(), zoom: m.getZoom(), drift: drift(myMap, 34.7, 135.6) };

    const points = [{ lat: 33, lon: 130 }, { lat: 43, lon: 141 }];
    myMap.fit(points, { padding: 30 });
    await pump(p, 100);
    const onScreen = myMap.toScreen(points).every((v) => v.x >= 29 && v.x <= 771 && v.y >= 29 && v.y <= 571);
    f.afterFit = { center: m.getCenter(), zoom: m.getZoom(), onScreen, drift: drift(myMap, 38, 135) };

    myMap.flyTo(TOKYO.lat, TOKYO.lon, 12);
    const start = performance.now();
    await pump(p, 100);
    while (m.isMoving() && performance.now() - start < 8000) await pump(p, 100);
    f.afterFly = { center: myMap.center(), zoom: myMap.zoom(), moving: m.isMoving(), drift: drift(myMap, 35.6586, 139.7454) };
    p.remove();

    return close(f.afterSet.center.lat, 34.69) && close(f.afterSet.center.lng, 135.5) && close(f.afterSet.zoom, 10)
      && f.afterSet.drift < 1e-6 && onScreen && f.afterFit.drift < 1e-6
      && !f.afterFly.moving && close(f.afterFly.center.lat, TOKYO.lat, 1e-4) && close(f.afterFly.center.lon, TOKYO.lon, 1e-4)
      && close(f.afterFly.zoom, 12, 1e-6) && f.afterFly.drift < 1e-6;
  });

  await check('interactive(false) turns map handlers off, and back on', async (f) => {
    const handlers = ['dragPan', 'scrollZoom', 'boxZoom', 'doubleClickZoom', 'keyboard', 'touchZoomRotate'];
    const state = (m) => Object.fromEntries(handlers.map((h) => [h, m[h].isEnabled()]));

    // Set before the basemap exists: applied once it loads.
    const p = await sketch(800, 600, (p) => {
      p.myMap = p.createGeoMap({ center: TOKYO, zoom: 11 });
      p.myMap.interactive(false);
    });
    await p.myMap.ready;
    const m = p.myMap.maplibre;
    f.lockedBeforeLoad = state(m);
    f.cursorWhenLocked = m.getCanvasContainer().classList.contains('maplibregl-interactive');

    p.myMap.interactive(true);
    f.unlocked = state(m);
    f.cursorWhenUnlocked = m.getCanvasContainer().classList.contains('maplibregl-interactive');
    f.rotationAndTiltOff = !m.dragRotate.isEnabled() && !m.touchPitch.isEnabled();

    // A synthetic drag on the map moves it only when interactive.
    const drag = async () => {
      const before = p.myMap.center();
      const el = m.getCanvasContainer();
      const opts = (x, y) => ({ clientX: x, clientY: y, bubbles: true, button: 0, buttons: 1 });
      el.dispatchEvent(new MouseEvent('mousedown', opts(400, 300)));
      // MapLibre follows the rest of a drag on the document.
      for (let i = 1; i <= 5; i++) {
        document.dispatchEvent(new MouseEvent('mousemove', opts(400 - i * 20, 300)));
        await pump(p, 32);
      }
      document.dispatchEvent(new MouseEvent('mouseup', opts(300, 300)));
      await pump(p, 200);
      return Math.abs(p.myMap.center().lon - before.lon) > 1e-6;
    };
    f.dragMovesWhenUnlocked = await drag();
    p.myMap.interactive(false);
    f.dragMovesWhenLocked = await drag();
    p.remove();

    const all = (o, v) => Object.values(o).every((x) => x === v);
    return all(f.lockedBeforeLoad, false) && !f.cursorWhenLocked && all(f.unlocked, true) && f.cursorWhenUnlocked
      && f.rotationAndTiltOff && f.dragMovesWhenUnlocked && !f.dragMovesWhenLocked;
  });

  await check('a cancelled mouse press on an interactive map gives one warning', async (f) => {
    const p = await newMapSketch();
    const el = p.myMap.maplibre.getCanvasContainer();
    const warnings = [];
    const warn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    // Stand in for p5 cancelling the press after mousePressed() returns false.
    const cancel = (e) => e.preventDefault();
    const press = async (cancelled, pointerType = 'mouse') => {
      if (cancelled) window.addEventListener('pointerdown', cancel);
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType, button: 0 }));
      window.removeEventListener('pointerdown', cancel);
      await wait(20);
    };
    try {
      await press(false);
      f.afterNormalPress = warnings.length;
      await press(true, 'touch');
      f.afterCancelledTouch = warnings.length;
      p.myMap.interactive(false);
      await press(true);
      f.afterCancelledWhileLocked = warnings.length;
      p.myMap.interactive(true);
      await press(true);
      await press(true);
      f.afterTwoCancelledPresses = warnings.length;
      f.message = warnings[0];
    } finally {
      console.warn = warn;
      p.remove();
    }
    return f.afterNormalPress === 0 && f.afterCancelledTouch === 0 && f.afterCancelledWhileLocked === 0
      && f.afterTwoCancelledPresses === 1 && /interactive: false/.test(f.message);
  });

  await check('moving the map inside draw() renders it in the same frame', async (f) => {
    const p = await newMapSketch();
    let lon = TOKYO.lon;
    p.draw = () => {
      p.clear();
      lon += 0.01;
      p.myMap.center(TOKYO.lat, lon);
    };
    // Record where the map actually was each time it rendered during the frame.
    const m = p.myMap.maplibre;
    const rendered = [];
    const onRender = () => rendered.push(m.getCenter().lng);
    m.on('render', onRender);
    await p.redraw();
    m.off('render', onRender);
    f.target = lon;
    f.renderedDuringFrame = rendered;
    p.remove();
    return rendered.length > 0 && close(rendered.at(-1), lon, 1e-9);
  });

  await check('noLoop() sketches redraw when the map moves', async (f) => {
    const p = await newMapSketch();
    p.noLoop();
    await wait(50);
    const before = p.draws;
    p.myMap.maplibre.jumpTo({ center: [135.5, 34.69] });
    p.myMap.maplibre.redraw(); // fires 'render', as MapLibre's own frame would
    await wait(50);
    f.drawsBefore = before;
    f.drawsAfter = p.draws;
    f.viewFollowed = close(p.myMap.center().lat, 34.69);
    p.remove();
    return f.drawsAfter > f.drawsBefore && f.viewFollowed;
  });

  await check('pixelDensity(1) keeps the map and canvas the same size', async (f) => {
    const p = await sketch(800, 600, (p) => {
      p.pixelDensity(1);
      p.myMap = p.createGeoMap({ center: TOKYO, zoom: 11 });
    });
    await p.myMap.ready;
    await pump(p);
    f.devicePixelRatio = devicePixelRatio;
    f.canvasBacking = [p.canvas.width, p.canvas.height];
    f.canvasCss = [p.canvas.clientWidth, p.canvas.clientHeight];
    f.mapCss = [p.myMap.maplibre.getCanvas().clientWidth, p.myMap.maplibre.getCanvas().clientHeight];
    f.drift = drift(p.myMap, 35.6586, 139.7454);
    p.remove();
    return f.canvasCss[0] === 800 && f.mapCss[0] === 800 && f.canvasCss[1] === 600 && f.mapCss[1] === 600 && f.drift < 1e-6;
  });

  await check('WEBGL canvas: what toScreen() means there', async (f) => {
    const p = await newMapSketch(800, 600, {}, 'webgl');
    f.wrapped = p.canvas.parentElement.classList.contains('p5geo-wrapper');
    const c = p.myMap.toScreen(TOKYO);
    f.toScreenCenter = [c.x, c.y];
    f.note = 'WEBGL puts (0, 0) at the canvas center, so this point is drawn at the bottom-right unless the sketch translates by (-width/2, -height/2).';
    p.remove();
    return f.wrapped;
  });

  await check('no canvases left behind', async (f) => {
    f.canvases = document.querySelectorAll('canvas').length;
    return f.canvases === 0;
  });
  const passed = results.filter((r) => r.ok).length;
  const allPassed = passed === results.length;
  const summary = document.getElementById('summary');
  summary.textContent = `${allPassed ? 'PASS' : 'FAIL'}: ${passed}/${results.length} checks passed`;
  summary.className = allPassed ? 'pass' : 'fail';
  document.title = allPassed ? 'PASS' : 'FAIL';
})();
