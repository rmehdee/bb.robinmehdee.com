import React, { useRef, useEffect } from 'react';

/**
 * Game component renders a full screen canvas and overlays the scoreboard.
 * All drawing and physics are handled imperative style via the Canvas API
 * inside a requestAnimationFrame loop.  Player input is managed with
 * pointer events so both mouse and touch devices are supported.  The
 * component receives scoring and miss callbacks from its parent to update
 * game state outside of the canvas.
 *
 * Props:
 *   score (number)      – current score to display
 *   highScore (number)  – high score to display
 *   lives (number)      – number of remaining misses
 *   onScore (function)  – called when the player scores a basket
 *   onMiss (function)   – called when the player misses a shot
 */
export default function Game({ onScore, onMiss }) {

  // Reference to the canvas element
  const canvasRef = useRef(null);
  // Reference to store per‑shot callbacks so we always call the latest
  const callbacksRef = useRef({ onScore, onMiss });

  // Update the callbacks whenever the props change.  Without this we would
  // capture stale closures in our animation loop.
  useEffect(() => {
    callbacksRef.current.onScore = onScore;
    callbacksRef.current.onMiss = onMiss;
  }, [onScore, onMiss]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Game state object stored in a ref so its properties persist
    // across renders without triggering re‑renders.
    const state = {
      width: 0,
      height: 0,
      borderThickness: 2,
      // Ball parameters.  The radius has been increased slightly to
      // make the basketball feel more substantial on the play field
      // and easier to drag on touch devices.
      ball: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 26,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragCurrentX: 0,
        dragCurrentY: 0,
        isLaunched: false,
        canScore: false,
        scored: false,
      },
      // Hoop parameters.  Increase the radius and line thickness so the
      // rim looks more realistic relative to the larger ball.  The
      // backboardWidth is unchanged for visual balance.
      hoop: {
        x: 0,
        y: 0,
        radius: 34,
        backboardWidth: 8,
        // thickness (for visual draw only)
        thickness: 6,
      },
      gravity: 0.35,
      bounce: 0.7,
      // internal flag to avoid multiple calls on a single shot
      shotInFlight: false,
      // Flash progress controls a brief highlight when scoring
    };

    const flashRef = { current: 0 };

    /**
     * Resize the canvas to fill its parent.  Called on mount and whenever
     * the window resizes.  Also positions the hoop and resets the ball.
     */
    function handleResize() {
      const parent = canvas.parentElement;
      state.width = parent.clientWidth;
      state.height = parent.clientHeight;
      canvas.width = state.width;
      canvas.height = state.height;
      // Place hoop in the horizontal centre near the top.  Using 20% of
      // the height keeps the hoop reachable but clearly separated from
      // the starting position at the bottom.
      state.hoop.x = state.width * 0.5;
      state.hoop.y = state.height * 0.2;
      // Reset ball whenever the screen size changes
      resetBall();
    }

    /**
     * Reset the ball to its starting position and clear velocity.  Ball
     * starts near the lower left corner.  A slight vertical offset keeps
     * it above the very bottom to avoid immediate collisions.
     */
    function resetBall() {
      const b = state.ball;
      // Start the ball at the horizontal centre, just above the bottom
      // edge.  The slight offset prevents the ball from starting
      // partially clipped.
      b.x = state.width * 0.5;
      // Position the ball slightly above the bottom edge so there's room to
      // drag both upward and downward.  At least 5% of the height or
      // 24 pixels of margin is maintained below the ball.
      const bottomMargin = Math.max(state.height * 0.05, 24);
      b.y = state.height - b.radius - bottomMargin;
      b.vx = 0;
      b.vy = 0;
      b.isDragging = false;
      b.isLaunched = false;
      b.canScore = false;
      b.scored = false;
      state.shotInFlight = false;
    }

    /**
     * Convert a pointer event's client coordinates to canvas coordinates.
     */
    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      return { x, y };
    }

    /**
     * Handle pointer down events.  If the pointer intersects the ball
     * allow the player to drag it back to set the shot direction and power.
     */
    function onPointerDown(e) {
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      const b = state.ball;
      const dist = Math.hypot(x - b.x, y - b.y);
      if (dist <= b.radius) {
        // We do not manage a separate instruction overlay inside Game
        // anymore.  The instruction text is rendered by the parent.
        b.isDragging = true;
        b.dragStartX = x;
        b.dragStartY = y;
        b.dragCurrentX = x;
        b.dragCurrentY = y;
      }
    }

    /**
     * Update the current drag position while the pointer moves.  This will
     * be used to draw a guide line showing the shot direction and strength.
     */
    function onPointerMove(e) {
      if (!state.ball.isDragging) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      state.ball.dragCurrentX = x;
      state.ball.dragCurrentY = y;
    }

    /**
     * Launch the ball when the pointer is released.  The velocity is
     * proportional to the vector dragged: pulling back further yields
     * a faster shot.  We also set flags so the ball can be scored.
     */
    function onPointerUp(e) {
      if (!state.ball.isDragging) return;
      e.preventDefault();
      const b = state.ball;
      // Compute drag vector from the starting point to the current point.
      // Dragging upward (currentY < startY) results in a negative dy and
      // therefore a negative vertical velocity which makes the ball fly
      // upwards.  Dragging downward produces a positive dy which makes
      // the ball drop faster.  Horizontal drags similarly affect vx.
      const dx = b.dragCurrentX - b.dragStartX;
      const dy = b.dragCurrentY - b.dragStartY;
      const dragDist = Math.hypot(dx, dy);
      if (dragDist > 5) {
        const speedScale = 0.06;
        b.vx = dx * speedScale;
        b.vy = dy * speedScale;
        b.isLaunched = true;
        b.canScore = false;
        b.scored = false;
        state.shotInFlight = true;
      }
      b.isDragging = false;
    }

    /**
     * Draw the current frame.  Clears the canvas then draws the hoop,
     * optional drag line and the ball.
     */
    function draw() {
      ctx.clearRect(0, 0, state.width, state.height);
      drawHoop();
      // We intentionally omit the aiming guide here to align with the
      // user's request for a cleaner drag‑and‑release mechanic.
      drawBall();
      // Flash effect when a score occurs.  A translucent white overlay
      // fades quickly to highlight success.
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.15 * flashRef.current})`;
        ctx.fillRect(
          state.borderThickness,
          state.borderThickness,
          state.width - 2 * state.borderThickness,
          state.height - 2 * state.borderThickness
        );
        // Decay the flash intensity
        flashRef.current *= 0.9;
        if (flashRef.current < 0.01) flashRef.current = 0;
      }
    }

    /**
     * Draw the ball as a coloured circle.  If a shot is currently
     * moving upward or downward we change the fill colour slightly to
     * provide subtle feedback.
     */
    function drawBall() {
      const b = state.ball;
      ctx.save();
      // Compute a simple perspective scaling so the ball appears
      // smaller as it travels upward (toward the hoop) and larger as it
      // returns.  We ensure a minimum scale of 0.6 and maximum of 1.0.
      const verticalRatio = b.y / state.height;
      const scale = 0.6 + 0.4 * verticalRatio;
      const r = b.radius * scale;
      // Base circle
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#e76f51';
      ctx.fill();
      // Seams: darker colour, thickness proportional to scaled radius
      ctx.strokeStyle = '#2d2926';
      ctx.lineWidth = Math.max(2, r * 0.1);
      // Vertical seam
      ctx.beginPath();
      ctx.moveTo(b.x, b.y - r);
      ctx.lineTo(b.x, b.y + r);
      ctx.stroke();
      // Horizontal seam
      ctx.beginPath();
      ctx.moveTo(b.x - r, b.y);
      ctx.lineTo(b.x + r, b.y);
      ctx.stroke();
      // Curved seams (diagonals)
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, Math.PI * 0.25, Math.PI * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.stroke();
      // Outline highlight
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.stroke();
      ctx.restore();
    }

    /**
     * Draw the hoop and backboard.  The hoop is a circle with a thick
     * stroke to represent the rim.  The backboard is a simple rectangle
     * behind the rim.  Colours are kept subtle so they don't distract.
     */
    function drawHoop() {
      const h = state.hoop;
      ctx.save();
      // Rim
      ctx.beginPath();
      ctx.strokeStyle = '#f4a261';
      ctx.lineWidth = h.thickness;
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.stroke();
      // Net: draw vertical and diagonal lines to hint at a basketball net
      const netHeight = h.radius * 1.2;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      const segments = 5;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x1 = h.x - h.radius * 0.8 + t * h.radius * 1.6;
        const y1 = h.y + h.radius;
        const x2 = h.x - h.radius * 0.5 + t * h.radius * 1.0;
        const y2 = h.y + h.radius + netHeight;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      // Draw cross lines in the net
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        // Upper cross
        let x1 = h.x - h.radius * 0.8 + t1 * h.radius * 1.6;
        let x2 = h.x - h.radius * 0.8 + t2 * h.radius * 1.6;
        let y = h.y + h.radius + netHeight * 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y + netHeight * 0.2);
        ctx.stroke();
        // Lower cross
        y = h.y + h.radius + netHeight * 0.7;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y + netHeight * 0.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    /**
     * Draw a guide line from the ball to the current drag position to
     * indicate shot direction and strength while dragging.  This line
     * fades out as the drag length increases.
     */
    function drawGuideLine() {
      const b = state.ball;
      const dx = b.dragCurrentX - b.dragStartX;
      const dy = b.dragCurrentY - b.dragStartY;
      const dist = Math.hypot(dx, dy);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - dx, b.y - dy);
      ctx.stroke();
      ctx.restore();
    }

    /**
     * Main physics update called on every animation frame.  Applies
     * gravity, detects and responds to collisions with the rim, backboard
     * and floor, checks for scoring or misses, and triggers resets via
     * the provided callbacks.
     */
    function update() {
      const b = state.ball;
      if (b.isLaunched) {
        // Apply gravity
        b.vy += state.gravity;
        // Update position
        b.x += b.vx;
        b.y += b.vy;

        // Determine if the ball has passed above the rim to allow scoring
        if (!b.canScore && b.vy < 0 && b.y + b.radius < state.hoop.y) {
          b.canScore = true;
        }

        // Rim collision
        handleRimCollision();

        // Border collisions: bounce off left, right and top edges.  When the
        // ball hits the bottom edge it's considered a miss and the ball
        // resets.  The border thickness defines the padding from the
        // container edges.
        const border = state.borderThickness;
        // Left wall
        if (b.x - b.radius < border) {
          b.x = border + b.radius;
          b.vx = Math.abs(b.vx) * state.bounce;
        }
        // Right wall
        if (b.x + b.radius > state.width - border) {
          b.x = state.width - border - b.radius;
          b.vx = -Math.abs(b.vx) * state.bounce;
        }
        // Top wall
        if (b.y - b.radius < border) {
          b.y = border + b.radius;
          b.vy = Math.abs(b.vy) * state.bounce;
        }
        // Bottom wall (ground).  Hitting the bottom means a miss.
        if (b.y + b.radius > state.height - border) {
          callbacksRef.current.onMiss();
          state.shotInFlight = false;
          resetBall();
          return;
        }

        // Check scoring: ball must be moving downward after passing above
        // the rim and its x coordinate must be within the width of the rim.
        if (
          b.canScore &&
          !b.scored &&
          b.vy > 0 &&
          b.y - b.radius > state.hoop.y &&
          b.x > state.hoop.x - state.hoop.radius * 0.8 &&
          b.x < state.hoop.x + state.hoop.radius * 0.8
        ) {
          // Score achieved – notify parent and mark as scored so we
          // don't invoke multiple times.
          b.scored = true;
          callbacksRef.current.onScore();
          // Trigger a flash animation on the canvas border area
          flashRef.current = 1;
          // Delay resetting the ball slightly so the scoring feel is
          // acknowledged.  Without a timeout the ball would instantly
          // disappear when it enters the hoop which feels abrupt.
          setTimeout(() => resetBall(), 400);
        }

        // Miss detection: if the ball leaves the bottom of the screen
        // or travels too far horizontally, it's considered a miss.  We
        // only register misses when the shot is in flight to avoid
        // counting resets as misses.
        if (
          state.shotInFlight &&
          (b.y - b.radius > state.height || b.x + b.radius < 0 || b.x - b.radius > state.width)
        ) {
          callbacksRef.current.onMiss();
          state.shotInFlight = false;
          resetBall();
        }
      }
    }

    /**
     * Detect and respond to collisions between the ball and the rim.  If
     * the ball overlaps with the rim we compute the normal of the
     * collision and reflect the velocity around it.  A coefficient of
     * restitution determines how bouncy the rim is.  We also push the
     * ball out of the rim to avoid sinking into it.
     */
    function handleRimCollision() {
      const b = state.ball;
      const h = state.hoop;
      const dx = b.x - h.x;
      const dy = b.y - h.y;
      const dist = Math.hypot(dx, dy);
      const minDist = b.radius + h.radius - h.thickness / 2;
      // Determine whether to handle a collision.  We only reflect the ball
      // when it is above the rim and either moving upward (vy < 0) or
      // sufficiently far from the centre of the hoop horizontally.  This
      // allows shots that are descending through the middle of the hoop
      // to pass through without bouncing and prevents the ball from
      // getting stuck on the rim.
      if (b.y + b.radius < h.y && dist < minDist) {
        const centralThreshold = h.radius * 0.8;
        const shouldBounce = b.vy < 0 || Math.abs(dx) > centralThreshold;
        if (shouldBounce) {
          const nx = dx / dist;
          const ny = dy / dist;
          const vDotN = b.vx * nx + b.vy * ny;
          if (vDotN < 0) {
            b.vx = b.vx - (1 + state.bounce) * vDotN * nx;
            b.vy = b.vy - (1 + state.bounce) * vDotN * ny;
          }
          const overlap = minDist - dist;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
        // If not bouncing, do nothing – allow the ball to fall through.
      }
    }

    /**
     * Detect and respond to collisions with the backboard.  The backboard
     * is represented as a vertical rectangle located to the right of the rim.
     * When the ball hits it we invert the horizontal velocity and dampen
     * it slightly.
     */
    function handleBackboardCollision() {
      const b = state.ball;
      const h = state.hoop;
      const boardX = h.x + h.radius;
      const boardTop = h.y - 50;
      const boardBottom = h.y + 50;
      if (
        b.x + b.radius > boardX &&
        b.y > boardTop &&
        b.y < boardBottom &&
        b.vx > 0
      ) {
        b.x = boardX - b.radius;
        b.vx = -b.vx * state.bounce;
      }
    }

    /**
     * Animation loop.  Calls update to advance physics, draws the frame
     * and schedules the next iteration.  Using requestAnimationFrame
     * ensures smooth animation tied to the display refresh rate.
     */
    function loop() {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    }

    // Keep track of the current animation frame so we can cancel it on
    // cleanup.  Without cancellation the loop would continue even after
    // the component unmounts which would cause memory leaks.
    let animationFrameId;

    // Register event listeners and start the loop
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    handleResize();
    loop();

    // Cleanup on unmount: remove listeners and stop the loop
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
    // We intentionally leave the dependency array empty so this effect
    // runs exactly once.  The callbacksRef handles updates to the
    // onScore/onMiss functions without recreating the loop.
  }, []);

  return <canvas ref={canvasRef} className="game-canvas"></canvas>;
}