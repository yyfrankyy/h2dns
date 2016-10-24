process.setMaxListeners(0);

const dnsd = require('./dnsd/named');
const spdy = require('spdy');
const randomstring = require("randomstring");
const forwardUrl = 'https://dns.google.com:443/resolve';
const url = require('url');
const resolver = url.parse(forwardUrl);

const defaultOptions = {
  json: true,
  timeout: 5000,
  agent: true, // a holder for proxy
};

class AgentPool {
  constructor(max) {
    let head = this.head = {
      agent: this.createAgent()
    }
    for (let i = 0; i < max - 1; i++) {
      head.next = {
        agent: this.createAgent(),
        prev: head
      }
      head = head.next;
    }
    this.tail = head;
    this.count = max;
    this.max = max;
  }
  aquire() {
    this.count--;
    if (this.tail) {
      let tail = this.tail;
      this.tail = tail.prev;
      this.tail.next = null;
      return tail.agent;
    } else {
      console.warn('Exceed pool maxSockets, creating a new Agent');
      return this.createAgent();
    }
  }
  release(agent) {
    this.count++;
    let node = {agent: agent};
    if (this.tail) {
      node.prev = this.tail;
      node.prev.next = node;
      this.tail = node;
    } else {
      this.head = this.tail = node;
    }
  }
  createAgent() {
    return spdy.createAgent({
      host: resolver.hostname,
      port: resolver.port
    }).once('error', (err) => {
      console.error('agent error: %s', err);
    });
  }
  count() {
    return this.count;
  }
}

const agentPool = new AgentPool(10);

const request = require('request').defaults(new Proxy(defaultOptions, {
  get: (target, name) => {
    if (name === 'agent') {
      return agentPool.aquire();
    }
    return defaultOptions[name];
  }
}));
const Constants = require('./dnsd/constants');
const ip6 = require('ip6');

const subnet = process.argv[2];
const SupportTypes = ['A', 'MX', 'CNAME', 'TXT', 'PTR', 'AAAA'];

const server = dnsd.createServer((req, res) => {
  let question = req.question[0], hostname = question.name;
  let time = new Date().getTime();
  const timeStamp = `[${time}/${req.id}/${req.connection.type}] ${req.opcode} ${hostname} ${question.class} ${question.type}`;
  console.time(timeStamp);

  // TODO unsupported due to dnsd's broken implementation.
  if (SupportTypes.indexOf(question.type) === -1) {
    console.timeEnd(timeStamp);
    return res.end();
  }

  // API clients concerned about possible side-channel privacy attacks
  // using the packet sizes of HTTPS GET requests can use this to make all
  // requests exactly the same size by padding requests with random data.
  let padding = randomstring.generate({
    // maximum dnslength+NSEC3PARAM.length (longest possible Type now)
    // minus current To make always equal query lenght url
    length: 263 - question.name.length - question.type.length,
    // safe but can be more extended chars-_
    charset: 'alphanumeric'
  });

  let query = {
    name: hostname,
    type: Constants.type_to_number(question.type),
    random_padding: padding
  }

  if (subnet) {
    query.edns_client_subnet = subnet;
  }

  const http2Req = request({
    url: forwardUrl,
    qs: query
  }, (err, response, output) => {
    agentPool.release(http2Req.agent);
    console.timeEnd(timeStamp);
    if (output && output.Answer) {
      res.answer = output.Answer.map(rec => {
        rec.ttl = rec.TTL;
        rec.type = Constants.type_to_label(rec.type);
        switch (rec.type) {
          case 'MX':
            rec.data = rec.data.split(/\s+/);
            break;
          case 'TXT':
          case 'SPF':
            rec.data = rec.data.slice(1, -1);
            break;
          case 'AAAA':
            // dnsd is expecting long IPVersion 6 format
            rec.data = ip6.normalize(rec.data);
            break;
        }

        return rec;
      });
    } else if (err) {
      console.error('request error %s', err);
    }
    res.end();
  });
  http2Req.on('error', (err) => {
    console.error('request error %s', err);
  });
});

server.on('error', err => {
  console.error('dnsd error: %s', err);
});

const devnull = require('dev-null');
setInterval(() => {
  let ping = forwardUrl + '?name=' + resolver.hostname;
  request(ping).pipe(devnull());
}, 60 * 1000);

server.listen(process.argv[3] || 6666, process.argv[4] || '127.0.0.1');
