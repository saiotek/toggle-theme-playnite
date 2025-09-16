const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * Recolors a white PNG icon to the specified color while maintaining opacity
 * @param {string} inputPath - Path to input PNG file
 * @param {string} outputPath - Path to output PNG file
 * @param {string} colorHex - Target color in hex format (e.g., '#ff0000')
 */
async function recolorIcon(inputPath, outputPath, colorHex) {
  try {
    // Load the image
    const image = await loadImage(inputPath);

    // Create canvas with same dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Parse target color
    const targetColor = hexToRgb(colorHex);
    if (!targetColor) {
      throw new Error('Invalid color hex format');
    }

    // Recolor pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a === 0) continue;

      // Calculate brightness of the original pixel (0-1)
      const brightness = (r + g + b) / (3 * 255);

      // Apply target color scaled by brightness
      data[i] = Math.round(targetColor.r * brightness); // Red
      data[i + 1] = Math.round(targetColor.g * brightness); // Green
      data[i + 2] = Math.round(targetColor.b * brightness); // Blue
      // Alpha channel (i + 3) remains unchanged
    }

    // Put modified image data back
    ctx.putImageData(imageData, 0, 0);

    // Save the result
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`✓ Recolored ${inputPath} to ${outputPath} with color ${colorHex}`);
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error.message);
  }
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string (e.g., '#ff0000' or 'ff0000')
 * @returns {Object|null} RGB object or null if invalid
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

/**
 * Process multiple files in a directory
 * @param {string} inputDir - Input directory path
 * @param {string} outputDir - Output directory path
 * @param {string} colorHex - Target color in hex format
 */
async function recolorDirectory(inputDir, outputDir, colorHex) {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read all PNG files from input directory
    const files = fs.readdirSync(inputDir).filter((file) => path.extname(file).toLowerCase() === '.png');

    if (files.length === 0) {
      console.log('No PNG files found in input directory');
      return;
    }

    console.log(`Found ${files.length} PNG files to process...`);

    // Process each file
    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      await recolorIcon(inputPath, outputPath, colorHex);
    }

    console.log(`\n✓ Processed ${files.length} files successfully!`);
  } catch (error) {
    console.error('Error processing directory:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage:
  Single file: node recolor.js <input-file> <color-hex> [output-file]
  Directory:   node recolor.js <input-dir> <color-hex> <output-dir>

Examples:
  node recolor.js icon.png #ff0000 red-icon.png
  node recolor.js ./icons #00ff00 ./recolored-icons
  node recolor.js icon.png ff0000  (outputs to icon-recolored.png)
        `);
    process.exit(1);
  }

  const inputPath = args[0];
  const colorHex = args[1];
  const outputPath = args[2];

  // Validate color format
  if (!hexToRgb(colorHex)) {
    console.error('Invalid color hex format. Use format like #ff0000 or ff0000');
    process.exit(1);
  }

  // Check if input exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Input path does not exist: ${inputPath}`);
    process.exit(1);
  }

  const isDirectory = fs.statSync(inputPath).isDirectory();

  if (isDirectory) {
    // Directory processing
    const output = outputPath || `${inputPath}-recolored`;
    await recolorDirectory(inputPath, output, colorHex);
  } else {
    // Single file processing
    const output = outputPath || inputPath.replace(/\.png$/i, '-recolored.png');
    await recolorIcon(inputPath, output, colorHex);
  }
}

// Run the program
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { recolorIcon, recolorDirectory, hexToRgb };
