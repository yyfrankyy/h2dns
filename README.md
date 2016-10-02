# DNS Over HTTP/2

Inspired by [gdns-go](https://github.com/ayanamist/gdns-go), but do less, I'd
like to keep it as simple as possible.

So,

1. No cache. use it as a backend, [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html)
 or [unbound](http://unbound.net/) as frontend.
2. No proxy. setup your proxy globally, the script will simply honor it.
3. Less config. if your public ip is changed, restart the script.

Last but not least, long live process, I prefer [pm2](http://pm2.keymetrics.io).

Write a [process file](http://pm2.keymetrics.io/docs/usage/application-declaration/)
with your customized setup (say `dns-over-http2.json`):

```
{
  "apps" : [{
    "name"        : "dns-over-http2",
    "script"      : "/path/to/your/dns-over-http2/index.js",
    "args"        : ["your public ip", 6666, "127.0.0.1"],
    "env": {
        "NODE_ENV": "production"
    }
  }]
}
```

Simply start it as follow:

```
pm2 start dns-over-http2.json
```

All set, test it with dig:

```
$ dig @127.0.0.1 -p 6666 github.com A +short
github.com.
192.30.253.112
```
