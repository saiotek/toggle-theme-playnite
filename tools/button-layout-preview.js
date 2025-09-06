const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const [_node, _file, dir, fallback] = process.argv;

const canvas = createCanvas(512, 384);

const layout = [
  ['ButtonPromptA.Png', 'ButtonPromptB.png', 'ButtonPromptX.Png', 'ButtonPromptY.Png'],
  ['ButtonPromptLB.png', 'ButtonPromptLT.png', 'ButtonPromptRT.png', 'ButtonPromptRB.png'],
  ['ButtonPromptLS.png', 'ButtonPromptBack.Png', 'ButtonPromptStart.Png', 'ButtonPromptRS.png'],
];

const ctx = canvas.getContext('2d');

async function createButtonLayout() {
  const imageSize = 128;

  for (let row = 0; row < layout.length; row++) {
    for (let col = 0; col < layout[row].length; col++) {
      const fileName = layout[row][col];
      let imagePath = null;

      // Check primary directory first
      const primaryPath = path.join(dir, fileName);
      if (fs.existsSync(primaryPath)) {
        imagePath = primaryPath;
      }
      // Check fallback directory if primary doesn't exist
      else if (fallback) {
        const fallbackPath = path.join(fallback, fileName);
        if (fs.existsSync(fallbackPath)) {
          imagePath = fallbackPath;
        }
      }

      // If we found an image, load and draw it
      if (imagePath) {
        try {
          const image = await loadImage(imagePath);
          const x = col * imageSize;
          const y = row * imageSize;
          ctx.drawImage(image, x, y, imageSize, imageSize);
        } catch (error) {
          console.warn(`Failed to load image: ${imagePath}`, error.message);
          // Leave blank space on error
        }
      }
      // If no image found, leave blank space (do nothing)
    }
  }

  // Save the canvas as PNG with directory name
  const outputFileName = `${path.basename(dir)}.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputFileName, buffer);

  console.log(`Generated ${outputFileName}`);
}

// Run the function
createButtonLayout().catch(console.error);
