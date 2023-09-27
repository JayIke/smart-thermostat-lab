#include <DallasTemperature.h>
#include "SevSeg.h"
#include <SoftwareSerial.h>

#define ONE_WIRE_BUS A0
#define BUTTON_PIN A1

// Haven't tried analog pins for bluetooth, switch to digital if no luck
#define RxPin A2 
#define TxPin A3

SoftwareSerial bluetoothSerial(RxPin,TxPin) // RxPin --> TxD (BT) / TxPin --> RxD
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

DeviceAddress insideThermometer = {0x28, 0xFD, 0xDB, 0x81, 0xE3, 0x38, 0x3C, 0x3B};
SevSeg sevseg;

unsigned long lastTemperatureUpdate = 0; // Last temp corresponding to real system time for last 
unsigned long temperatureUpdateInterval = 1000; // 1 second temp poll rate and display interval
float tempC = 0; // Global float variable to store temp values 

void setup() {
  bool resistorsOnSegments = false; // 'false' means resistors are on digit pins
  bool updateWithDelays = true;     // Default 'false' is Recommended
  bool leadingZeros = false;        // Use 'true' if you'd like to keep the leading zeros
  bool disableDecPoint = false;     // Use 'true' if your decimal point doesn't exist or isn't connected
  byte numDigits = 4; 
  byte digitPins[] = {10, 12, 11, 13};
  byte segmentPins[] = {9, 8, 7, 6, 5, 4, 3, 2}; // Includes decimal point
  sevseg.begin(COMMON_CATHODE, numDigits, digitPins, segmentPins, resistorsOnSegments,
               updateWithDelays, leadingZeros, disableDecPoint);
  sevseg.setBrightness(60);

  pinMode(BUTTON_PIN, INPUT_PULLUP); // Set the button pin as input with internal pull-up resistor

  Serial.begin(9600);
  Serial.println("Serial begin...");
  bluetoothSerial.begin(9600);
  Serial.println("SoftwareSerial (bluetooth) begin...")
  sensors.begin();
  Serial.println("Sensors begin...");
  sensors.setResolution(10); // Resolution range is 9-12 (bits)
  sensors.requestTemperatures(); // Writes to Temp Sense control register to readback current temp
  Serial.println("Requesting temperatures...")
}

void loop() {
  unsigned long currentMillis = millis();
  bool buttonState = digitalRead(BUTTON_PIN);

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

    // Update temperature reading
    sensors.requestTemperatures();
    tempC = sensors.getTempC(insideThermometer);

    // int seed = random(100, 259); // Generate a random seed (replace with temp data)
    // bluetoothSerial.write(seed); // prints data to transmit pin as raw bytes (unnecessary?)

    Serial.print("Sent to server: ");
    Serial.println(tempC);
    bluetoothSerial.println(tempC); // prints data to the transmit pin (send to server)
    Serial.println(tempC); // prints to the Arduino Serial Monitor 
    delay(10); // delay(10) appears to be commonly used after a transmitting/reading data
  }

  // Check if the button is pressed
  if (buttonState == LOW) {
    // Button is pressed, display the current temperature
    if (currentMillis - lastTemperatureUpdate >= temperatureUpdateInterval) {
      lastTemperatureUpdate = currentMillis;

      // Update temperature reading
      sensors.requestTemperatures();
      tempC = sensors.getTempC(insideThermometer);
      sevseg.setNumber(tempC * 10, 1);
    }
  } else {
    // Button is not pressed, turn off the display
    sevseg.blank();
  }

  // Must be used at the end of conditionals to keep 
  sevseg.refreshDisplay();
}
