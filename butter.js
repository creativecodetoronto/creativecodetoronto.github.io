// Parse the `d` attribute of an SVG path into an array of draw commands that we
// can edit
const toPoints = (d) => {
  const tokens = d.split(/ |(M|C|Z|L)/g).filter((t) => t)
  const commands = []
  while (tokens.length > 0) {
    const command = tokens.shift()
    const points = []
    while (tokens.length > 0 && !['C', 'M', 'Z', 'L'].includes(tokens[0])) {
      const x = parseFloat(tokens.shift())
      const y = parseFloat(tokens.shift())
      points.push({ x, y })
    }
    commands.push({ command, points })
  }
  return commands
}

// Reference to the path element. If we only use React state, we wouldn't need
// this, but for performance we bypass the React rendering cycle and edit the
// DOM node directly
const svg = document.getElementById('butterSVG')
const path = document.getElementById('butter')

// Convert a path drawing command array back into a string that we can put into
// a <path> tag
const toD = (commands) =>
  commands
    .map(
      ({ command, points }) =>
        command +
        ' ' +
        points.map(({ x, y }) => `${x.toFixed(4)} ${y.toFixed(4)}`).join(' '),
    )
    .join(' ')

// The original path data from Figma
const pathCommands = toPoints(
  path.getAttribute('d')
)

// The current amount of offset being applied. 0 is the original logo, 1 uses
// the full wiggly sine wave function
let amplitude = 0

// What amplitude we should ease into. This jumps from 0 to 1 as you mouse
// in, and `amplitude` smoothly eases
let targetAmplitude = 0

// Time in seconds
let time = 0

let mouse = { x: 0, y: 0 }

const width = 903
const height = 237
const padding = 20

const calculatePath = () => {
  const t = time * 0.4
  const rect = path.getBoundingClientRect() ?? {
    left: 0,
    top: 0,
    width: 100,
    height: 30,
  }
  const scale = Math.min(
    rect.width / (width + 2 * padding),
    rect.height / (height + 2 * padding),
  )
  const local = {
    x: (mouse.x - rect.left) / scale,
    y: (mouse.y - rect.top) / scale,
  }
  const clamp = (x, min, max) => Math.max(Math.min(x, max), min)
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)
  }
  const wavyPathCommands = pathCommands.map(({ command, points }) => ({
    command,
    points: points.map(({ x, y }) => {
      const closeToMouse =
        smoothstep(local.x - 300, local.x, x) *
        smoothstep(-local.x - 300, -local.x, -x)
      return {
        x: x + amplitude * (16 * Math.sin(x / 200 + y / 80 + 4 * t)),
        y:
          y +
          amplitude *
            (10 * Math.sin(x / 80 + y / 200 + 4 * t + 10) -
              20 * closeToMouse),
      }
    }),
  }))
  return toD(wavyPathCommands)
}

let mouseMove = null
const clearMouseMove = () => {
  if (mouseMove) {
    window.removeEventListener('mousemove', mouseMove)
  }
}
const onMouseOver = () => {
  targetAmplitude = 1
  mouseMove = (event) => {
    mouse = { x: event.clientX, y: event.clientY }
  }
  clearMouseMove()
  window.addEventListener('mousemove', mouseMove)
}
const onMouseOut = () => {
  targetAmplitude = 0
  reRender()
}

let running = true

requestAnimationFrame(function onTick() {
  amplitude += (targetAmplitude - amplitude) / 12
  reRender()
  if (running) return requestAnimationFrame(onTick)
})

const reRender = () => {
  if (amplitude > 1e-4) {
    time = window.performance.now() / 1000
    // Each tick, set the `d` attribute of the underlying DOM node.
    // Skipping the React tree diffing and layout algorithms is faster
    // for animations like this.
    path.setAttribute('d', calculatePath())
  }
}

butterSVG.addEventListener('mouseover', onMouseOver)
butterSVG.addEventListener('mouseout', onMouseOut)
