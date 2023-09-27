#include <SoftwareSerial.h>

// Note: Need to integrate this with the TempDisplayNew.ino 

SoftwareSerial bluetoothSerial(2, 3); // Pin map: Arduino->BT = PIN3->RXD & PIN2->TXD
                                      // Syntax: SoftwareSerial(RxPin, TxPin)
                                      // Circuitry: RxPin on Arduino goes to BT module TxD

String input = ""; // Stores receive data from server
String output = ""; // Stores transmit data to send to server

void setup() {
  // Open serial communications:
  Serial.begin(9600);
  bluetoothSerial.begin(9600); // HC-06 default baud rate (keep)
}

void loop() {
  // Read data from Bluetooth module and send it to Serial Monitor
  if (bluetoothSerial.available()) { // Returns the number of bytes to read
    while (bluetoothSerial.available()) {
      input += bluetoothSerial.read(); // Append char data received from server and append to string
    }
    // Use server function calls here to ensure we're using newest data
    Serial.print("Received: ");
    Serial.println(input);
  }

  // Send random seed value to Bluetooth module
  if (Serial.availableForWrite()) {
    int seed = random(100, 259); // Generate a random seed (replace with temp data)
    //bluetoothSerial.write(seed); // prints data to transmit pin as raw bytes (unnecessary?)
    bluetoothSerial.println(seed); // prints data to the transmit pin (send to server)
    Serial.println(seed); // prints to the Arduino Serial Monitor 
    delay(1000); // delay(10) appears to be commonly used after a transmitting/reading data
  }
}

