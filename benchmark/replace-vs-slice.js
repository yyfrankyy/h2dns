const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;
const result = "v=spf1 include:_spf.google.com ~all";

// add tests
suite
  .add('RegExp#replace', function() {
    result.replace(/^"|"$/, '');
  })
  .add('String#slice', function() {
    result.slice(1, -1);
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({async: true});
