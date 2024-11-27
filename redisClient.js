const redis = require('redis')
const client = redis.createClient({
    host: 'localhost', 
    port: 6379
  });
  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  client.connect().then(() => {
    console.log('Connected to Redis server');
  }).catch(err => {
    console.error('Redis connection failed:', err);
  });

  module.exports = client