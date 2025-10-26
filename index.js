/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

function rand_array(items) {
  // return "S";
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

const middle_offsets = {
  I: 0,
  J: 1,
  L: 1,
  O: 1,
  S: 1,
  T: 1,
  Z: 1,
};

const vert_sizes = {
  I: { x: 1, y: 4 },
  J: { x: 2, y: 3 },
  L: { x: 2, y: 3 },
  O: { x: 2, y: 2 },
  S: { x: 2, y: 3 },
  T: { x: 2, y: 3 },
  Z: { x: 2, y: 3 },
};

function p(x, y) {
  return { x, y };
}

function v_add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function v_eq(a, b) {
  return a.x == b.x && a.y == b.y;
}

let block_types = "IJLOSTZ";

let running = false;

let block_shapes = {
  I: [
    [p(0, 0), p(0, 1), p(0, 2), p(0, 3)],
    // [p(0, 0), p(1, 0), p(2, 0), p(3, 0)],
  ],
  J: [
    [p(1, 0), p(1, 1), p(1, 2), p(0, 2)],
    // [p(0, 0), p(0, 1), p(1, 1), p(1, 2)],
    // [p(0, 0), p(1, 0), p(0, 1), p(0, 2)],
    // [p(0, 0), p(1, 0), p(2, 0), p(1, 2)],
  ],
  L: [
    [p(0, 0), p(0, 1), p(0, 2), p(1, 2)],
    // [p(0, 0), p(0, 1), p(1, 0), p(2, 0)],
    // [p(0, 0), p(1, 0), p(1, 1), p(1, 2)],
    // [p(0, 1), p(1, 1), p(1, 2), p(2, 0)],
  ],
  O: [[p(0, 0), p(0, 1), p(1, 0), p(1, 1)]],
  S: [
    [p(0, 0), p(0, 1), p(1, 1), p(1, 2)],
    // [p(0, 1), p(1, 1), p(1, 0), p(2, 0)],
  ],
  T: [
    [p(1, 0), p(0, 1), p(1, 1), p(1, 2)],
    // [p(0, 1), p(1, 1), p(1, 0), p(2, 1)],
    // [p(0, 0), p(0, 1), p(0, 2), p(1, 1)],
    // [p(0, 0), p(1, 0), p(2, 0), p(1, 1)],
  ],
  Z: [
    [p(1, 0), p(1, 1), p(0, 1), p(0, 2)],
    // [p(0, 0), p(1, 0), p(1, 1), p(2, 1)],
  ],
};

Object.keys(images).forEach((k) => {
  images[k].src = `assets/${k}.png`;
});

images.notgiven = new Image();

images.notgiven.src = "assets/cube.png";

let rotation_offsets = {
  0: { x: 0, y: -1 },
  90: { x: 0, y: 0 },
  180: { x: 0, y: 0 },
  270: { x: 0, y: 0 },
};

function sprite_map_get(sprit_map, offset) {
  for (const item of sprit_map) {
    if (v_eq(item[1], offset)) {
      return item[0];
    }
  }

  console.log("not found", offset, sprit_map);
}

function render_block(block) {
  block.shape.forEach((offset) => {
    ctx.save();

    let p = v_add(block.pos, offset);

    let sp_map = sprite_map_get(block.sprite_map, offset);

    ctx.translate(
      p.x * grid_size + grid_size / 2,
      p.y * grid_size + grid_size / 2,
    );

    console.log(block.angle);

    // rotate the canvas to the specified degrees
    ctx.rotate((block.angle * Math.PI) / 180);

    ctx.drawImage(
      images[block.t],
      sp_map.x * 16,
      sp_map.y * 16,
      16,
      16,
      -grid_size / 2,
      -grid_size / 2,
      grid_size,
      grid_size,
    );

    ctx.restore();
  });
}

function render_single(pos, block) {
  ctx.save();

  // move to the center of the canvas
  ctx.translate(
    pos.x * grid_size + grid_size / 2,
    pos.y * grid_size + grid_size / 2,
  );

  // rotate the canvas to the specified degrees
  ctx.rotate((block.angle * Math.PI) / 180);

  ctx.drawImage(
    block.sprite,
    block.sprite_offset.x * 16,
    block.sprite_offset.y * 16,
    16,
    16,
    -grid_size / 2,
    -grid_size / 2,
    grid_size,
    grid_size,
  );

  // we’re done with the rotating so restore the unrotated context
  ctx.restore();
}

const X_SIZE = 10;
const Y_SIZE = 20;

let grid = Array.from({ length: Y_SIZE + 1 }, () =>
  Array.from({ length: X_SIZE }, () => null),
);

function gg(point) {
  try {
    return grid[point.y][point.x];
  } catch (e) {
    console.log(point);
    throw e;
  }
}

function gs(point, val) {
  grid[point.y][point.x] = val;
}

function check_direction(current_down, direction, shape) {
  return shape.some((pos) => {
    let p = v_add(v_add(pos, current_down.pos), direction);

    let out_of_bounds = p.x < 0 || p.y >= Y_SIZE || p.x >= X_SIZE;

    if (p.y < 0) {
      return false;
    }

    return out_of_bounds || gg(p) !== null;
  });
}

function clearRow(y) {
  grid.splice(y, 1);
}

function rowFull(y) {
  try {
    return grid[y].every((v) => v !== null);
  } catch (e) {
    console.log(y, grid[y]);
    throw e;
  }
}

function add_cube(position, sprite, sprite_offset, angle) {
  gs(position, {
    sprite,
    sprite_offset,
    angle,
  });
}

function spawn_block() {
  let next_shape = rand_array(block_types);

  current_down = {
    t: next_shape,
    pos: { x: X_SIZE / 2 + middle_offsets[next_shape], y: -4 },
    shape: block_shapes[next_shape][0],
    sprite_map: block_shapes[next_shape][0].map((v) => [v, v]),
    angle: 0,
  };
}

let score = 0;

function gameOver() {
  ctx.font = "32px 'Press Start 2P'";

  ctx.fillText("Oh No", 90, 100);
  ctx.fillText("We could", 50, 150);
  ctx.fillText("Not", 130, 200);
  ctx.fillText("Fit A", 90, 250);
  ctx.fillText("Weekend", 50, 300);
  ctx.fillText("Away", 90, 350);
  ctx.fillText("in the", 90, 400);
  ctx.fillText("Suitcase", 50, 450);

  ctx.font = "28px 'Press Start 2P'";
  ctx.fillText("Try Again?", 15, 550);
}

function process() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let can_move_down = check_direction(
    current_down,
    { x: 0, y: 1 },
    current_down.shape,
  );

  if (can_move_down) {
    let cube_positions = current_down.shape.map((pos) =>
      v_add(pos, current_down.pos),
    );

    let y_changed = cube_positions.map((p) => p.y);

    if (y_changed.some((p) => p < 0)) {
      gameOver();
      return;
    }

    current_down.sprite_map.forEach(([sprite_offset, offset]) => {
      add_cube(
        v_add(current_down.pos, offset),
        images[current_down.t],
        sprite_offset,
        current_down.angle,
      );
    });

    let to_clear = [...new Set(y_changed)]
      .toSorted((a, b) => b - a)
      .filter(rowFull);

    to_clear.forEach(clearRow);
    to_clear.forEach(() => {
      grid.unshift(Array.from({ length: X_SIZE }).map(() => null));
      score += 100;
    });

    spawn_block();
  }

  // render the placed blocks
  grid.forEach((row, y) =>
    row.forEach((item, x) => {
      if (item !== null) {
        render_single({ x, y }, item);
      }
    }),
  );

  // render the falling block
  render_block(current_down);
  current_down.pos.y += 1;
}

canvas.addEventListener("click", () => {
  grid = Array.from({ length: Y_SIZE + 1 }, () =>
    Array.from({ length: X_SIZE }, () => null),
  );

  spawn_block();

  running = true;

  setInterval(process, 20);
});

function on_load() {
  ctx.font = "32px 'Press Start 2P'";

  ctx.fillText("Click", 90, 200);
  ctx.fillText("To", 140, 250);
  ctx.fillText("Start", 90, 300);
}

function go_left() {
  if (!check_direction(current_down, { x: -1, y: 0 }, current_down.shape)) {
    current_down.pos.x = Math.max(0, current_down.pos.x - 1);
  }
}

function go_right() {
  if (!check_direction(current_down, { x: 1, y: 0 }, current_down.shape)) {
    current_down.pos.x = Math.min(9, current_down.pos.x + 1);
  }
}

function rotate() {
  let next_rot = rotateObj(current_down.shape);

  let next_shape = next_rot.map((v) => v[1]);

  current_down.angle = (current_down.angle + 90) % 360;

  if (!check_direction(current_down, { x: 0, y: 0 }, next_shape)) {
    current_down.shape = next_shape;

    current_down.sprite_map.forEach(([image_position, stored_last_map], i) => {
      console.log(current_down.sprit_map, i, current_down.sprite_map[i]);
      next_rot.forEach(([from, to]) => {
        console.log(from);

        console.log(from, stored_last_map);
        if (v_eq(from, stored_last_map)) {
          current_down.sprite_map[i] = [image_position, to];
          console.log("updating_sprit");
        }
      });
    });
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key == "ArrowLeft") {
    go_left();
  } else if (event.key == "ArrowRight") {
    go_right();
  } else if (event.key == "ArrowUp") {
    rotate();
  }
});

function rotateObj(arr) {
  const rotate90deg = (v) => p(Math.floor(-v.y), Math.floor(v.x));
  const translateCoord = (o) => (v) => p(v.x - o.x, v.y - o.y);

  let width = 0,
    height = 0;
  for (const v of arr) {
    if (v.x > width) width = v.x;
    if (v.y > height) height = v.y;
  }
  const translateFn = translateCoord(p(width / 2, height / 2));

  return arr.map((val) => [val, rotate90deg(translateFn(val))]);
}

// TODO - implement method
function rotateCurrentBlock() {
  console.log("MUHAHHAH");
  throw new Error("Not implemented yet");
}

// UI Code
/*const UI = (function() {
  const uiCanvas = document.body.querySelector("#sidebarUI");
  const uiCtx = uiCanvas.getContext("2d");

  class UI_Elem {
    constructor(size, displayFn) {
      this.size = size;
      this.display = displayFn;
    }
  }

  class UI_Button extends UI_Elem {
    constructor(size, displayFn, onClickFn) {
      super(size, displayFn);
      this.onClick = onClickFn();
    }
  }

  class UI_Text extends UI_Elem {
    constructor(size, displayFn, font, text) {
      super(size, displayFn);
      this.font = font;
      this.text = text;
    }
    static defaultDisplay(obj) {
      const ret = () => {
        uiCtx.font = this.font;
        const bounds = UI_Grid.getPosBounds();
        uiCtx.fillText(this.text,);
      }
      ret.bind(obj);
      return ret;
    }
  }

  class Bounds {
    constructor(p1, p2) {
      this.p1 = p1;
      this.p2 = p2;
    }
  }

  class UI_Row {
    constructor(height, elems) {
      this.height = height;
      this.elems = elems;
    }
  }

  // Create UI grid
  const UI_Grid = {
    grid: [],
    rowSizes: {},
    rowCount: 0,
    totalRowWeight: 0,
    isRowEmpty: row => row >= UI_Grid.grid.length,
    createRow: (height) => {
      if(UI.isRowEmpty(row)) {
        UI_Grid.grid.push(new UI_Row(height, []));
        UI_Grid.rowSizes[row] = 0;
        UI_Grid.rowCount += 1;
        UI_Grid.totalRowWeight += height;
      }else throw new Error("Row already created");
      return {
        add: elem => UI_Grid.add(elem, row)
      };
    },
    add: (elem, row) => {
      function inner(x) {
        UI_Grid.grid[row].push(x);
        UI_Grid.rowSizes[row] += 1;
      }
      if(UI_Grid.isRowEmpty(row)) {
        throw new Error("Cannot add elements to a non-existent row");
      }else inner(elem);
      return {
        then: inner,
        thenOnRow: UI_Grid.add,
        createRow: UI_Grid.createRow
      }
    },
    getPosBounds: (row, col) => {
      if(UI_Grid.isRowEmpty(row)) throw new Error("Cannot get position bounds of non-existent row");
    },
    display: () => {
      Object.keys(UI_Grid.grid).forEach(k => {
        for(const elem of UI_Grid[k]) elem.display();
      });
    }
  };

  // Create game UI

  // Initialise score counter to 0
  const scoreText = new UI_Text(1, UI_Text.defaultDisplay, "Score");
  const scoreTextDynamic = new UI_Text(1, UI_Text.defaultDisplay, "0");
  // Button for rotating the block (to make it clear that it can be rotated)
  const rotateButton = new UI_Button(1, () => {}, rotateCurrentBlock);

  // Add UI
  UI_Grid
    .createRow(1)
    .add(scoreText)
    .then(scoreTextDynamic)
    .createRow(6)
    .add(new UI_Elem(1, () => {}))
    .createRow(1)
    .then(rotateButton);

  return {
    display: () => {
      // Display the entire grid
      UI_Grid.display()
    },
    updateScore: () => {}
  };
})();
UI.display();
*/

const ScoreCounterHandler = (function () {
  const scoreCounterCanvas = document.body.querySelector("#scoreCounter");
  const scoreCounterCtx = scoreCounterCanvas.getContext("2d");
  const scoreTypefont = document.body.querySelector("#pixelated_typefont");

  const hsCounterCanvas = document.body.querySelector("#highScoreCounter");
  const hsCounterCtx = hsCounterCanvas.getContext("2d");

  const scoreBackgrounds = document.body.querySelector(
    "#score_background_spritesheet",
  );

  function drawScore(altCtx, maxLength, bgCeof, score) {
    let scoreStr = score.toString();
    if (scoreStr.length > maxLength) scoreStr = "9".repeat(maxLength);
    else if (scoreStr.length < maxLength)
      scoreStr = "0".repeat(maxLength - scoreStr.length) + scoreStr;
    for (let i = 0; i < maxLength; i++) {
      // BEHOLD - MAGIC NUMBERS!
      altCtx.drawImage(
        scoreBackgrounds,
        16 * bgCeof,
        0,
        16,
        16,
        16 * i,
        0,
        16,
        16,
      );
      altCtx.drawImage(
        scoreTypefont,
        16 * Number(scoreStr[i]),
        0,
        16,
        16,
        16 * i,
        0,
        16,
        16,
      );
    }
  }

  return {
    setScoreCounter: (score) => {
      drawScore(scoreCounterCtx, 8, 0, score);
    },
    setHighScoreCounter: (score) => {
      drawScore(hsCounterCtx, 8, 1, score);
    },
  };
})();

// Set the score counter and high score counter to initially 0
ScoreCounterHandler.setScoreCounter(0);
ScoreCounterHandler.setHighScoreCounter(0);

const AudioHandler = (function() {
  const sounds = {};
  
  function registerSoundInner(alias, filename) {
    // Always get sounds from the sounds folder
    filename = "assets/Sounds/" + filename
    if(alias in sounds) throw new Error(`{alias} is already a registered sound`);
    sounds[alias] = new Audio(filename);
    return {
      then: registerSoundInner
    }
  }

  function playSoundOnceInner(alias, volume=1.0) {
    if(!(alias in sounds)) throw new Error(`{alias} is not a registered sound`);
    sounds[alias].volume = volume;
    sounds[alias].play();
    return {
      thenOnce: playSoundOnceInner,
      thenLoop: playSoundLoopInner
    }
  }

  function playSoundLoopInner(alias, volume=1.0) {
    if(!(alias in sounds)) throw new Error(`{alias} is not a registered sound`);
    const sfx = sounds[alias];
    sfx.volume = volume;
    sfx.loop = true;
    sfx.play();
    return {
      thenOnce: playSoundOnceInner,
      thenLoop: playSoundLoopInner,
      stop: () => {
        sfx.loop = false;
        sfx.pause();
        sfx.currentTime = 0;
      }
    };
  }

  return {
    registerSound: registerSoundInner,
    playSoundOnce: playSoundOnceInner,
    playSoundLoop: playSoundLoopInner
  };
})();

// Register sounds vvv
AudioHandler
  .registerSound("game_over", "SFX/Game Over/game-over-sound.mp3")
  .then("lines_cleared_small", "SFX/Lines Cleared/lines-cleared-small.mp3")
  .then("lines_cleared_big", "SFX/Lines Cleared/lines-cleared-big.mp3")
  .then("block_placed", "SFX/Placing/placing-pop.mp3")
  .then("block_rotated_pop", "SFX/Rotating/rotating-pop.mp3")
  .then("block_rotated_swoosh", "SFX/Rotating/rotating-swoosh.mp3")
  .then("bg_music_1", "Background Music/bg-music-1.mp3")
  .then("bg_music_2", "Background Music/bg-music-2.mp3");