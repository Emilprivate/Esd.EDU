const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile('cookie.html', { root: __dirname });
});

app.post('/interaction', (req, res) => {
    const clientIp = req.connection.remoteAddress;
    const clientPort = req.connection.remotePort;
    const logEntry = `Received interaction from ${clientIp}:${clientPort} - ${req.body.element}\n`;
  
    console.log(logEntry);
  
    fs.appendFile('log.txt', logEntry, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
        res.status(500).send('Error logging interaction');
      } else {
        res.status(200).send('OK');
      }
    });
  });

app.listen(port, () => {
  console.log(`Spy site listening at http://localhost:${port}`);
});