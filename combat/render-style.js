(function (global) {
"use strict";
// One reversible presentation pass. The shared world/materials stay authoritative.
const states = new WeakMap();
const shaderName = "r24Painted";
let latestMode = "3d";
const fragment = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform vec2 r24Texel;
float luminance(vec3 c) { return dot(c, vec3(.2126, .7152, .0722)); }
void main(void) {
  vec4 source = texture2D(textureSampler, vUV);
  vec3 c = source.rgb;
  float y = luminance(c);
  vec3 left = texture2D(textureSampler, vUV - vec2(r24Texel.x * 1.5, 0.)).rgb;
  vec3 right = texture2D(textureSampler, vUV + vec2(r24Texel.x * 1.5, 0.)).rgb;
  vec3 up = texture2D(textureSampler, vUV + vec2(0., r24Texel.y * 1.5)).rgb;
  vec3 down = texture2D(textureSampler, vUV - vec2(0., r24Texel.y * 1.5)).rgb;
  float edge = max(length(right - left), length(up - down));
  // Continuous light grouping, not hard posterization: preserve dark face/cloth detail.
  float scaled = clamp(y, 0., 1.) * 5.;
  float band = (floor(scaled) + smoothstep(.16, .84, fract(scaled))) / 5.;
  float contrastY = mix(y, y * y * (3. - 2. * y), .60);
  float paintedY = mix(contrastY, band, .20);
  vec3 muted = mix(vec3(y), c, .56);
  vec3 paint = muted * (paintedY / max(.04, y));
  // Warm painted lights and cool deep shadows; no paper texture or new scene assets.
  paint += vec3(.065, .025, -.045) * smoothstep(.35, .85, y);
  paint += vec3(-.026, .002, .036) * (1. - smoothstep(.12, .58, y));
  paint += vec3(.018, -.004, -.020) * smoothstep(.18, .42, y) * (1. - smoothstep(.62, .88, y));
  // Smooth only high-contrast pixel edges; shallow hair grooves stay uninked.
  float broadEdge = smoothstep(.15, .46, edge);
  vec3 neighborMean = (left + right + up + down) * .25;
  paint = mix(paint, neighborMean, broadEdge * .08);
  float ink = broadEdge * .42 * smoothstep(.04, .30, y);
  paint = mix(paint, vec3(.055, .061, .057), ink);
  gl_FragColor = vec4(clamp(paint, 0., 1.), source.a);
}`;

function set(scene, mode) {
  if (mode !== "3d" && mode !== "painted") throw new RangeError("R24 render style must be 3d or painted");
  if (!scene || typeof scene.getEngine !== "function") throw new TypeError("R24 render style needs a Babylon scene");
  const B = global.BABYLON;
  let state = states.get(scene);
  // Default 3d does not allocate a pass, touch materials, or change the scene.
  if (!state && mode === "3d") { latestMode = mode; return mode; }
  if (mode === "painted" && !scene.activeCamera) throw new Error("R24 painted style needs an active camera");
  if (!state) {
    B.Effect.ShadersStore[shaderName + "FragmentShader"] = fragment;
    const pass = new B.PostProcess("r24-painted-presentation", shaderName,
      ["r24Texel"], null, 1, null, B.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
    // Canvas antialiasing does not automatically multisample this offscreen target.
    pass.samples = Math.min(4, Math.max(1, scene.getEngine().getCaps().maxMSAASamples || 1));
    pass.onApply = effect => effect.setFloat2("r24Texel",
      1 / Math.max(1, pass.width), 1 / Math.max(1, pass.height));
    state = { mode: "3d", camera: null, pass, slots: new WeakMap() };
    states.set(scene, state);
    state.attachReady = () => {
      if (state.mode !== "painted" || state.camera || !scene.activeCamera || !pass.isReady()) return;
      state.camera = scene.activeCamera;
      // Reuse Babylon's detached slot so repeated toggles do not grow its list.
      const index = state.slots.get(state.camera) ?? null;
      state.slots.set(state.camera, state.camera.attachPostProcess(pass, index));
    };
    // A cold pass clears its target before apply() can reject an unready shader.
    const observer = scene.onBeforeRenderObservable.add(state.attachReady);
    scene.onDisposeObservable.addOnce(() => {
      scene.onBeforeRenderObservable.remove(observer);
      if (state.camera) state.camera.detachPostProcess(pass);
      pass.dispose();
      states.delete(scene);
    });
  }
  if (state.camera && (mode === "3d" || state.camera !== scene.activeCamera)) {
    state.camera.detachPostProcess(state.pass);
    state.camera = null;
  }
  state.mode = mode;
  if (mode === "painted") state.attachReady();
  latestMode = mode;
  return mode;
}

global.R24RenderStyle = Object.freeze({
  set,
  get: scene => scene ? (states.get(scene)?.mode || "3d") : latestMode,
  applied: scene => states.get(scene)?.camera && states.get(scene).camera === scene.activeCamera ? "painted" : "3d",
  ready: scene => { const state = states.get(scene); return !state || state.mode === "3d" || !!state.camera && state.camera === scene.activeCamera && state.pass.isReady(); }
});
})(typeof window === "undefined" ? globalThis : window);
