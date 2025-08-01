import React from 'react';

/**
 * GameOverModal is shown when the player has used up all lives.  It
 * displays the final score and high score, and allows the user to
 * restart the game.  Styling matches the StartModal for visual
 * consistency.
 *
 * Props:
 *   score (number)      – the player's final score
 *   highScore (number)  – the stored high score
 *   onRestart (function) – callback invoked to start a new game
 */
export default function GameOverModal({ score, highScore, onRestart }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-title">Game Over</div>
        <div className="modal-description">
          Your final score: <strong>{score}</strong>
          <br />
          High score: <strong>{highScore}</strong>
        </div>
        <button className="ui-button" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}