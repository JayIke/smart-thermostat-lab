#include <SoftwareSerial.h>

SoftwareSerial bluetoothSerial(2, 3); // Pin map: Arduino/BT = 3/RXD,2/TXD
String input = ""; // Stores receive data from server
String output = ""; // Stores transmit data to send to server
void setup() {
  // Open serial communications:
  Serial.begin(9600);
  bluetoothSerial.begin(9600); // HC-06 default baud rate (keep)
}

void loop() {
  // Read data from Bluetooth module and send it to Serial Monitor
  if (bluetoothSerial.available()) {
    while (bluetoothSerial.available()) {
      input += bluetoothSerial.read();
      //Serial.print(c); // Print the character received
    }
    Serial.print("Received: ");
    Serial.println(input);
  }

  // Send random seed value to Bluetooth module
  if (Serial.availableForWrite()) {
    int seed = random(100, 259); // Generate a random seed
    //bluetoothSerial.write(seed); // Send the seed as a string
    bluetoothSerial.println(seed);
    //Serial.print("Sent seed: ");
    Serial.println(seed);
    delay(1000); // Delay before sending the next seed
  }
}

