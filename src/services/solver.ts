// @ts-ignore
import Cube from 'cubejs';

let isInitialized = false;

export function initSolver(): void {
  if (!isInitialized) {
    try {
      Cube.initSolver();
      isInitialized = true;
      console.log("Kociemba solver tables successfully initialized.");
    } catch (err) {
      console.error("Failed to initialize Cube solver:", err);
    }
  }
}

export function solveCube(cubeString: string): string[] {
  initSolver();

  try {
    const cube = Cube.fromString(cubeString);
    const solution: string = cube.solve();

    if (!solution || typeof solution !== 'string') {
      throw new Error("No solution returned by solver.");
    }

    return solution.trim().split(/\s+/).filter(Boolean);
  } catch (error) {
    console.error("Cube solving error:", error);
    throw error;
  }
}

export function generateRandomScramble(): { scrambleMoves: string[]; cubeString: string } {
  initSolver();

  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  const scrambleMoves: string[] = [];

  let lastFace = '';
  while (scrambleMoves.length < 20) {
    const randomFace = faces[Math.floor(Math.random() * faces.length)];
    if (randomFace !== lastFace) {
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scrambleMoves.push(`${randomFace}${modifier}`);
      lastFace = randomFace;
    }
  }

  const cube = new Cube();
  cube.move(scrambleMoves.join(' '));

  return {
    scrambleMoves,
    cubeString: cube.asString()
  };
}

// Generates an array of 54-letter cube strings for each step (initial state + after each move)
export function getStepStates(initialString: string, moves: string[]): string[] {
  initSolver();
  const states: string[] = [initialString];
  const cube = Cube.fromString(initialString);

  for (const move of moves) {
    cube.move(move);
    states.push(cube.asString());
  }

  return states;
}