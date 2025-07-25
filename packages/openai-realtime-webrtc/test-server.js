import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));
app.use('/dist', express.static(join(__dirname, 'dist')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'quick-test.html'));
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to test the NPM module');
});