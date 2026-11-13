
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_SHT31.h>
#include <math.h>
#include "secrets.h"
// =====================================
// WIFI
// =====================================
const char* WIFI_SSID = SECRET_WIFI_SSID;
const char* WIFI_PASSWORD = SECRET_WIFI_PASSWORD;

// =====================================
// MQTT
// =====================================
const char* MQTT_SERVER = SECRET_MQTT_SERVER;
const int MQTT_PORT = 1883;
const char* MQTT_USER = SECRET_MQTT_USER;
const char* MQTT_PASSWORD = SECRET_MQTT_PASSWORD;

const char* TOPIC_DHT11 = "iot04/sensors/dht11";
const char* TOPIC_SHT30 = "iot04/sensors/sht30";

// =====================================
// SENSOR
// =====================================
#define DHTPIN 4
#define DHTTYPE DHT11

#define SHT_SDA 21
#define SHT_SCL 22

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SHT31 sht30 = Adafruit_SHT31();

WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool sht30Connected = false;

unsigned long lastPublish = 0;
unsigned long lastMqttAttempt = 0;

const unsigned long PUBLISH_INTERVAL = 5000;
const unsigned long MQTT_RETRY_INTERVAL = 5000;

// =====================================
// WIFI CONNECTION
// =====================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.println("[WIFI] Connecting...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// =====================================
// MQTT CONNECTION
// =====================================

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (mqttClient.connected()) {
    return;
  }

  if (millis() - lastMqttAttempt < MQTT_RETRY_INTERVAL) {
    return;
  }

  lastMqttAttempt = millis();

  Serial.println("[MQTT] Connecting...");

  String clientId = "IOT04_ESP32_";
  clientId += WiFi.macAddress();
  clientId.replace(":", "");

  if (mqttClient.connect(
        clientId.c_str(),
        MQTT_USER,
        MQTT_PASSWORD
      )) {
    Serial.println("[MQTT] Connected!");
  } else {
    Serial.print("[MQTT] Failed, state = ");
    Serial.println(mqttClient.state());
  }
}


// =====================================
// PUBLISH SENSOR DATA
// =====================================
void publishSensor(
  const char* topic,
  const char* sensorName,
  float temperature,
  float humidity
) {
  if (isnan(temperature) || isnan(humidity)) {
    Serial.print("[ERROR] Invalid data: ");
    Serial.println(sensorName);
    return;
  }

  char payload[160];

  snprintf(
    payload,
    sizeof(payload),
    "{\"sensor\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f}",
    sensorName,
    temperature,
    humidity
  );

  Serial.print("[DATA] ");
  Serial.println(payload);

  if (mqttClient.connected()) {
    bool success = mqttClient.publish(topic, payload);

    if (success) {
      Serial.print("[MQTT] Published: ");
      Serial.println(topic);
    } else {
      Serial.println("[MQTT] Publish failed!");
    }
  } else {
    Serial.println("[MQTT] Not connected, data not sent");
  }
}

// =====================================
// SETUP
// =====================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println("=================================");
  Serial.println(" IOT04 - ESP32 MQTT MONITORING");
  Serial.println("=================================");

  // DHT11
  dht.begin();

  // SHT30
  Wire.begin(SHT_SDA, SHT_SCL);

  sht30Connected = sht30.begin(0x44);

  if (!sht30Connected) {
    sht30Connected = sht30.begin(0x45);
  }

  if (sht30Connected) {
    Serial.println("[OK] SHT30 connected");
  } else {
    Serial.println("[ERROR] SHT30 not found");
  }

  // MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

  // WiFi
  connectWiFi();

  Serial.println("[SYSTEM] Setup completed");
}

// =====================================
// LOOP
// =====================================
void loop() {

  // WiFi reconnect
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWiFiAttempt = 0;

    if (millis() - lastWiFiAttempt >= 10000) {
      lastWiFiAttempt = millis();
      connectWiFi();
    }
  }

  // MQTT reconnect
  connectMQTT();

  if (mqttClient.connected()) {
    mqttClient.loop();
  }

  // Publish every 5 seconds
  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = millis();

    Serial.println();
    Serial.println("=================================");
    Serial.println(" SENSOR READINGS");
    Serial.println("=================================");

    // DHT11
    float dhtTemp = dht.readTemperature();
    float dhtHum = dht.readHumidity();

    publishSensor(
      TOPIC_DHT11,
      "DHT11",
      dhtTemp,
      dhtHum
    );

    // SHT30
    if (!sht30Connected) {
      sht30Connected = sht30.begin(0x44);

      if (!sht30Connected) {
        sht30Connected = sht30.begin(0x45);
      }
    }

    if (sht30Connected) {
      float shtTemp = sht30.readTemperature();
      float shtHum = sht30.readHumidity();

      publishSensor(
        TOPIC_SHT30,
        "SHT30",
        shtTemp,
        shtHum
      );
    } else {
      Serial.println("[ERROR] SHT30 unavailable");
    }

    Serial.println("=================================");
  }
}
