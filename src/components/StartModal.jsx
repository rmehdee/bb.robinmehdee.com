import React from 'react';

/**
 * StartModal displays instructions and a button to begin playing.  It
 * overlays the entire game area and uses simple classes defined in
 * index.css to approximate the look of a shadcn dialog.
 *
 * Props:
 *   onStart (function) – callback invoked when the user clicks the start button
 */
export default function StartModal({ onStart }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-title">Basketball Challenge</div>
        <div className="modal-description">
          Drag the basketball back to set your angle and power.  Release to shoot
          and try to sink as many baskets as you can!  You have five lives –
          missing a shot will cost you one.  Beat your high score and see how
          long you can last.
        </div>
        <button className="ui-button" onClick={onStart}>Start Game</button>
      </div>
    </div>
  );
}