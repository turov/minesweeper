import React from "react";
import styles from "./Game.module.scss";

const fieldSize: number = 16;
const mineSymbol: number = -1;
const mineAmount: number = 40;
const availableTime: number = 999;
const dimension = new Array(fieldSize).fill(null);
const mineIndices: number[] = [];
const getCellIndex = function (x: number, y: number): number {
  return y * fieldSize + x;
};

const padNum = function (num: number): string {
  if (num >= 1) {
    return num.toString().padStart(3, "0");
  }
  return "000";
};
const inc = function (x: number, y: number, field: number[]) {
  if (x >= 0 && x < fieldSize && y >= 0 && y < fieldSize) {
    if (field[getCellIndex(x, y)] !== mineSymbol) {
      return (field[getCellIndex(x, y)] += 1);
    }
  }
};
const createField = function (
  fieldSize: number,
  firstTurnCell: number
): number[] {
  mineIndices.length = 0;
  const field: number[] = new Array(Math.pow(fieldSize, 2)).fill(0);

  for (let i: number = 0; i < mineAmount; ) {
    const x = Math.floor(Math.random() * fieldSize);
    const y = Math.floor(Math.random() * fieldSize);
    if (
      getCellIndex(x, y) === firstTurnCell ||
      field[getCellIndex(x, y)] === mineSymbol
    )
      continue;

    field[getCellIndex(x, y)] = mineSymbol;
    mineIndices.push(getCellIndex(x, y));
    i += 1;

    inc(x + 1, y, field);
    inc(x - 1, y, field);
    inc(x, y + 1, field);
    inc(x, y - 1, field);
    inc(x + 1, y - 1, field);
    inc(x - 1, y - 1, field);
    inc(x + 1, y + 1, field);
    inc(x - 1, y + 1, field);
  }

  return field;
};
const open = function (
  x: number,
  y: number,
  newMask: Mask[],
  clearing: [number, number][]
) {
  if (x >= 0 && x < fieldSize && y >= 0 && y < fieldSize) {
    if (newMask[getCellIndex(x, y)] === Mask.Opened) return;
    clearing.push([x, y]);
  }
};

const getFalseMines = function (a: number[], b: number[]): number[] {
  const result: number[] = [];
  a.forEach(function (element) {
    if (!~b.indexOf(element)) result.push(element);
  });
  return result;
};

enum Mask {
  Opened,
  Closed,
  Flag,
  Question,
}

const maskToData: Record<Mask, React.ReactNode> = {
  [Mask.Opened]: null,
  [Mask.Closed]: "",
  [Mask.Flag]: "🏳️",
  [Mask.Question]: "❔",
};

const Game = () => {
  const [field, setField] = React.useState<number[]>();
  const [mask, setMask] = React.useState<Mask[]>(() => {
    return new Array(Math.pow(fieldSize, 2)).fill(Mask.Closed);
  });
  const [smile, setSmile] = React.useState<string>("🙂");
  const [deadlyMine, setDeadlyMine] = React.useState<number>();
  const [seconds, setSeconds] = React.useState<number>();
  const [mineCounter, setMineCounter] = React.useState<number>(mineAmount);
  const [falseMines, setFalseMines] = React.useState<number[]>();

  const firstTurn = React.useRef<boolean>(true);
  const gameOver = React.useRef<boolean>(false);
  const win = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (field) {
      const arr: boolean[] = [];
      mask.forEach((m, i) => {
        if (mask[i] > 0) {
          arr.push(!!mineIndices.find((elem) => elem === i));
        }
      });
      console.log(arr);
      if (arr.every((item: boolean) => item)) {
        win.current = true;
        setSmile("😎");
      }
    }
  }, [field, mask]);

  React.useEffect(() => {
    if (
      seconds &&
      seconds < availableTime &&
      !win.current &&
      !gameOver.current
    ) {
      const interval = setInterval(() => setSeconds(seconds + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [seconds]);

  const resetGame = function () {
    firstTurn.current = true;
    gameOver.current = false;
    win.current = false;
    setDeadlyMine(undefined);
    setSmile("🙂");
    setMask(() => {
      return new Array(fieldSize * fieldSize).fill(Mask.Closed);
    });
    setField(undefined);
    setSeconds(0);
    setMineCounter(mineAmount);
    setFalseMines([]);
  };

  const onCellClick = function (x: number, y: number) {
    if (mask[getCellIndex(x, y)] === Mask.Opened) return;
    let currentField = field;
    if (firstTurn.current) {
      firstTurn.current = false;
      const firstTurnCell = getCellIndex(x, y);
      currentField = createField(fieldSize, firstTurnCell);
      setField(currentField);
      setSeconds(() => 1);
    }
    if (currentField) {
      const newMask = [...mask];
      const clearing: [number, number][] = [];

      open(x, y, newMask, clearing);

      while (clearing.length) {
        const [x, y] = clearing.pop()!;
        newMask[getCellIndex(x, y)] = Mask.Opened;

        if (currentField[getCellIndex(x, y)] !== 0) continue;
        open(x + 1, y, newMask, clearing);
        open(x - 1, y, newMask, clearing);
        open(x, y + 1, newMask, clearing);
        open(x, y - 1, newMask, clearing);
      }

      if (currentField[getCellIndex(x, y)] === mineSymbol) {
        gameOver.current = true;
        setSmile("☠️");
        setDeadlyMine(getCellIndex(x, y));
        const flags: number[] = [];
        newMask.forEach(function (x, index) {
          if (x === 2) {
            flags.push(index);
          }
        });
        setFalseMines(getFalseMines(flags, mineIndices));
        currentField.forEach((cell, idx) => {
          if (cell === -1) {
            newMask[idx] = Mask.Opened;
          }
        });
      }
      setMask(newMask);
    }
  };

  const onContextMenuClick = function (
    e: React.MouseEvent<HTMLElement>,
    x: number,
    y: number
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (win.current || gameOver.current || firstTurn.current) return;
    setSmile("🙂");
    const newMask = [...mask];
    if (newMask[getCellIndex(x, y)] === Mask.Opened) return;
    if (newMask[getCellIndex(x, y)] === Mask.Closed && mineCounter > 0) {
      newMask[getCellIndex(x, y)] = Mask.Flag;
    } else if (newMask[getCellIndex(x, y)] === Mask.Flag) {
      newMask[getCellIndex(x, y)] = Mask.Question;
    } else if (newMask[getCellIndex(x, y)] === Mask.Question) {
      newMask[getCellIndex(x, y)] = Mask.Closed;
    }
    setMineCounter(mineAmount - newMask.filter((code) => code === 2).length);
    setMask(newMask);
  };

  return (
    <div className={`${styles["🍟"]} ${styles["🫴"]}`}>
      <header className={`${styles["🥸"]} ${styles["🫳"]}`}>
        <output className={`${styles["🧮"]}`}>{padNum(mineCounter)}</output>
        <button
          type="button"
          className={styles["🙂"]}
          data-smile={`${smile}`}
          onClick={resetGame}
        ></button>
        <output className={`${styles["🧮"]}`}>{padNum(seconds || 0)}</output>
      </header>
      <div className={`${styles["🌾"]} ${styles["🫳"]}`}>
        {dimension.map((row, y) => {
          return (
            <div className={styles["🚣‍"]} key={y}>
              {dimension.map((cell, x) => {
                return (
                  <button
                    key={x}
                    className={`${styles["📦"]} `}
                    disabled={gameOver.current || win.current}
                    onMouseDown={() => {
                      if (mask[getCellIndex(x, y)] === Mask.Opened) return;
                      setSmile("😮");
                    }}
                    onMouseUp={() => {
                      if (mask[getCellIndex(x, y)] === Mask.Opened) return;
                      setSmile("🙂");
                    }}
                    onClick={() => onCellClick(x, y)}
                    data-value={`${(() => {
                      if (!field) return;
                      if (mask[getCellIndex(x, y)] !== Mask.Opened) {
                        if (falseMines && gameOver.current) {
                          if (
                            falseMines.find(
                              (cell) => cell === getCellIndex(x, y)
                            )
                          ) {
                            return "🤥";
                          }
                        } else return maskToData[mask[getCellIndex(x, y)]];
                      } else {
                        if (deadlyMine === getCellIndex(x, y)) {
                          return "🟥";
                        } else if (field[getCellIndex(x, y)] === mineSymbol) {
                          return "-1";
                        } else {
                          return field[getCellIndex(x, y)];
                        }
                      }
                    })()}`}
                    onContextMenu={(event) => onContextMenuClick(event, x, y)}
                  ></button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Game;
