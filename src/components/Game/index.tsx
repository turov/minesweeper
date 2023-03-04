import React from "react";
import styles from "./Game.module.scss";

const fieldSize: number = 16;
const mineSymbol: number = -1;
const mineAmount: number = 40;
const availableTime: number = 999;
const dimension = new Array(fieldSize).fill(null);
const getCellIndex = function (x: number, y: number): number {
  return y * fieldSize + x;
};

const mineIndices: number[] = [];
const createField = function (
  fieldSize: number,
  firstTurnCell: number
): number[] {
  mineIndices.length = 0;
  const field: number[] = new Array(Math.pow(fieldSize, 2)).fill(0);

  const inc = function (x: number, y: number) {
    if (x >= 0 && x < fieldSize && y >= 0 && y < fieldSize) {
      if (field[getCellIndex(x, y)] === mineSymbol) return;
      field[getCellIndex(x, y)] += 1;
    }
  };

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

    inc(x + 1, y);
    inc(x - 1, y);
    inc(x, y + 1);
    inc(x, y - 1);
    inc(x + 1, y - 1);
    inc(x - 1, y - 1);
    inc(x + 1, y + 1);
    inc(x - 1, y + 1);
  }

  return field;
};

const padNum = function (num: number): string {
  if (num >= 1) {
    return num.toString().padStart(3, "0");
  }
  return "000";
};

enum Mask {
  Transparent,
  Filled,
  Flag,
  Question,
}

const maskToView: Record<Mask, React.ReactNode> = {
  [Mask.Transparent]: null,
  [Mask.Filled]: "",
  [Mask.Flag]: "🏳️",
  [Mask.Question]: "❔",
};

const getFalseMines = function (a: number[], b: number[]): number[] {
  const result: number[] = [];
  a.forEach(function (element) {
    if (!~b.indexOf(element)) result.push(element);
  });
  return result;
};

const Game = () => {
  const [field, setField] = React.useState<number[]>();
  const [mask, setMask] = React.useState<Mask[]>(() => {
    return new Array(fieldSize * fieldSize).fill(Mask.Filled);
  });
  const [smile, setSmile] = React.useState<string>("🙂");
  const [firstTurn, setFirstTurn] = React.useState<boolean>(true);
  const [gameOver, setGameOver] = React.useState<boolean>(false);
  const [win, setWin] = React.useState<boolean>(false);
  const [deadlyMine, setDeadlyMine] = React.useState<number>();
  const [seconds, setSeconds] = React.useState<number>();
  const [mineCounter, setMineCounter] = React.useState<number>(mineAmount);
  const [falseMines, setFalseMines] = React.useState<number[]>();

  const winChecker = React.useMemo(() => {
    if (field) {
      let arr: boolean[] = [];
      mask.filter((m, i) => {
        if (mask[i] === 1 || mask[i] === 2) {
          arr.push(!!mineIndices.find((elem) => elem === i));
        }
      });
      if (arr.every((item: boolean) => item === true)) {
        setWin(true);
        setSmile("😎");
      }
    }
  }, [field, mask]);
  React.useEffect(() => {
    if (seconds && seconds < availableTime && !win && !gameOver) {
      const interval = setInterval(() => setSeconds(seconds + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [seconds]);

  const resetGame = function () {
    setFirstTurn(true);
    setGameOver(false);
    setWin(false);
    setDeadlyMine(undefined);
    setSmile("🙂");
    setMask(() => {
      return new Array(fieldSize * fieldSize).fill(Mask.Filled);
    });
    setField(undefined);
    setSeconds(0);
    setMineCounter(mineAmount);
    setFalseMines([]);
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
                    disabled={gameOver || win}
                    onMouseDown={() => {
                      if (mask[getCellIndex(x, y)] === Mask.Transparent) return;
                      setSmile("😮");
                    }}
                    onMouseUp={() => {
                      if (mask[getCellIndex(x, y)] === Mask.Transparent) return;
                      setSmile("🙂");
                    }}
                    onClick={(event) => {
                      if (mask[getCellIndex(x, y)] === Mask.Transparent) return;
                      let currentField = field;
                      if (firstTurn) {
                        setFirstTurn(false);
                        const firstTurnCell = getCellIndex(x, y);
                        currentField = createField(fieldSize, firstTurnCell);
                        setField(currentField);
                        setSeconds(() => 1);
                      }
                      if (currentField) {
                        const newMask = [...mask];
                        const clearing: [number, number][] = [];

                        // @ts-ignore
                        function open(x: number, y: number) {
                          if (
                            x >= 0 &&
                            x < fieldSize &&
                            y >= 0 &&
                            y < fieldSize
                          ) {
                            if (
                              newMask[getCellIndex(x, y)] === Mask.Transparent
                            )
                              return;
                            clearing.push([x, y]);
                          }
                        }

                        open(x, y);

                        while (clearing.length) {
                          const [x, y] = clearing.pop()!;
                          console.log(x);
                          console.log(y);
                          newMask[getCellIndex(x, y)] = Mask.Transparent;

                          if (currentField[getCellIndex(x, y)] !== 0) continue;
                          open(x + 1, y);
                          open(x - 1, y);
                          open(x, y + 1);
                          open(x, y - 1);
                        }

                        if (currentField[getCellIndex(x, y)] === mineSymbol) {
                          setGameOver(true);
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
                              newMask[idx] = Mask.Transparent;
                            }
                          });
                        }
                        setMask(newMask);
                      }
                    }}
                    data-value={`${(() => {
                      if (!field) return;
                      if (mask[getCellIndex(x, y)] !== Mask.Transparent) {
                        if (falseMines && gameOver) {
                          if (
                            falseMines.find(
                              (cell) => cell === getCellIndex(x, y)
                            )
                          ) {
                            return "🤥";
                          }
                        } else return maskToView[mask[getCellIndex(x, y)]];
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
                    onContextMenu={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (win || gameOver || firstTurn) return;
                      setSmile("🙂");
                      const newMask = [...mask];
                      if (newMask[getCellIndex(x, y)] === Mask.Transparent)
                        return;
                      if (
                        newMask[getCellIndex(x, y)] === Mask.Filled &&
                        mineCounter > 0
                      ) {
                        newMask[getCellIndex(x, y)] = Mask.Flag;
                      } else if (newMask[getCellIndex(x, y)] === Mask.Flag) {
                        newMask[getCellIndex(x, y)] = Mask.Question;
                      } else if (
                        newMask[getCellIndex(x, y)] === Mask.Question
                      ) {
                        newMask[getCellIndex(x, y)] = Mask.Filled;
                      }
                      setMineCounter(
                        mineAmount - newMask.filter((code) => code === 2).length
                      );
                      setMask(newMask);
                    }}
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
