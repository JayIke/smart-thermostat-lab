
const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const smoothie = require('smoothie')

const btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

require('dotenv').config();

const arduinoAddress = '00:21:11:01:9A:A2'; // Replace with your Arduino's Bluetooth address


// const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

app.use(express.static('./'))

app.get('/', (req, res) => {
  res.sendFile(__dirname+'/index.html');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

btSerial.findSerialPortChannel(arduinoAddress, (channel) => {
  btSerial.connect(arduinoAddress, channel, () => {
    console.log('Connected to Arduino via Bluetooth');
    
    // Send data to Arduinoc
    btSerial.write(Buffer.from('Hello, Arduino!', 'utf-8'), (err, bytesWritten) => {
      if (err) console.error(err);
      console.log(`Sent ${bytesWritten} bytes to Arduino`);
    });
  }, () => {
    console.error('Connection failed');
  });
});


// Handle server errors
btSerial.on('error', (err) => {
  console.error('Bluetooth serial port error:', err);
});


let info = {
  number: '+15633162027',
  maxtemp: '40', 
  mintemp: '15',
}

io.on('connection', (socket) => {
  socket.on('action1', () => {
    console.log('action1 button pressed');
    btSerial.write(Buffer.from('200', 'utf-8'), (err, bytesWritten) => {
      if (err) console.error(err);
      console.log(`Sent ${bytesWritten} bytes to Arduino`);
    });
  });
  socket.on('action2', () => {
    console.log('action2 button pressed');
  });
  socket.on('update info', (data) => {
    info.number = "+1" + data.number
    info.maxtemp = data.maxtemp
    info.mintemp = data.mintemp
    console.log(data);
  })
})

lastSentMessage = Date.now()-60000;

btSerial.on('data', (buffer) => {
  // Handle data received from Arduino if needed
  const data = buffer.toString('utf-8');
  console.log(`Received data from Arduino: ${data}`);
  io.emit("graph new data", { time: Date.now(), value: data });
  if (Date.now() - lastSentMessage > 60000) {
    if (data > info.maxtemp) {
      // client.messages.create({
      //   body: "Your temperature has reached above "+info.maxtemp+" degrees Celcius.",
      //   from: "+18443391255",
      //   to: info.number,
      // });
      console.log("Your temperature has reached above " + info.maxtemp + " degrees Celcius.");
      lastSentMessage = Date.now();
    }
    else if (data < info.mintemp) {
      // client.messages.create({
      //   body: "Your temperature has declined below "+info.mintemp+" degrees Celcius.",
      //   from: "+18443391255",
      //   to: info.number,
      // });
      console.log("Your temperature has declined below " + info.mintemp + " degrees Celcius.");
      lastSentMessage = Date.now();
    }
  }
});

