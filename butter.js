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
  //'M293.18 70.67C272.98 73.21 263.58 87.93 258.27 105.99C255.38 115.81 252.32 141.15 241.3 141.08C221.29 140.95 258.34 75.58 213.51 77.52C178.3 79.05 171.56 124.14 167.89 150.9C162.89 192.99 180.15 225.38 225.84 225.88C274.9 226.42 301.42 190.57 311.3 146.02C315.13 127.52 330.58 65.97 293.18 70.67Z' +
    //'M404.49 53.95C377.1 58.5 332.47 63.66 326.28 97.51C319.17 129.97 364.94 113.23 358.07 145.67C354.98 164.12 341.67 222.37 376.97 218.61C412.08 214.86 417.65 164.57 421.81 137.47C426.19 104.87 466.51 108.85 471.16 75.62C478.77 37.98 423.97 50.71 404.49 53.95Z' +
    //'M555.76 28.12C527.99 32.44 481.89 39.16 477.57 74.59C470.77 108.83 515.9 91.47 509.36 125.52C506.45 144.29 492.12 207.33 528.26 203.53C564.34 199.74 569.15 145 573.1 117.89C577.29 84.16 618.02 89.1 622.45 54.88C629.49 16.35 578.27 24.62 555.76 28.12Z' +
    //'M746.65 106.25C750.52 85.14 725.8 93.07 725.94 77.85C727.68 69.8 734.07 70.06 739.99 66.14C749.06 60.13 754.95 53.86 755.94 41.91C762.21 10.66 715.03 12.45 696.31 13.39C641.82 16.11 626.15 61.11 618.48 108.46C612.7 152.82 614.02 196.78 668.81 196.23C689.57 196.02 734.07 200.38 737.34 170.24C742.42 147.19 716.8 148.07 718.08 132.62C721.14 117.26 744.95 126.9 746.64 106.24L746.65 106.25Z' +
    //'M756.79 106.88C763.08 67.42 775.01 11.64 826.32 18.92C862.38 24.04 888.31 51.76 882.86 89.22C880.1 103.64 877.1 117.7 864.04 126.08C861.19 128.08 858.58 129.93 856.64 133.01C850.67 144.42 859.15 157.25 865.43 166.48C867.4 169.61 869.29 172.61 870.74 175.36C879.95 192.4 869.79 221.81 846.63 216.35C837.63 214.22 831.52 207.56 825.81 201.33C820.69 195.73 815.82 190.41 809.25 189.25C803.29 188.2 800 191.26 796.23 194.66C791.22 199.19 785.17 203.93 771.31 202.41C735.75 198.52 754.17 126.19 756.79 106.88ZM822.81 80.1C827.85 80.89 832.59 76.98 833.4 71.34C834.21 65.7 830.78 60.48 825.74 59.7C820.7 58.92 815.96 62.86 815.15 68.49C814.34 74.12 817.77 79.31 822.81 80.11V80.1Z' +
    //'M24.48 129.27C33.79 81.89 62.34 70.98 107.01 75.54C129.1 77.8 169.87 80.51 162.43 113.04C160.69 123.3 154.62 131.44 146.06 137.02C142.47 139.55 139.58 141.54 138.99 144.74C138.43 147.78 140.58 150.5 143.35 153.97C150.86 162.49 154.71 174.4 151.94 185.69C145.79 220.24 102.56 215.16 77.73 210.36C61.33 207.19 41.2 201.68 30.17 187.84C17.21 171.58 20.65 148.14 24.48 129.27ZM107.63 112.54C106.82 116.68 102.08 119.6 97.04 118.93C92 118.26 88.57 114.3 89.38 110.22C90.19 106.15 94.93 103.46 99.97 104.07C105.01 104.68 108.44 108.4 107.63 112.53V112.54ZM84.94 181.02C89.98 181.95 94.72 179.4 95.53 175.31C96.34 171.22 92.91 167.22 87.87 166.35C82.83 165.48 78.09 168.03 77.28 172.05C76.47 176.07 79.9 180.09 84.94 181.02Z',
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
