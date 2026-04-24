#include <WiFiManager.h>
#include <WiFi.h>
#include <WebSocketsClient.h> 
#include <ArduinoJson.h>
#include <Wire.h>
#include <ADXL345.h>
#include <TinyGPSPlus.h>

#define SSID "demo"
#define PASSWORD "12345678"

String wsHost = "192.168.137.1";
int wsPort = 8000;
String wsUrl = "/ws";

#define ADXL_ADDRESS 0x53
#define RX_PIN 4
#define TX_PIN 5

const unsigned long SEND_INTERVAL = 1000;  
const unsigned long SAMPLE_INTERVAL = 20;  

#define SHORT_WINDOW 20 
#define LONG_WINDOW 80 

double shortBuffer[SHORT_WINDOW];
double longBuffer[LONG_WINDOW];

int shortIndex = 0;
int longIndex = 0;

const double THRESH_TOPPLE_Z = -0.7;             
const unsigned long TOPPLE_CONFIRM_TIME = 500;  

const double THRESH_COLLISION_MAG = 2.8;    
const double THRESH_COLLISION_JERK = 1.5;   
const unsigned long COLLISION_SUSTAIN = 1000; 

const double THRESH_RASH_DELTA = 0.8;       
const double THRESH_RASH_JERK = 0.6;        
const unsigned long RASH_SUSTAIN = 1000;    

const unsigned long TOW_SUSTAIN = 1000;     

bool possibleTopple = false;
unsigned long toppleStartTime = 0;

bool possibleTowTilt = false;               
unsigned long tiltStartTime = 0;            

unsigned long collisionTimer = 0; 
unsigned long rashTimer = 0;                
unsigned long towTimer = 0;                 

String lastEventSent = "normal";

WiFiManager wm;
WebSocketsClient webSocket;
ADXL345 accel(ADXL_ADDRESS);
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);

double x = 0, y = 0, z = 0, lat = 0, lon = 0, speed = 0;
double prevMagnitude = 1.0; 
double prevX = 0, prevY = 0;                
unsigned long lastSend = 0;
unsigned long lastSample = 0;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.printf("[WS] Connected to Server!\n");
      break;
  }
}

void setup() {
  Serial.begin(9600);

  bool res = wm.autoConnect(SSID, PASSWORD);
  Serial.println(res ? "WiFi Connected" : "WiFi Failed");

  Wire.begin();
  if (!accel.start()) {
    Serial.println("ADXL345 not detected!");
    while (1);
  }

  gpsSerial.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);

  for (int i = 0; i < SHORT_WINDOW; i++) shortBuffer[i] = 1.0;
  for (int i = 0; i < LONG_WINDOW; i++) longBuffer[i] = 1.0;

  webSocket.begin(wsHost.c_str(), wsPort, wsUrl.c_str());
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); 
  
  Serial.println("System Ready. Starting stream...");
}

void inputHandle(){
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    input.replace(" ", "");
    input.replace("\"", "");
    
    bool configChanged = false;
    
    if (input.startsWith("wsHost=")) {
      wsHost = input.substring(7);
      configChanged = true;
      Serial.println("Updated Host: " + wsHost);
    } 
    else if (input.startsWith("wsPort=")) {
      wsPort = input.substring(7).toInt();
      configChanged = true;
      Serial.println("Updated Port: " + String(wsPort));
    } 
    else if (input.startsWith("wsUrl=")) {
      wsUrl = input.substring(6);
      configChanged = true;
      Serial.println("Updated URL: " + wsUrl);
    }

    if (configChanged) {
      Serial.println("Reconnecting WebSocket...");
      webSocket.disconnect(); 
      webSocket.begin(wsHost.c_str(), wsPort, wsUrl.c_str());
    }
  }
}
void loop() {
  inputHandle();
  unsigned long currentMillis = millis();
  webSocket.loop(); 

  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }
  
  if (gps.location.isValid() && gps.satellites.value() >= 3) {
    lat = gps.location.lat();
    lon = gps.location.lng();
  }
  
  speed = gps.speed.isValid() ? gps.speed.kmph() : 0.0;

  double magnitude = 1.0;
  double variance = 0;
  double range = 0;

  if (currentMillis - lastSample > SAMPLE_INTERVAL) {
    if (accel.update()) {
      x = accel.getX();
      y = accel.getY();
      z = accel.getZ();
    }

    magnitude = sqrt(x*x + y*y + z*z);
    
    double jerk = abs(magnitude - prevMagnitude);
    double deltaX = abs(x - prevX);
    double deltaY = abs(y - prevY);

    shortBuffer[shortIndex++] = magnitude;
    if (shortIndex >= SHORT_WINDOW) shortIndex = 0;

    longBuffer[longIndex++] = magnitude;
    if (longIndex >= LONG_WINDOW) longIndex = 0;

    // EVENT DETECTION: Instant Collision Check
    if (magnitude > THRESH_COLLISION_MAG && jerk > THRESH_COLLISION_JERK) {
      collisionTimer = currentMillis; 
    }
    // EVENT DETECTION: Instant Rash Driving Check
    else if ((currentMillis - collisionTimer > COLLISION_SUSTAIN) && 
            ((deltaX > THRESH_RASH_DELTA || deltaY > THRESH_RASH_DELTA) && jerk > THRESH_RASH_JERK)) {
      rashTimer = currentMillis;
    }

    prevMagnitude = magnitude; 
    prevX = x;
    prevY = y;
    lastSample = currentMillis;
  }

  double mean = 0;
  for (int i = 0; i < SHORT_WINDOW; i++) mean += shortBuffer[i];
  mean /= SHORT_WINDOW;
  
  for (int i = 0; i < SHORT_WINDOW; i++) variance += pow(shortBuffer[i] - mean, 2);
  variance /= SHORT_WINDOW;

  double minVal = longBuffer[0], maxVal = longBuffer[0];
  for (int i = 1; i < LONG_WINDOW; i++) {
    if (longBuffer[i] < minVal) minVal = longBuffer[i];
    if (longBuffer[i] > maxVal) maxVal = longBuffer[i];
  }
  range = maxVal - minVal;

  String currentEvent = "normal";

  // EVENT DETECTION: Tow Check
  bool isTilted = (abs(z) < 0.75 && abs(z) > 0.2); 
  
  if (isTilted) {
    if (!possibleTowTilt) {
      possibleTowTilt = true;
      tiltStartTime = currentMillis; 
    }
  } else {
    possibleTowTilt = false; 
  }

  if (possibleTowTilt && (currentMillis - tiltStartTime > 500)) {
    if (variance < 0.02 && range > 0.05 && range < 0.8) {
      towTimer = currentMillis;
    }
  }

  // EVENT DETECTION: Tow Evaluation
  if (towTimer != 0 && currentMillis - towTimer < TOW_SUSTAIN) {
    currentEvent = "tow";
  }

  // EVENT DETECTION: Rash Driving Evaluation (Overrides Tow)
  if (rashTimer != 0 && currentMillis - rashTimer < RASH_SUSTAIN) {
    currentEvent = "rash_driving";
  }

  // EVENT DETECTION: Collision Evaluation (Overrides Rash Driving)
  if (collisionTimer != 0 && currentMillis - collisionTimer < COLLISION_SUSTAIN) {
    currentEvent = "collision";
  }

  // EVENT DETECTION: Toppling Evaluation (Overrides Collision)
  if (z < THRESH_TOPPLE_Z) {
    if (!possibleTopple) {
      possibleTopple = true;
      toppleStartTime = currentMillis;
    } 
    else if (currentMillis - toppleStartTime > TOPPLE_CONFIRM_TIME) {
      currentEvent = "toppling";
    }
  } else if (z > -0.2) {
    possibleTopple = false;
  }

  if (currentMillis - lastSend > SEND_INTERVAL || currentEvent != lastEventSent) {
    
    StaticJsonDocument<256> doc;
    doc["x"] = x;
    doc["y"] = y;
    doc["z"] = z;
    doc["lat"] = lat;
    doc["lon"] = lon;
    doc["event"] = currentEvent; 
    doc["speed"] = speed;

    String jsonData;
    serializeJson(doc, jsonData);
    webSocket.sendTXT(jsonData);

    Serial.print("Sent: ");
    Serial.println(jsonData);

    lastSend = currentMillis;
    lastEventSent = currentEvent; 
  }
}