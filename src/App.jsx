import React, { useState, useRef } from 'react';
import Game from './components/Game';
import StartModal from './components/StartModal';
import GameOverModal from './components/GameOverModal';

/**
 * The top level component orchestrates the game.  It maintains high level
 * state such as whether the game has started, the current score, the
 * highest score (persisted in localStorage), remaining lives and whether
 * the game has ended.  Depending on the state it renders the appropriate
 * modal or the game itself.  All callbacks for scoring and misses
 * propagate up from the Game component to update the state here.
 */
export default function App() {
  // True when the user has pressed "Start" and is currently playing.
  const [gameStarted, setGameStarted] = useState(false);
  // Current score for the ongoing session.
  const [score, setScore] = useState(0);
  // Read the persisted high score from localStorage.  Fall back to 0 if
  // nothing is stored yet.  We wrap this in a lazy initialiser so it's only
  // read once on mount.
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('basketball-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  // Remaining lives (misses).  The player is allowed five misses before
  // the game ends.
  const [lives, setLives] = useState(5);
  // When true the game is over and we show the game over modal.
  const [gameOver, setGameOver] = useState(false);
  // Shared AudioContext for all sound effects.  This is created once
  // when the user starts the game to comply with browser autoplay policies.
  const audioCtxRef = useRef(null);

  /**
   * Begin a new game session.  Reset scores and lives.  We also clear
   * any game over state so the Game component can mount.
   */
  const handleStart = () => {
    // Create a new AudioContext on the first user interaction.  This is
    // necessary for browsers that block audio until a user gesture.
    if (!audioCtxRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      } catch (err) {
        console.warn('AudioContext not supported:', err);
      }
    }
    setScore(0);
    setLives(5);
    setGameStarted(true);
    setGameOver(false);
  };

  /**
   * Simple tone generator using the Web Audio API.  It creates a short
   * sine wave burst at the given frequency and duration.  Because
   * AudioContext cannot be reused after being closed, each call
   * constructs its own context.  This helper is used to implement
   * the various sound effects (score, miss and game over).
   *
   * @param {number} frequency The frequency of the tone in Hertz.
   * @param {number} duration The duration of the tone in milliseconds.
   */
  function playTone(frequency, duration) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    // Start the oscillator immediately
    oscillator.start();
    // Fade the gain out exponentially
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration / 1000
    );
    // Stop after the duration
    oscillator.stop(ctx.currentTime + duration / 1000);
  }

  /**
   * Sound effect for a missed shot.  A short low-frequency blip.
   */
  function playMissSound() {
    playTone(200, 220);
  }

  /**
   * Sound effect for a scored shot.  A brighter mid-frequency tone.
   */
  function playScoreSound() {
    playTone(550, 260);
  }

  /**
   * Sound effect for game over.  A descending three-note sequence
   * indicating the end of the session.  Each call schedules the
   * individual tones slightly apart.
   */
  function playGameOverSound() {
    // Sequence of frequencies and durations
    const sequence = [
      { freq: 440, dur: 200 },
      { freq: 330, dur: 200 },
      { freq: 220, dur: 400 },
    ];
    let delay = 0;
    for (const note of sequence) {
      setTimeout(() => playTone(note.freq, note.dur), delay);
      delay += note.dur + 50;
    }
  }

  /**
   * Called whenever the player successfully scores a basket.  Increments
   * the score and updates the high score if necessary.  We persist the
   * high score in localStorage so it survives page reloads.
   */
  const handleScore = () => {
    // Play a cheerful tone to indicate a successful shot.
    playScoreSound();
    setScore(prev => {
    const newScore = prev + 1;
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('basketball-highscore', String(newScore));
      }
      return newScore;
    });
  };

  /**
   * Called when the player misses a shot.  Decreases the life counter
   * and, if no lives remain, ends the game.  The Game component
   * automatically resets the ball after invoking this callback.
   */
  const handleMiss = () => {
    // Play a low tone to signal a missed shot
    playMissSound();
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        // Play a distinctive sound for game over
        playGameOverSound();
        setGameOver(true);
        setGameStarted(false);
      }
      return newLives;
    });
  };

  /**
   * Restart the game from the game over screen.  This resets the
   * current score and restores the life counter.  High score remains
   * unchanged since it is stored separately.
   */
  const handleRestart = () => {
    setScore(0);
    setLives(5);
    setGameStarted(true);
    setGameOver(false);
  };

  return (
    <div className="app-container">
      {/* Show the start modal when the game hasn't started and isn't over */}
      {!gameStarted && !gameOver && <StartModal onStart={handleStart} />}

      {/* Scoreboard and instruction bar displayed above the game area */}
      {gameStarted && !gameOver && (
        <div className="score-row">
          <div>
            <span className="label">Score:</span> {score}
          </div>
          <div>
            <span className="label">High:</span> {highScore}
          </div>
          <div className="lives">
            {Array.from({ length: lives }).map((_, idx) => (
              <span key={idx} className="life" />
            ))}
          </div>
          <div className="instruction-text">Drag up and release to shoot</div>
        </div>
      )}

      {/* Game area with border.  It occupies a portion of the vertical space and
          contains the canvas. */}
      {gameStarted && (
        <div className="game-area">
          <Game
            onScore={handleScore}
            onMiss={handleMiss}
          />
        </div>
      )}

      {/* When the game ends, show the game over modal */}
      {gameOver && (
        <GameOverModal
          score={score}
          highScore={highScore}
          onRestart={handleRestart}
        />
      )}
      <div className="version-text">V1.0</div>
    </div>
  );
}