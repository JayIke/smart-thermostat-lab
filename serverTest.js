const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const smoothie = require('smoothie');
const btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

require('dotenv').config();
const arduinoAddress = '00:21:11:01:9A:A2'; // Replace with your Arduino's Bluetooth address



app.use(express.static('./'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

let info = {
  number: '+15633162027',
  maxtemp: '40',
  mintemp: '15',
}


 btSerial.findSerialPortChannel(arduinoAddress, (channel) => {
        btSerial.connect(arduinoAddress, channel, () => {
            
          console.log('Connected to Arduino via Bluetooth');
          
          var btchannel = channel;
          console.log(btchannel);
          // Send data to Arduinoc
          btSerial.write(Buffer.from('Hello, Arduino!', 'utf-8'), (err, bytesWritten) => {
            if (err) console.error(err);
            console.log(`Sent ${bytesWritten} bytes to Arduino`);
          });
        }, () => {
          console.error('Connection failed');
        });
      });



function reconnect(){
    console.log('in reconnect');
     
    if(!btSerial.isOpen()){
        btSerial.findSerialPortChannel(arduinoAddress, (channel) => {
            btSerial.connect(arduinoAddress, channel, () => {
                
              console.log('Connected to Arduino via Bluetooth');
              
              var btchannel = channel;
              console.log(btchannel);
              // Send data to Arduinoc
              btSerial.write(Buffer.from('Hello, Arduino!', 'utf-8'), (err, bytesWritten) => {
                if (err) console.error(err);
                console.log(`Sent ${bytesWritten} bytes to Arduino`);
              });
            }, () => {
              console.error('Connection failed');
            });
          });
  }
  console.log('leaving reconnect');
}

/*btSerial.on('found',(address)=>{
    console.log(address + ' found');
    if (address == arduinoAddress){
        reconnect();
    }
    
}
);*/

// Handle server errors
btSerial.on('error', (err) => {
  console.error('Bluetooth serial port error:', err);
});

btSerial.on('closed',() => {
    console.log('Arduino disconnected');
    reconnect();
}
);

// Function to send data to Arduino
function sendDataToArduino(data) {
  btSerial.write(Buffer.from(data, 'utf-8'), (err, bytesWritten) => {
    if (err) console.error(err);
    console.log(`Sent ${bytesWritten} bytes to Arduino`);
  });
}

// Function to handle incoming socket connections
function handleSocketConnection(socket) {
  console.log('Client connected');

  // Send initial data to the client
  sendDataToArduino('Hello, Arduino!');

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Handle actions from the client
  socket.on('action1', () => {
    console.log('action1 button pressed');
    sendDataToArduino('200');
  });

  socket.on('action2', () => {
    console.log('action2 button pressed');
  });

  socket.on('update info', (data) => {
    info.number = "+1" + data.number;
    info.maxtemp = data.maxtemp;
    info.mintemp = data.mintemp;
    console.log(data);
  });
}

// Listen for incoming socket connections and handle reconnections
io.on('connection', (socket) => {
  handleSocketConnection(socket);
});



// Handle data received from Arduino
let lastSentMessage = Date.now() - 60000;
btSerial.on('data', (buffer) => {
  const data = buffer.toString('utf-8');
  console.log(`Received data from Arduino: ${data}`);
  io.emit("graph new data", { time: Date.now(), value: data });
  if (Date.now() - lastSentMessage > 60000) {
    if (data > info.maxtemp) {
      console.log("Your temperature has reached above " + info.maxtemp + " degrees Celsius.");
      lastSentMessage = Date.now();
    } else if (data < info.mintemp) {
      console.log("Your temperature has declined below " + info.mintemp + " degrees Celsius.");
      lastSentMessage = Date.now();
    }
  }
});
