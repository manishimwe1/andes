#!/usr/bin/env node
const { spawn } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('In-memory MongoDB started at', uri);

  const env = Object.assign({}, process.env, { MONGODB_URI: uri });

  console.log('Launching backend (node dist/index.js) with MONGODB_URI injected');
  const child = spawn(process.execPath, ['dist/index.js'], { env, stdio: 'inherit', cwd: process.cwd() });

  const shutdown = async () => {
    console.log('Shutting down backend and in-memory MongoDB...');
    try {
      child.kill();
    } catch (e) {}
    try {
      await mongod.stop();
    } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', shutdown);
}

start().catch((err) => {
  console.error('Failed to start in-memory MongoDB + backend:', err);
  process.exit(1);
});
