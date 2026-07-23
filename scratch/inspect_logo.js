const sharp = require('sharp');
const path = require('path');

async function inspectImage() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  console.log(`Image dimensions: ${info.width}x${info.height}, channels: ${info.channels}`);

  // Sample corner pixels
  const topLeft = [data[0], data[1], data[2], data[3]];
  const topRight = [data[(info.width - 1) * 4], data[(info.width - 1) * 4 + 1], data[(info.width - 1) * 4 + 2], data[(info.width - 1) * 4 + 3]];
  
  console.log('Top-Left pixel RGB-A:', topLeft);
  console.log('Top-Right pixel RGB-A:', topRight);

  // Check distribution of background colors
  let whiteCount = 0;
  let nearWhiteCount = 0;
  let coloredCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r === 255 && g === 255 && b === 255) {
      whiteCount++;
    } else if (r > 200 && g > 200 && b > 200) {
      nearWhiteCount++;
    } else {
      coloredCount++;
    }
  }

  console.log(`Pure White (255,255,255): ${whiteCount}`);
  console.log(`Near White (>200,>200,>200): ${nearWhiteCount}`);
  console.log(`Other Colored (<200): ${coloredCount}`);
}

inspectImage().catch(console.error);
