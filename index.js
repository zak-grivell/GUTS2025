/** @type {HTMLCanvasElement} */
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

function rand_array(items) {
  return "O";
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

function v_add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
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

function render_block(block) {
  block.shape.forEach((offset) => {
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
  block.sprite.setAttribute("style", "transform: rotate(" + 90 + "deg)");
  ctx.drawImage(
    block.sprite,
    pos.x * grid_size,
    pos.y * grid_size,
    grid_size,
    grid_size,
  );
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

function add_cube(position) {
  gs(position, {
    sprite: images.notgiven,
  });
}

function spawn_block() {
  let next_shape = rand_array(block_types);

  current_down = {
    t: next_shape,
    pos: { x: X_SIZE / 2, y: -4 },
    shape: block_shapes[next_shape][0],
  };
}

let score = 0;

function gameOver() {
  ctx.font = "32px 'Press Start 2P'";

  ctx.fillText("Click", 90, 200);
  ctx.fillText("To", 140, 250);
  ctx.fillText("Retry", 90, 300);
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

    cube_positions.forEach(add_cube);

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

  setInterval(process, 200);
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

  if (!check_direction(current_down, { x: 0, y: 0 }, next_rot)) {
    current_down.shape = next_rot;
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
  const iLimit = arr.length;
  const ret = new Array(iLimit);
  for (let i = 0; i < iLimit; i++) ret[i] = rotate90deg(translateFn(arr[i]));
  return ret;
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

const ScoreCounterHandler = (function() {
  const scoreCounterCanvas = document.body.querySelector("#scoreCounter");
  const scoreCounterCtx = scoreCounterCanvas.getContext("2d");
  const scoreTypefont = document.body.querySelector("#pixelated_typefont");

  const hsCounterCanvas = document.body.querySelector("#highScoreCounter");
  const hsCounterCtx = hsCounterCanvas.getContext("2d");

  const scoreBackgrounds = document.body.querySelector("#score_background_spritesheet");

  function drawScore(altCtx, maxLength, bgCeof, score) {
    let scoreStr = score.toString();
    if(scoreStr.length > maxLength) scoreStr = '9'.repeat(maxLength);
    else if(scoreStr.length < maxLength) scoreStr = '0'.repeat(maxLength - scoreStr.length) + scoreStr;
    for(let i = 0; i < maxLength; i++) {
      // BEHOLD - MAGIC NUMBERS!
      altCtx.drawImage(scoreBackgrounds, 16*bgCeof, 0, 16, 16, 16*i, 0, 16, 16);
      altCtx.drawImage(scoreTypefont, 16*Number(scoreStr[i]), 0, 16, 16, 16*i, 0, 16, 16);
    }
  }

  return {
    setScoreCounter: score => {
      drawScore(scoreCounterCtx, 8, 0, score)
    },
    setHighScoreCounter: score => {
      drawScore(hsCounterCtx, 8, 1, score)
    }
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