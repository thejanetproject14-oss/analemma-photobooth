export interface FrameConfig {
  id: string;
  name: string;
  emoji: string;
  /** If set, render a PNG overlay from this URL instead of the placeholder */
  overlayUrl?: string;
  /** Draw the placeholder frame onto a canvas context */
  drawPlaceholder: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

function drawBorderRect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  thickness: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  const offset = thickness / 2;
  ctx.strokeRect(offset, offset, w - thickness, h - thickness);
}

function drawBottomText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string,
  font: string,
  color: string
) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h - 24);
}

// Small decorative circles for confetti effect
function drawConfettiDots(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const colors = ["#E8A0BF", "#FFD700", "#FF6B6B", "#7EC8E3", "#C3E88D", "#FFB347"];
  const positions: [number, number][] = [];
  // Top edge
  for (let x = 20; x < w; x += 35) {
    positions.push([x, 12 + Math.random() * 20]);
    positions.push([x + 15, 40 + Math.random() * 10]);
  }
  // Bottom edge
  for (let x = 20; x < w; x += 35) {
    positions.push([x, h - 12 - Math.random() * 20]);
    positions.push([x + 15, h - 40 - Math.random() * 10]);
  }
  // Left edge
  for (let y = 60; y < h - 60; y += 40) {
    positions.push([12 + Math.random() * 20, y]);
  }
  // Right edge
  for (let y = 60; y < h - 60; y += 40) {
    positions.push([w - 12 - Math.random() * 20, y]);
  }
  positions.forEach(([x, y], i) => {
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.arc(x, y, 4 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Small circles for berry illustrations
function drawBerries(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const berryColors = ["#C44569", "#E8518A", "#9B2335", "#D63384"];
  const leafColor = "#5A8F3C";

  const positions: [number, number][] = [];
  for (let x = 30; x < w; x += 60) {
    positions.push([x, 22]);
    positions.push([x + 30, h - 22]);
  }
  for (let y = 60; y < h - 60; y += 55) {
    positions.push([22, y]);
    positions.push([w - 22, y]);
  }

  positions.forEach(([x, y], i) => {
    // Leaf
    ctx.fillStyle = leafColor;
    ctx.beginPath();
    ctx.ellipse(x + 6, y - 5, 5, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    // Berry cluster
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.fillStyle = berryColors[(i + j) % berryColors.length];
      ctx.arc(x + (j - 1) * 6, y + (j % 2) * 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Sparkle shapes for golden hour
function drawSparkles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const positions: [number, number][] = [];
  for (let x = 25; x < w; x += 50) {
    positions.push([x, 18]);
    positions.push([x + 25, h - 18]);
  }
  for (let y = 50; y < h - 50; y += 50) {
    positions.push([18, y]);
    positions.push([w - 18, y]);
  }

  positions.forEach(([x, y]) => {
    ctx.fillStyle = "#FFD700";
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    // 4-point star
    ctx.beginPath();
    const s = 4 + Math.random() * 4;
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.3, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.3, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x, y + s * 0.3);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y - s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// Small pastry shapes for sweet treat
function drawPastries(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const positions: [number, number][] = [];
  for (let x = 30; x < w; x += 55) {
    positions.push([x, 20]);
    positions.push([x + 27, h - 20]);
  }
  for (let y = 55; y < h - 55; y += 55) {
    positions.push([20, y]);
    positions.push([w - 20, y]);
  }

  positions.forEach(([x, y], i) => {
    if (i % 3 === 0) {
      // Cupcake shape
      ctx.fillStyle = "#F8B4C8";
      ctx.beginPath();
      ctx.arc(x, y - 4, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#FFDAB9";
      ctx.fillRect(x - 6, y - 4, 12, 8);
    } else if (i % 3 === 1) {
      // Donut shape
      ctx.strokeStyle = "#E8A0BF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#FFE4E1";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cherry
      ctx.fillStyle = "#C44569";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5A8F3C";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 5);
      ctx.quadraticCurveTo(x + 4, y - 12, x + 8, y - 8);
      ctx.stroke();
    }
  });
}

export const FRAMES: FrameConfig[] = [
  {
    id: "sweet-treat",
    name: "Sweet Treat",
    emoji: "🧁",
    drawPlaceholder(ctx, w, h) {
      // Soft pink border
      drawBorderRect(ctx, w, h, "#F8B4C8", 40);
      drawPastries(ctx, w, h);
      drawBottomText(ctx, w, h, "sweet treat by analemma", "16px 'Inter', sans-serif", "#C44569");
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    emoji: "✨",
    drawPlaceholder(ctx, w, h) {
      // Warm golden gradient border
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#FFD700");
      grad.addColorStop(0.5, "#FFA500");
      grad.addColorStop(1, "#FFD700");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 36;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      drawSparkles(ctx, w, h);
      ctx.font = "italic 20px 'Playfair Display', serif";
      ctx.fillStyle = "#DAA520";
      ctx.textAlign = "center";
      ctx.fillText("analemma", w / 2, h - 20);
    },
  },
  {
    id: "berry-cute",
    name: "Berry Cute",
    emoji: "🍓",
    drawPlaceholder(ctx, w, h) {
      drawBorderRect(ctx, w, h, "#E8518A", 36);
      drawBerries(ctx, w, h);
      drawBottomText(ctx, w, h, "berry cute 🍓", "bold 15px 'Inter', sans-serif", "#9B2335");
    },
  },
  {
    id: "colour-joy",
    name: "Colour Joy",
    emoji: "🎨",
    drawPlaceholder(ctx, w, h) {
      drawBorderRect(ctx, w, h, "#FFE4E1", 42);
      drawConfettiDots(ctx, w, h);
      drawBottomText(ctx, w, h, "analemma.shop", "13px 'Inter', sans-serif", "#666");
    },
  },
  {
    id: "plain",
    name: "Plain",
    emoji: "🤍",
    drawPlaceholder(ctx, w, h) {
      // Just a subtle watermark in the corner
      ctx.fillStyle = "rgba(200, 160, 180, 0.35)";
      ctx.font = "12px 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("analemma", w - 14, h - 14);
    },
  },
];
