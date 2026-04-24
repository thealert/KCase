self.onmessage = function(e) {
  const interval = e.data.interval;
  setInterval(() => {
    self.postMessage('tick');
  }, interval);
};
