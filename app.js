'use strict';

var redis = require('redis');
var http = require('http');
var nconf = require('nconf');

nconf.argv().env().file('keys.json');

var client = redis.createClient(
  nconf.get('redisPort') || '6379',
  nconf.get('redisHost') || '127.0.0.1',
  {
    'auth_pass': nconf.get('redisKey'),
    'return_buffers': true
  }
).on('error', function (err) {
  console.error('ERR:REDIS: ' + err);
});


http.createServer(function (req, res) {
  client.on('error', function (err) {
    console.log('Error ' + err);
  });

  /**
   * track IP of every visitor
   */

  var listName = 'IPs';
  client.lpush(listName, req.connection.remoteAddress);
  client.ltrim(listName, 0, 25);

  var iplist = '';
  client.lrange(listName, 0, -1, function (err, data) {
    if (err) {
      console.log(err);
    }
    console.log('listing data...\n');
    data.forEach(function (ip) {
      console.log('IP: ' + ip + '\n');
      iplist += ip + '; ';
    });

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(iplist);
  });
}).listen(process.env.PORT || 8080);

console.log('started web process');