const sharp = require('sharp');
const path = require('path');

async function removeBackground() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/logo-transparent.png');

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const visited = new Uint8Array(width * height);

  // Helper to get pixel index
  const getIndex = (x, y) => (y * width + x) * 4;

  // Corner colors reference
  const cornerIdx = getIndex(0, 0);
  const bgR = data[cornerIdx];
  const bgG = data[cornerIdx + 1];
  const bgB = data[cornerIdx + 2];

  console.log(`Background reference color at (0,0): R:${bgR}, G:${bgG}, B:${bgB}`);

  // Color distance check
  function isBgColor(x, y) {
    const idx = getIndex(x, y);
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Distance from corner background color
    const dist = Math.sqrt(
      (r - bgR) * (r - bgR) +
      (g - bgG) * (g - bgG) +
      (b - bgB) * (b - bgB)
    );

    // Also consider high brightness off-white/cream pixels as background
    const isBrightOffWhite = (r > 210 && g > 205 && b > 195 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25);

    return dist < 65 || isBrightOffWhite;
  }

  // BFS Queue for Flood Fill starting from 4 corners
  const queue = [];
  const corners = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)], [Math.floor(width / 2), height - 1]
  ];

  for (const [cx, cy] of corners) {
    const key = cy * width + cx;
    if (!visited[key]) {
      visited[key] = 1;
      queue.push([cx, cy]);
    }
  }

  let head = 0;
  let clearedCount = 0;

  const dx = [-1, 1, 0, 0, -1, -1, 1, 1];
  const dy = [0, 0, -1, 1, -1, 1, -1, 1];

  while (head < queue.length) {
    const [x, y] = queue[head++];
    const idx = getIndex(x, y);

    // Turn pixel transparent
    data[idx + 3] = 0; // Alpha = 0
    clearedCount++;

    // Check neighbors
    for (let i = 0; i < 8; i++) {
      const nx = x + dx[i];
      const ny = y + dy[i];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nKey = ny * width + nx;
        if (!visited[nKey]) {
          visited[nKey] = 1;
          if (isBgColor(nx, ny)) {
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  // Anti-aliasing pass for edge pixels adjacent to transparent pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const key = y * width + x;
      if (!visited[key]) {
        const idx = getIndex(x, y);
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // If high brightness edge pixel next to transparent background, soften alpha
        if (r > 200 && g > 195 && b > 185) {
          let hasTransparentNeighbor = false;
          for (let i = 0; i < 4; i++) {
            const nx = x + dx[i];
            const ny = y + dy[i];
            const nIdx = getIndex(nx, ny);
            if (data[nIdx + 3] === 0) {
              hasTransparentNeighbor = true;
              break;
            }
          }
          if (hasTransparentNeighbor) {
            data[idx + 3] = 0; // Clear edge artifact
          }
        }
      }
    }
  }

  console.log(`Cleared ${clearedCount} background pixels out of ${width * height} total pixels.`);

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(outputPath);

  // Also replace public/logo.png or create public/logo-transparent.png
  console.log('Saved transparent logo to:', outputPath);
}

removeBackground().catch(console.error);
