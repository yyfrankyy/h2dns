const spdy = require('spdy');
const debug = require('debug')('h2dns:agent');

class AgentPool {
  constructor(resolver, max) {
    this.resolver = resolver;
    this.count = 0;
    this.max = max;
  }
  aquire() {
    if (this.tail) {
      this.count--;
      let tail = this.tail;
      this.tail = tail.prev;
      if (this.tail) this.tail.next = null;
      if (tail.agent._spdyState.connection._spdyState.goaway) {
        debug('agent is marked as goaway, drop it.');
        return this.aquire();
      }
      return tail.agent;
    } else {
      debug('no agent left in the pool, creating a new one');
      return this.createAgent();
    }
  }
  release(agent) {
    if (this.count >= this.max) return;
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
    const agent = spdy.createAgent({
      host: this.resolver.hostname,
      port: this.resolver.port,
      family: this.resolver.family
    });
    agent.on('error', err => {
      debug('agent error', err);
    });
    agent.once('_connect', () => {
      let connection = agent._spdyState.connection;
      if (connection != null) {
        connection.on('error', err => {
          debug('connection error', err);
        });
      }
    });
    return agent;
  }
  count() {
    return this.count;
  }
}

module.exports = function(resolver, size) {
  return new AgentPool(resolver, size);
}
