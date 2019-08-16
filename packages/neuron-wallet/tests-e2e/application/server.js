const http = require('http');

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
    process.exit(0)
  }
  else {
    res.end()
  }
  console.log(`server - ${url} = ${runningAppCount}`);
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(22333);
