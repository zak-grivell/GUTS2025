/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

function rand_array(items) {
  return items[Math.floor(Math.random() * items.length)];
}

let images = {
  I: new Image(),
  J: new Image(),
  L: new Image(),
  O: new Image(),
  S: new Image(),
  T: new Image(),
  Z: new Image(),
};

const grid_size = 32;

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
  I: [
    [p(0, 0), p(0, 1), p(0, 2), p(0, 3)],
    [p(0, 0), p(1, 0), p(2, 0), p(3, 0)],
  ],
  J: [
    [p(1, 0), p(1, 1), p(1, 2), p(0, 2)],
    [p(0, 0), p(0, 1), p(1, 1), p(1, 2)],
    [p(0, 0), p(1, 0), p(0, 1), p(0, 2)],
    [p(0, 0), p(1, 0), p(2, 0), p(1, 2)],
  ],
  L: [
    [p(0, 0), p(0, 1), p(0, 2), p(1, 2)],
    [p(0, 0), p(0, 1), p(1, 0), p(2, 0)],
    [p(0, 0), p(1, 0), p(1, 1), p(1, 2)],
    [p(0, 1), p(1, 1), p(1, 2), p(2, 0)],
  ],
  O: [[p(0, 0), p(0, 1), p(1, 0), p(1, 1)]],
  S: [
    [p(0, 0), p(0, 1), p(1, 1), p(1, 2)],
    [p(0, 1), p(1, 1), p(1, 0), p(2, 0)],
  ],
  T: [
    [p(1, 0), p(0, 1), p(1, 1), p(1, 2)],
    [p(0, 1), p(1, 1), p(1, 0), p(2, 1)],
    [p(0, 0), p(0, 1), p(0, 2), p(1, 1)],
    [p(0, 0), p(1, 0), p(2, 0), p(1, 1)],
  ],
  Z: [
    [p(1, 0), p(1, 1), p(0, 1), p(0, 2)],
    [p(0, 0), p(1, 0), p(1, 1), p(2, 1)],
  ],
};

Object.keys(images).forEach((k) => {
  images[k].src = `assets/${k}.png`;
});

images.notgiven = new Image();

images.notgiven.src = "assets/notgiven.png";

function render_block(block) {
  block_shapes[block.t][block.rotation].forEach((offset) => {
    let p = v_add(block.pos, offset);

    ctx.drawImage(
      images.notgiven,
      p.x * grid_size,
      p.y * grid_size,
      grid_size,
      grid_size,
    );
  });
}

function render_single(pos, block) {
  ctx.drawImage(
    block.sprite,
    block.pos.x * grid_size,
    block.pos.y * grid_size,
    grid_size,
    grid_size,
  );
}

const X_SIZE = 10;
const Y_SIZE = 20;

let grid = Array.apply(null, Array(Y_SIZE)).map(() =>
  Array(X_SIZE).map(() => null),
);

function gg(point) {
  grid[point.y][point.x];
}

function gs(point, val) {
  grid[point.y][point.x] = val;
}

function check_direction(current_down, direction, rotation) {
  return block_shapes[current_down.t][rotation].some((pos) => {
    let p = v_add(v_add(pos, current_down.pos), direction);

    if (p.x < 0 || p.y >= Y_SIZE || p.x >= X_SIZE) {
      return true;
    }
    return gg(p) != null;
  });
}

let current_down = {
  t: rand_array(block_types),
  pos: { x: X_SIZE / 2, y: 0 },
  rotation: 0,
};

function moveCellDown(point) {
  if (gg(point) == null && gg({})) {
    return;
  }
}

function on_load() {
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (check_direction(current_down, { x: 0, y: 1 }, current_down.rotation)) {
      const y_changed = [];
      block_shapes[current_down.t][current_down.rotation].forEach((pos) => {
        gs(v_add(pos, current_down.pos), {
          sprite: images.notgiven,
          pos: v_add(pos, current_down.pos),
        });
        y_changed.push(pos.y);
      });

      y_changed.toSorted().forEach((y) => {
        let should_clear = grid[y].every((v) => v != null);
        console.log(should_clear);

        if (should_clear) {
          grid[y].forEach((_, i) => {
            grid[y][i] = null;
          });
        }
      });

      current_down = {
        t: rand_array(block_types),
        pos: { x: X_SIZE / 2, y: 0 },
        rotation: 0,
      };
    }

    grid.forEach((row, y) =>
      row.forEach((item, x) => render_single({ x, y }, item)),
    );

    render_block(current_down);
    current_down.pos.y += 1;
  }, 200);
}

document.addEventListener("keydown", function (event) {
  let next_rot =
    (current_down.rotation + 1) % block_shapes[current_down.t].length;

  if (
    event.key == "ArrowLeft" &&
    !check_direction(current_down, { x: -1, y: 0 }, current_down.rotation)
  ) {
    current_down.pos.x = Math.max(0, current_down.pos.x - 1);
    console.log("left");
  } else if (
    event.key == "ArrowRight" &&
    !check_direction(current_down, { x: 1, y: 0 }, current_down.rotation)
  ) {
    console.log("right");
    current_down.pos.x = Math.min(9, current_down.pos.x + 1);
  } else if (
    event.key == "ArrowUp" &&
    !check_direction(current_down, { x: 0, y: 0 }, next_rot)
  ) {
    current_down.rotation = next_rot;
  }
});

const rotate90degs = v => p(-v.y, v.x);
const translateCoord = o => v => p(v.x - o.x, v.y - o.y);

function rotateObj(arr) {
  let width = 0, height = 0;
  for(const v of arr) {
    if(v.x > width) width = v.x;
    if(v.y > height) height = v.y;
  }
  const translateFn = translateCoord(p(width / 2, height / 2));
  const iLimit = arr.length;
  const ret = new Array(iLimit);
  for(let i = 0; i < iLimit; i++) ret[i] = rotate90degs(translateFn(arr[i]));
  return ret;
}
