# DNS Over HTTP/2

[![Coverity Scan Build Status](https://scan.coverity.com/projects/10575/badge.svg)](https://scan.coverity.com/projects/yyfrankyy-dns-over-http2)

A DNS Server over Google's HTTPS DNS API in HTTP/2 Protocol.

### QuickStart

```
npm i h2dns -g
```

```
$ h2dns -h

  Usage: h2dns [options]

  Options:

    -h, --help                         output usage information
    -V, --version                      output the version number
    -i, --edns-client-subnet [subnet]  EDNS Client Subnet
    -p, --port [6666]                  Port to bind
    -l, --listen [127.0.0.1]           Address to listen
    -t, --timeout [5000]               Default Http2 Request Timeout
    -c, --pool [2]                     Concurrent Connections of Pool Size
    --ping-interval [60000]            Interval of ping to keep connection alive.
```

### Tips

Inspired by [gdns-go](https://github.com/ayanamist/gdns-go), but do less, I'd
like to keep it as simple as possible.

So,

1. No cache. use it as a backend, [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html)
 or [unbound](http://unbound.net/) as frontend.
2. No proxy. setup your proxy globally, the script will simply honor it.
3. Less config. if your public ip is changed, restart the script.
