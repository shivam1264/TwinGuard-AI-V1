import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { io } from 'socket.io-client';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function findAvailablePort() {
  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const { port } = reservation.address();
  await new Promise((resolve, reject) => {
    reservation.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

function waitForServer(child, port) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 10_000);
    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes(`:${port}`) && output.includes('listening on')) {
        clearTimeout(timeout);
        resolve();
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited before startup (${code}): ${output}`));
    });
  });
}

function waitForFireEvent(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('fire-detected', onFireDetected);
      reject(new Error('Timed out waiting for fire-detected'));
    }, 5000);
    const onFireDetected = (event) => {
      clearTimeout(timeout);
      resolve(event);
    };
    socket.once('fire-detected', onFireDetected);
  });
}

test('fire trigger POST echoes its trigger ID once and supports callers without IDs', { timeout: 20_000 }, async () => {
  const port = await findAvailablePort();
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let socket;

  try {
    await waitForServer(child, port);
    socket = io(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out connecting test socket')), 5000);
      socket.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const observedEvents = [];
    socket.on('fire-detected', (event) => observedEvents.push(event));

    const triggerId = 'originating-client-trigger';
    const firstEventPromise = waitForFireEvent(socket);
    const firstResponse = await fetch(`http://127.0.0.1:${port}/api/trigger-fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'f1_r1', triggerId })
    });
    assert.equal(firstResponse.status, 200);
    const firstEvent = await firstEventPromise;
    await delay(50);
    assert.equal(firstEvent.triggerId, triggerId);
    assert.equal(observedEvents.length, 1);

    const legacyEventPromise = waitForFireEvent(socket);
    const legacyResponse = await fetch(`http://127.0.0.1:${port}/api/trigger-fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'f1_r2' })
    });
    assert.equal(legacyResponse.status, 200);
    const legacyEvent = await legacyEventPromise;
    await delay(50);
    assert.equal(Object.hasOwn(legacyEvent, 'triggerId'), false);
    assert.equal(observedEvents.length, 2);
  } finally {
    socket?.close();
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once('exit', resolve));
    }
  }
});
