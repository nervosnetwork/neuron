const http = require('http');
const util = require('util');

let runningAppCount = 0

// Different test applications run in separate processes, `server` allows them to share data.
const server = http.createServer((req, res) => {
  const { url } = req
  if (req.url === '/app/count') {
    res.end(`${runningAppCount}`)
  }
  else if (url === '/app/count/increase') {
    runningAppCount += 1
    res.end(`${runningAppCount}`);
  }
  else if (url === '/app/count/decrease') {
    runningAppCount -= 1
    res.end(`${runningAppCount}`);
  }
  else if (req.url === '/exit') {
    res.end()
    const setTimeoutPromise = util.promisify(setTimeout);
    setTimeoutPromise(4000).then(() => {
      console.log(`server - exit ${runningAppCount} ${new Date().toTimeString()}`);
      process.exit(0)
    });
  }
  else {
    res.end()
  }
  console.log(`server - ${url} = ${runningAppCount} ${new Date().toTimeString()}`);
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(22333);

// Make sure to exit the program in the event of an error
const setTimeoutPromise = util.promisify(setTimeout);
setTimeoutPromise(1000 * 60 * 30).then(() => {
  process.exit(1)
});
