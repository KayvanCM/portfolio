// Thinking-orbs WebGL shader library — pill showcase for the Side Projects modal.
//
// Public API:
//   window.mountThinkingOrbsPills(container)
//     Renders a 2×2 grid of pill-shaped loading indicators into `container`.
//     Each pill has a shader on the left and a monospace label on the right:
//       - Thinking / Breathe    (Fibonacci sphere, uniform scale pulse)
//       - Solving  / Tide       (two-liquid vessel, gentle wave motion)
//       - Searching / Scan      (Fibonacci sphere, horizontal orange scanner)
//       - Pondering / Twinkle   (Fibonacci sphere, per-dot brightness noise)
(function () {
  const VERT = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`

  const HEAD = `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_res;
    const vec3 BG      = vec3(0.117, 0.117, 0.133);
    const vec3 DOT     = vec3(0.957, 0.945, 0.918);
    const vec3 ACCENT  = vec3(0.910, 0.522, 0.235);
    vec3 rotY(vec3 p, float ang) { float c = cos(ang), s = sin(ang); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
    vec3 rotX(vec3 p, float ang) { float c = cos(ang), s = sin(ang); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
    vec3 fibPoint(int i, int N) {
      float ii = float(i) + 0.5;
      float phi = acos(1.0 - 2.0 * ii / float(N));
      float theta = 3.14159265 * (1.0 + sqrt(5.0)) * ii;
      return vec3(sin(phi)*cos(theta), cos(phi), sin(phi)*sin(theta));
    }
  `

  const FRAG_BREATHE = HEAD + `
    const int N = 90;
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res.xy) / min(u_res.x, u_res.y);
      float r = length(uv);
      if (r > 0.5) { gl_FragColor = vec4(BG, 1.0); return; }
      float ang = u_time * 0.5;
      float breathe = 0.42 + 0.045 * sin(u_time * 3.14);
      vec3 col = BG;
      for (int i = 0; i < N; i++) {
        vec3 p = fibPoint(i, N);
        p = rotY(p, ang); p = rotX(p, 0.35);
        vec2 proj = p.xy * breathe;
        float d = length(uv - proj);
        float alpha = smoothstep(0.024, 0.012, d);
        float w = smoothstep(-0.3, 0.65, p.z);
        col = mix(col, DOT, alpha * w);
      }
      float edge = smoothstep(0.5, 0.48, r);
      col = mix(BG, col, edge);
      gl_FragColor = vec4(col, 1.0);
    }
  `

  const FRAG_TIDE = HEAD + `
    const vec3 VESSEL       = vec3(0.961, 0.961, 0.953);
    const vec3 BACK_LIQUID  = vec3(0.245, 0.245, 0.263);
    const vec3 FRONT_LIQUID = vec3(0.961, 0.961, 0.953);
    const vec3 PILL_BG      = vec3(0.043, 0.043, 0.047);
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res.xy) / min(u_res.x, u_res.y);
      float r = length(uv);
      float aa = 1.5 / min(u_res.x, u_res.y);
      if (r > 0.505) { gl_FragColor = vec4(PILL_BG, 1.0); return; }
      float backBase = 0.052 + 0.020 * sin(u_time * 1.05);
      float backWave =
          sin(uv.x * 5.5 + u_time * 1.55)         * 0.028
        + sin(uv.x * 9.0 - u_time * 2.25 + 1.20)  * 0.014;
      float backSurface = backBase + backWave;
      float frontBase = 0.030 + 0.022 * sin(u_time * 1.10 + 1.30);
      float frontWave =
          sin(uv.x * 6.0 - u_time * 1.65 + 0.70)  * 0.030
        + sin(uv.x * 10.0 + u_time * 2.45)        * 0.015;
      float frontSurface = frontBase + frontWave;
      vec3 col = PILL_BG;
      float belowBack  = smoothstep(backSurface  + aa, backSurface  - aa, uv.y);
      col = mix(col, BACK_LIQUID, belowBack);
      float belowFront = smoothstep(frontSurface + aa, frontSurface - aa, uv.y);
      col = mix(col, FRONT_LIQUID, belowFront);
      float rim = smoothstep(0.478 - aa*2.0, 0.478, r) - smoothstep(0.497, 0.497 + aa*2.0, r);
      col = mix(col, VESSEL, rim);
      float outsideFade = smoothstep(0.497, 0.505, r);
      col = mix(col, PILL_BG, outsideFade);
      gl_FragColor = vec4(col, 1.0);
    }
  `

  const FRAG_SCAN = HEAD + `
    const int N = 130;
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res.xy) / min(u_res.x, u_res.y);
      float r = length(uv);
      if (r > 0.5) { gl_FragColor = vec4(BG, 1.0); return; }
      float ang = u_time * 0.55;
      float scanY = mix(0.35, -0.35, fract(u_time / 1.5));
      vec3 col = BG;
      for (int i = 0; i < N; i++) {
        vec3 p = fibPoint(i, N);
        p = rotY(p, ang); p = rotX(p, 0.35);
        vec2 proj = p.xy * 0.42;
        float d = length(uv - proj);
        float alpha = smoothstep(0.024, 0.012, d);
        float w = smoothstep(-0.3, 0.65, p.z);
        float scanFalloff = smoothstep(0.10, 0.0, abs(proj.y - scanY));
        vec3 dotCol = mix(DOT, ACCENT, scanFalloff);
        col = mix(col, dotCol, alpha * w);
      }
      float edge = smoothstep(0.5, 0.48, r);
      col = mix(BG, col, edge);
      gl_FragColor = vec4(col, 1.0);
    }
  `

  const FRAG_TWINKLE = HEAD + `
    const int N = 130;
    float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res.xy) / min(u_res.x, u_res.y);
      float r = length(uv);
      if (r > 0.5) { gl_FragColor = vec4(BG, 1.0); return; }
      float ang = u_time * 0.32;
      float tilt = 0.32 + 0.10 * sin(u_time * 0.4);
      vec3 col = BG;
      for (int i = 0; i < N; i++) {
        vec3 p = fibPoint(i, N);
        p = rotY(p, ang); p = rotX(p, tilt);
        vec2 proj = p.xy * 0.42;
        float phase = hash1(float(i)) * 6.2831853;
        float freq  = 2.0 + hash1(float(i) + 7.0) * 2.4;
        float tw = 0.5 + 0.5 * sin(u_time * freq + phase);
        float bright = mix(0.15, 1.05, tw);
        float dotR   = mix(0.014, 0.022, tw);
        float d = length(uv - proj);
        float alpha = smoothstep(dotR, dotR * 0.5, d);
        float w = smoothstep(-0.3, 0.65, p.z);
        col = mix(col, DOT * bright, alpha * w);
      }
      float edge = smoothstep(0.5, 0.48, r);
      col = mix(BG, col, edge);
      gl_FragColor = vec4(col, 1.0);
    }
  `

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null }
    return s
  }
  function driveShader(canvas, fragSrc, rafs) {
    // DPR-aware backing size
    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr  = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = Math.max(1, Math.round(rect.width  * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
    }
    resize()
    const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false })
    if (!gl) return
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc))
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const uT = gl.getUniformLocation(prog, 'u_time')
    const uR = gl.getUniformLocation(prog, 'u_res')
    const t0 = performance.now()
    function frame() {
      const t = (performance.now() - t0) / 1000
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uT, t); gl.uniform2f(uR, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafs.push(requestAnimationFrame(frame))
    }
    frame()
  }

  function animateDots(el, offsetMs, mode, rafs) {
    const t0 = performance.now() + offsetMs
    let lastN = -1
    function step() {
      const n = Math.floor(((performance.now() - t0) / 500) % 4)
      if (n !== lastN) {
        lastN = n
        if (mode === 'squares') el.innerHTML = '<span class="dot-sq"></span>'.repeat(n)
        else el.textContent = '.'.repeat(n)
      }
      rafs.push(requestAnimationFrame(step))
    }
    step()
  }

  window.mountThinkingOrbsPills = function (container) {
    // The whole grid mounts inside `container`. When the container is later
    // removed from the DOM (modal closes), we cancel all our RAF loops so
    // we're not still burning CPU on hidden canvases.
    container.innerHTML = `
      <div class="pill-grid">
        <div class="tp-cell">
          <div class="tp-pill">
            <canvas class="tp-canvas" data-shader="breathe"></canvas>
            <span class="tp-label">Thinking<span class="tp-dots" data-key="A">...</span></span>
          </div>
          <div class="tp-caption">Breathe</div>
        </div>
        <div class="tp-cell">
          <div class="tp-pill">
            <canvas class="tp-canvas" data-shader="tide"></canvas>
            <span class="tp-label">Solving<span class="tp-dots">...</span></span>
          </div>
          <div class="tp-caption">Tide</div>
        </div>
        <div class="tp-cell">
          <div class="tp-pill">
            <canvas class="tp-canvas" data-shader="scan"></canvas>
            <span class="tp-label">Searching<span class="tp-dots" data-key="C" data-mode="squares">...</span></span>
          </div>
          <div class="tp-caption">Scan</div>
        </div>
        <div class="tp-cell">
          <div class="tp-pill">
            <canvas class="tp-canvas" data-shader="twinkle"></canvas>
            <span class="tp-label">Pondering<span class="tp-dots">...</span></span>
          </div>
          <div class="tp-caption">Twinkle</div>
        </div>
      </div>
    `
    const rafs = []
    const shaders = { breathe: FRAG_BREATHE, tide: FRAG_TIDE, scan: FRAG_SCAN, twinkle: FRAG_TWINKLE }
    container.querySelectorAll('.tp-canvas').forEach((cv) => {
      driveShader(cv, shaders[cv.dataset.shader], rafs)
    })
    // Only the Thinking + Searching dots animate; others stay static "...".
    container.querySelectorAll('.tp-dots[data-key]').forEach((el) => {
      const offset = el.dataset.key === 'A' ? 0 : 240
      animateDots(el, offset, el.dataset.mode, rafs)
    })

    // Cleanup: cancel all RAF loops when the container leaves the DOM.
    const observer = new MutationObserver(() => {
      if (!document.body.contains(container)) {
        rafs.forEach(cancelAnimationFrame)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { subtree: true, childList: true })
  }
})()
