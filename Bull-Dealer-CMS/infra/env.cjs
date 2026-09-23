// Load the root .env for every command; explicit environment variables win.
const { loadEnvFile } = require('node:process');
const { resolve } = require('node:path');
try { loadEnvFile(resolve(__dirname, '../.env')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
