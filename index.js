process.setMaxListeners(4096);
const dnsd = require('dnsd');
const spdy = require('spdy');
const request = require('request').defaults({
  agent: spdy.createAgent({
    host: 'dns.google.com',
    port: 443
  }).once('error', (err) => {
    console.error('agent error: %s', err);
  }),
  json: true
});
const subnet = process.argv[2];
const RRTypes = require('./RRTypes').IntToString;
const RRTypesByString = require('./RRTypes').StringToInt;
const SupportTypes = ['A', 'MX', 'CNAME', 'TXT', 'PTR'];

const server = dnsd.createServer((req, res) => {
  let question = req.question[0], hostname = question.name;
  let timeStamp = `[${req.id}/${req.connection.type}] ${req.opcode} ${hostname} ${question.class} ${question.type}`;
  console.time(timeStamp);
  // TODO unsupported due to dnsd's broken implementation.
  if (SupportTypes.indexOf(question.type) === -1) {
    console.timeEnd(timeStamp);
    return res.end();
  }
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
      console.error('request error %s', err);
    }
    console.timeEnd(timeStamp);
    res.end();
  });
});

server.once('error', err => {
  console.error('dnsd error: %s', err);
});

server.listen(process.argv[3] || 6666, process.argv[4] || '127.0.0.1');
