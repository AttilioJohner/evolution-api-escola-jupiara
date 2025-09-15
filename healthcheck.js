// Health check simples para Evolution API
const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.SERVER_PORT || 10000,
  path: '/',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  process.exit(res.statusCode === 200 ? 0 : 1);
});

request.on('error', (err) => {
  console.log('ERROR:', err.message);
  process.exit(1);
});

request.end();