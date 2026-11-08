import { useState, useEffect } from 'react';
import Cube3D from './components/Cube3D';
import Scanner from './components/Scanner';
import { solveCube, initSolver, generateRandomScramble, getStepStates } from './services/solver';
import { validateCubeString } from './services/validator';

const SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

export default function App() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentScramble, setCurrentScramble] = useState<string[]>([]);
  const [moves, setMoves] = useState<string[]>([]);
  const [stepStates, setStepStates] = useState<string[]>([SOLVED_STATE]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [status, setStatus] = useState<string>('Initializing solver...');
  const [resetViewCount, setResetViewCount] = useState<number>(0);

  useEffect(() => {
    try {
      initSolver();
      setStatus('Ready to solve');
    } catch (e) {
      setStatus('Failed to load solver');
    }
  }, []);

  const handleScrambleAndSolve = () => {
    setStatus('Generating random scramble...');
    try {
      const { scrambleMoves, cubeString } = generateRandomScramble();
      setCurrentScramble(scrambleMoves);

      const validation = validateCubeString(cubeString);
      if (!validation.isValid) {
        setStatus(`Invalid state: ${validation.error}`);
        return;
      }

      setStatus('Finding optimal solution...');
      const solution = solveCube(cubeString);
      const allStates = getStepStates(cubeString, solution);

      setMoves(solution);
      setStepStates(allStates);
      setActiveStep(0);
      setStatus(`Solved in ${solution.length} moves! (Under 22 limit)`);
    } catch (err) {
      setStatus(`Solver error: ${String(err)}`);
    }
  };

  const processCubeState = (cubeString: string) => {
    setStatus('Validating cube state...');
    const validation = validateCubeString(cubeString);

    if (!validation.isValid) {
      setStatus(`Scan error: ${validation.error}`);
      alert(`Invalid Scan: ${validation.error}. Please try re-scanning under even lighting.`);
      return;
    }

    try {
      setStatus('Calculating optimal solution...');
      const solution = solveCube(cubeString);
      const allStates = getStepStates(cubeString, solution);

      setMoves(solution);
      setStepStates(allStates);
      setActiveStep(0);
      setIsScanning(false);
      setStatus(`Solved in ${solution.length} moves!`);
    } catch (err) {
      setStatus(`Solver error: ${String(err)}`);
    }
  };

  const currentDisplayState = stepStates[activeStep] || SOLVED_STATE;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-black text-emerald-400">CubeMaster</h1>
        <p className="text-slate-400 text-sm">3D Rubik's Cube Solver & Visualizer</p>
      </header>

      <main className="w-full max-w-md flex flex-col gap-4">
        {isScanning ? (
          <Scanner
            onScanComplete={(stateString) => processCubeState(stateString)}
            onCancel={() => setIsScanning(false)}
          />
        ) : (
          <>
            {/* 3D Visualizer Canvas with Reset View Overlay */}
            <div className="relative">
              <Cube3D cubeState={currentDisplayState} resetTrigger={resetViewCount} />
              <button
                onClick={() => setResetViewCount((prev) => prev + 1)}
                className="absolute top-3 right-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-sm transition cursor-pointer shadow"
                title="Reset camera to default view"
              >
                🎥 Reset View
              </button>
            </div>

            {/* Controls Card */}
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handleScrambleAndSolve}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-3 rounded-xl transition shadow cursor-pointer text-sm"
                >
                  🎲 Scramble & Solve
                </button>
                <button
                  onClick={() => setIsScanning(true)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-3 rounded-xl transition shadow cursor-pointer text-sm"
                >
                  📷 Scan Camera
                </button>
              </div>

              <p className="text-xs text-center text-slate-400">{status}</p>

              {/* Scramble Algorithm Display */}
              {currentScramble.length > 0 && (
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-700/60">
                  <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                    Applied Scramble ({currentScramble.length} moves):
                  </span>
                  <div className="text-xs font-mono text-slate-300 leading-relaxed break-words">
                    {currentScramble.join(' ')}
                  </div>
                </div>
              )}

              {/* Solution Moves Follow-Along */}
              {moves.length > 0 && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 font-medium">
                      {activeStep === 0
                        ? "Initial Scramble State"
                        : `Step ${activeStep} of ${moves.length}`}
                    </span>
                    <span className="text-xl font-mono font-bold text-emerald-400">
                      {activeStep === 0 ? "START" : moves[activeStep - 1]}
                    </span>
                  </div>

                  {/* Step Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                      disabled={activeStep === 0}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setActiveStep((prev) => Math.min(moves.length, prev + 1))}
                      disabled={activeStep === moves.length}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 py-2 rounded-lg text-sm font-semibold text-slate-950 transition cursor-pointer"
                    >
                      {activeStep === moves.length ? "Solved!" : "Next Move"}
                    </button>
                  </div>

                  {/* Move Badges */}
                  <div className="flex flex-wrap gap-1.5 justify-center mt-2 p-2 bg-slate-950 rounded-lg max-h-28 overflow-y-auto">
                    {moves.map((move, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded font-mono text-xs ${
                          idx === activeStep - 1
                            ? 'bg-emerald-500 text-slate-950 font-bold scale-105'
                            : idx < activeStep - 1
                            ? 'bg-slate-800 text-slate-500 line-through'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {move}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}