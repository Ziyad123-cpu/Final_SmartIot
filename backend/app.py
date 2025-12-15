from flask import Flask, jsonify
import threading
import json
import paho.mqtt.client as mqtt
import sqlite3
from datetime import datetime

app = Flask(__name__)

# --------------------------
# Variabel penyimpanan data
# --------------------------
latest_data = {
    "moisturePercent": 0,
    "soilTemperature": 0,
    "suhuUdara": 0,
    "kelembapanUdara": 0,
    "mode": "AUTO",
    "pumpState": "MATI"
}

# --------------------------
# DATABASE CONFIG
# --------------------------
DB_NAME = "data.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT,
            hari TEXT,
            waktu TEXT,
            moisture REAL,
            soil_temp REAL,
            air_temp REAL,
            air_hum REAL,
            pump_state TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

def save_to_db(data):
    now = datetime.now()
    tanggal = now.strftime("%d-%m-%Y")
    hari = now.strftime("%A")
    waktu = now.strftime("%H:%M:%S")

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sensor_log (
            tanggal, hari, waktu,
            moisture, soil_temp, air_temp, air_hum, pump_state
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tanggal,
        hari,
        waktu,
        data.get("moisturePercent", 0),
        data.get("soilTemperature", 0),
        data.get("suhuUdara", 0),
        data.get("kelembapanUdara", 0),
        data.get("pumpState", "MATI")
    ))
    conn.commit()
    conn.close()

# --------------------------
# MQTT CONFIG
# --------------------------
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "irigasi/sensor"

client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    print("MQTT Connected:", rc)
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    global latest_data
    try:
        payload = msg.payload.decode()
        data = json.loads(payload)
        latest_data = data

        save_to_db(data)

        print("Data diterima & disimpan:", latest_data)
    except Exception as e:
        print("Error decode:", e)

client.on_connect = on_connect
client.on_message = on_message

# Jalankan MQTT Loop pada thread terpisah
def mqtt_thread():
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()

threading.Thread(target=mqtt_thread, daemon=True).start()

# --------------------------
# API ENDPOINT
# --------------------------
@app.get("/sensor")
def get_sensor():
    return jsonify(latest_data)

@app.get("/get_data")
def get_data():
    return jsonify(latest_data)

@app.get("/")
def home():
    return "MQTT Flask Backend Running"

# --------------------------
# RUN FLASK
# --------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
