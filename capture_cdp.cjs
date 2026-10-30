const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let fPath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(fPath)) fPath = path.join(distDir, 'index.html');
  const ext = path.extname(fPath);
  const mimeMap = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(fPath));
});

server.listen(4173, async () => {
  console.log('Static server running on http://localhost:4173');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1920,1080',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    'http://localhost:4173'
  ]);

  // Wait 4.5 seconds for chrome to launch and page to load
  await new Promise(r => setTimeout(r, 4500));

  try {
    const listRes = await fetch('http://localhost:9222/json');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.type === 'page');
    if (!tab) throw new Error('No page tab found');

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onopen = () => {
      let msgId = 1;
      const send = (method, params = {}) => {
        const id = msgId++;
        ws.send(JSON.stringify({ id, method, params }));
        return id;
      };

      send('Runtime.enable');

      // Check if __sceneManager is ready
      const checkReady = () => {
        const evalId = send('Runtime.evaluate', {
          expression: `Boolean(window.__sceneManager)`
        });
      };

      // 1. Switch to CAMPUS_OVERVIEW camera preset immediately without animation
      setTimeout(() => {
        send('Runtime.evaluate', {
          expression: `
            if (window.__sceneManager) {
              window.__sceneManager.setCameraPreset('CAMPUS_OVERVIEW', null, false);
              console.log('Switched to CAMPUS_OVERVIEW');
            } else {
              console.log('SceneManager not ready yet');
            }
          `
        });

        // Wait 2 seconds for Three.js render frame to draw
        setTimeout(() => {
          const shotId = send('Page.captureScreenshot', { format: 'png' });
          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.id === shotId && data.result && data.result.data) {
              const buf = Buffer.from(data.result.data, 'base64');
              const outPath = path.join(__dirname, 'campus_master_plan_render.png');
              fs.writeFileSync(outPath, buf);
              console.log('Successfully captured campus render to:', outPath, buf.length + ' bytes');
              ws.close();
              chromeProcess.kill();
              server.close();
              process.exit(0);
            }
          };
        }, 2000);
      }, 1000);
    };
  } catch (err) {
    console.error('CDP Error:', err);
    chromeProcess.kill();
    server.close();
    process.exit(1);
  }
});

