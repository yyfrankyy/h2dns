process.setMaxListeners(0);
const dnsd = require('./dnsd/named');
const spdy = require('spdy');
const randomstring = require("randomstring");
const forwardurl ='https://dns.google.com:443/resolve';//https://developers.google.com/speed/public-dns/docs/dns-over-https
const url = require('url'); 
const resolver = url.parse(forwardurl);

const request = require('request').defaults({
  agent: spdy.createAgent({
    host: resolver.hostname,
    port: resolver.port
  }).once('error', (err) => {
    console.error('agent error: %s', err);
  }),
  json: true
});
const subnet = process.argv[2];
const Constants = require('./dnsd/constants');
const SupportTypes = ['A', 'MX', 'CNAME', 'TXT', 'PTR', 'AAAA'];
const ip6 = require('ip6')
const server = dnsd.createServer((req, res) => {
  let question = req.question[0], hostname = question.name;
  let timeStamp = `[${req.id}/${req.connection.type}] ${req.opcode} ${hostname} ${question.class} ${question.type}`;
  console.time(timeStamp);
  // TODO unsupported due to dnsd's broken implementation.
  if (SupportTypes.indexOf(question.type) === -1) {
    console.timeEnd(timeStamp);
    return res.end();
  } else{
  padding=  randomstring.generate({//API clients concerned about possible side-channel privacy attacks using the packet sizes of HTTPS GET requests can use this to make all requests exactly the same size by padding requests with random data. 
  length: 263-question.name.length-question.type.length,//maximum dnslength+NSEC3PARAM.length (longest possible Type now) minus current To make always equal query lenght url
  charset: 'alphanumeric'//safe but can be more extended chars-_ 
    });
    query={
      edns_client_subnet:   subnet,
      name: hostname,
      type: Constants.type_to_number(question.type),
      random_padding:   padding
    }   
    if( typeof subnet !== 'undefined' && subnet )query[0]=''; //allow approximate network Information if not specified
  }
  request({
    url: forwardurl,
    qs: query
  }, (err, response, output) => {//console.dir(res)      //res['recursion_available']=true;response['recursion_available']=true; // Always true for Google Public DNS      
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
        	rec.data = ip6.normalize(rec.data); //fix dnsd/encode.js:132-133 As expects long IPVersion 6 format
        	break;
        }
        //delete rec.TTL;
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

const devnull = require('dev-null');
setInterval(() => {
  let ping = forwardurl +'?name=' +resolver.hostname;
  request(ping).pipe(devnull());
}, 60 * 1000);

server.listen(process.argv[3] || 6666, process.argv[4] || '127.0.0.1');
