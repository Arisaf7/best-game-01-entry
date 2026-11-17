// VOIDKEEPER — keyboard and mouse input, kept in one place.
// The world reads a plain snapshot each frame: which movement keys are held,
// where the mouse points in game coordinates, and which buttons were just
// pressed. Screenshot runs drive the same snapshot from an autopilot.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pressedKeys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    mousePressed: false,
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    setView(scale, offsetX, offsetY) {
      this.scale = scale;
      this.offsetX = offsetX;
      this.offsetY = offsetY;
    },

    toGame(clientX, clientY) {
      return {
        x: (clientX - this.offsetX) / this.scale,
        y: (clientY - this.offsetY) / this.scale,
      };
    },

    attach() {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('blur', this.onBlur);
      canvas.addEventListener('mousemove', this.onMouseMove);
      canvas.addEventListener('mousedown', this.onMouseDown);
      window.addEventListener('mouseup', this.onMouseUp);
      canvas.addEventListener('contextmenu', this.onContextMenu);
    },

    onKeyDown: (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) input.pressedKeys.add(event.key.toLowerCase());
      input.keys.add(event.key.toLowerCase());
    },

    onKeyUp: (event) => {
      input.keys.delete(event.key.toLowerCase());
    },

    onBlur: () => {
      input.keys.clear();
      input.mouse.down = false;
    },

    onMouseMove: (event) => {
      const point = input.toGame(event.clientX, event.clientY);
      input.mouse.x = point.x;
      input.mouse.y = point.y;
    },

    onMouseDown: (event) => {
      if (event.button === 0) {
        const point = input.toGame(event.clientX, event.clientY);
        input.mouse.x = point.x;
        input.mouse.y = point.y;
        input.mouse.down = true;
        input.mousePressed = true;
      }
      if (event.button === 2) {
        input.pressedKeys.add('nova');
      }
    },

    onMouseUp: (event) => {
      if (event.button === 0) input.mouse.down = false;
    },

    onContextMenu: (event) => {
      event.preventDefault();
    },

    moveVector() {
      let x = 0;
      let y = 0;
      if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
      if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const length = Math.hypot(x, y);
        x /= length;
        y /= length;
      }
      return { x, y };
    },

    firing() {
      return this.mouse.down || this.keys.has(' ');
    },

    wasPressed(key) {
      return this.pressedKeys.has(key.toLowerCase());
    },

    endFrame() {
      this.pressedKeys.clear();
      this.mousePressed = false;
    },
  };

  input.onKeyDown = input.onKeyDown.bind(input);
  input.onKeyUp = input.onKeyUp.bind(input);
  input.onBlur = input.onBlur.bind(input);
  input.onMouseMove = input.onMouseMove.bind(input);
  input.onMouseDown = input.onMouseDown.bind(input);
  input.onMouseUp = input.onMouseUp.bind(input);
  input.onContextMenu = input.onContextMenu.bind(input);
  return input;
}
