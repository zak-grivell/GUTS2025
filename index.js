/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let tetris_grid = {};

let images = {
  I: new Image(),
  J: new Image(),
  L: new Image(),
  O: new Image(),
  S: new Image(),
  T: new Image(),
  Z: new Image(),
};

function p(x, y) {
  return { x, y };
}

function v_string(a) {
  return `${a.x}:${a.y}`;
}

function v_add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

let block_types = "IJLOSTZ";

let block_shapes = {
  I: [p(0, 0), p(0, 1), p(0, 2), p(0, 3)],
  J: [p(1, 0), p(1, 1), p(1, 2), p(0, 2)],
  L: [p(0, 0), p(0, 1), p(0, 2), p(1, 2)],
  O: [p(0, 0), p(0, 1), p(1, 0), p(1, 1)],
  S: [p(0, 0), p(0, 1), p(1, 1), p(1, 2)],
  T: [p(1, 0), p(0, 1), p(1, 1), p(1, 2)],
  Z: [p(1, 0), p(1, 1), p(0, 1), p(0, 2)],
};

Object.keys(images).forEach((k) => {
  images[k].src = `assets/${k}.png`;
});

images.notgiven = new Image();

images.notgiven.src = "assets/notgiven.png";

function render_block(block) {
  ctx.drawImage(
    images[block.t],
    block.pos.x * 16,
    block.pos.y * 16,
    block.size.x * 16,
    block.size.y * 16,
  );
}

function render_single(pos, block) {
  ctx.drawImage(block.sprite, block.pos.x * 16, block.pos.y * 16, 16, 16);
}

const X_SIZE = 10;
const Y_SIZE = 20;

let grid = new Map();

function check_direction(current_down, direction) {
  return block_shapes[current_down.t].some((pos) => {
    let p = v_add(pos, current_down.pos);
    return grid.has(v_string(v_add(p, direction)));
  });
}

function should_stop(current_down) {
  if (current_down.pos.y + current_down.size.y == Y_SIZE) {
    return true;
  }

  return check_direction(current_down, { x: 0, y: 1 });
}

let current_down = {
  t: "I",
  pos: { x: 0, y: 0 },
  size: { x: 1, y: 4 },
};

function on_load() {
  window.requestAnimationFrame(() => {});

  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (should_stop(current_down)) {
      block_shapes[current_down.t].forEach((pos) => {
        grid.set(v_string(v_add(pos, current_down.pos)), {
          sprite: images.notgiven,
          pos: v_add(pos, current_down.pos),
        });
      });

      current_down = {
        t: "O",
        pos: { x: 0, y: 0 },
        size: { x: 2, y: 2 },
      };
    }

    grid.forEach((k, v) => render_single(v, k));

    // console.log(grid);

    render_block(current_down);
    current_down.pos.y += 1;
  }, 100);
}

document.addEventListener("keydown", function (event) {
  if (event.keyCode == 37 && check_direction(current_down, { x: -1, y: 0 })) {
    current_down.pos.x = Math.max(0, current_down.pos.x - 1);
  } else if (
    event.keyCode == 39 &&
    check_direction(current_down, { x: 1, y: 0 })
  ) {
    current_down.pos.x = Math.min(9, current_down.pos.x + 1);
  }
});
