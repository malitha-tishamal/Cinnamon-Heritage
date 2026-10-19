/**
 * scripts/generate-config.js
 * Generates js/config.js from environment variables (.env file or Vercel process.env).
 * Run automatically during build or dev.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const outPath = path.join(rootDir, 'js', 'config.js');

// Helper to parse .env file if it exists
function parseEnvFile(filePath) {
  const envObj = {};
  if (!fs.existsSync(filePath)) return envObj;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.substring(0, eqIdx).trim();
      let val = line.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      envObj[key] = val;
    }
  }
  return envObj;
}

const fileEnv = parseEnvFile(envPath);

// Helper to get variable with fallback
function getEnv(key, fallback = '') {
  return process.env[key] || fileEnv[key] || fallback;
}

const config = {
  CLOUDINARY_CLOUD_NAME: getEnv('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_UPLOAD_PRESET: getEnv('CLOUDINARY_UPLOAD_PRESET', ''),
  FIREBASE_API_KEY: getEnv('FIREBASE_API_KEY', ''),
  FIREBASE_AUTH_DOMAIN: getEnv('FIREBASE_AUTH_DOMAIN', ''),
  FIREBASE_PROJECT_ID: getEnv('FIREBASE_PROJECT_ID', ''),
  FIREBASE_STORAGE_BUCKET: getEnv('FIREBASE_STORAGE_BUCKET', ''),
  FIREBASE_MESSAGING_SENDER_ID: getEnv('FIREBASE_MESSAGING_SENDER_ID', ''),
  FIREBASE_APP_ID: getEnv('FIREBASE_APP_ID', ''),
  EMAILJS_PUBLIC_KEY: getEnv('EMAILJS_PUBLIC_KEY', ''),
  EMAILJS_SERVICE_ID: getEnv('EMAILJS_SERVICE_ID', ''),
  EMAILJS_TEMPLATE_ID: getEnv('EMAILJS_TEMPLATE_ID', '')
};

const outputContent = `// Auto-generated configuration file — DO NOT EDIT DIRECTLY OR COMMIT TO GIT
window.__APP_CONFIG__ = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(outPath, outputContent, 'utf8');
console.log('✓ Successfully generated js/config.js from environment variables.');
