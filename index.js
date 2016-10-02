const dnsd = require('dnsd');
const spdy = require('spdy');
const request = require('request').defaults({
  agent: spdy.createAgent({
    host: 'dns.google.com',
    port: 443
  }),
  json: true
});
const subnet = process.argv[2];
const RRTypes = require('./RRTypes').IntToString;
const RRTypesByString = require('./RRTypes').StringToInt;

const dns = dnsd.createServer((req, res) => {
  console.log(
    '%s:%s/%s %j',
    req.connection.remoteAddress, req.connection.remotePort,
    req.connection.type, req
  );
  let question = req.question[0], hostname = question.name;
  // TODO unsupported for now, due to dnsd's broken implementation.
  if (question.type == 'AAAA') return res.end();
  request({
    url: 'https://dns.google.com/resolve',
    qs: {
      edns_client_subnet: subnet,
      name: hostname,
      type: RRTypesByString[question.type]
    }
  }, (err, response, output) => {
    if (output && output.Answer) {
      res.answer = output.Answer.map(rec => {
        rec.ttl = rec.TTL;
        rec.type = RRTypes[rec.type];
        if (rec.type == 'MX') {
          rec.data = rec.data.split(/\s+/);
        }
        delete rec.TTL;
        return rec;
      });
    } else if (err) {
      console.error(err);
    }
    res.end();
  }).on('error', err => {
    console.error(err);
  });
});

dns.on('error', err => {
  console.error(err);
});

dns.listen(process.argv[3] || 5353, process.argv[4] || '127.0.0.1');
