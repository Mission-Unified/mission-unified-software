import math

# --------------------------------------------------
# FLIGHT CONTROLLER
# FC,LT=...,LG=...,A=...,S=...,ST=...,HD=...
# --------------------------------------------------
def parse_fc(fc: str):
    try:
        fields = {}

        for item in fc.split(",")[1:]:
            if "=" in item:
                k, v = item.split("=", 1)
                fields[k] = v

        return {
            "latitude": float(fields.get("LT", 0)),
            "longitude": float(fields.get("LG", 0)),

            "gpsAltitude": float(fields.get("A", 0)),
            "speed": float(fields.get("S", 0)),

            "satellites": int(fields.get("ST", 0)),
            "hdop": float(fields.get("HD", 0)),

            "pitch": float(fields.get("P", 0)),
            "roll": float(fields.get("R", 0)),
            "yaw": float(fields.get("Y", 0)),

            "temperature": float(fields.get("T", 0)),
            "pressure": float(fields.get("PR", 0)),

            "barometerAltitude": float(fields.get("BA", 0)),

            "distanceLeft": int(fields.get("DL", 0)),
            "distanceFront": int(fields.get("DF", 0)),
            "distanceRight": int(fields.get("DR", 0)),
        }

    except Exception as e:
        print("parse_fc error:", e)

        return {
            "latitude": None,
            "longitude": None,
            "gpsAltitude": None,
            "speed": None,
            "satellites": None,
            "hdop": None,
            "pitch": None,
            "roll": None,
            "yaw": None,
            "temperature": None,
            "pressure": None,
            "barometerAltitude": None,
            "distanceLeft": None,
            "distanceFront": None,
            "distanceRight": None
        }


# --------------------------------------------------
# ENVIRONMENT + IR + BATTERY
# EIB,temp,hum,irL,irR,voltage,battery%
# --------------------------------------------------
def parse_eib(eib: str):
    try:
        parts = eib.split(",")

        temp = float(parts[1])
        hum = float(parts[2])

        if math.isnan(temp):
            temp = None

        if math.isnan(hum):
            hum = None

        return {
            "temperature": temp,
            "humidity": hum,

            "irLeft": int(parts[3]),
            "irRight": int(parts[4]),

            "batteryVoltage": float(parts[5]),
            "batteryPercent": int(parts[6])
        }

    except Exception as e:
        print("parse_eib error:", e)

        return {
            "temperature": None,
            "humidity": None,
            "irLeft": None,
            "irRight": None,
            "batteryVoltage": None,
            "batteryPercent": None
        }


# --------------------------------------------------
# STATUS + ENCODERS
# SE,UGV,AUTO,FORWARD,0,F,1245,1238
# --------------------------------------------------
def parse_se(se: str):
    try:
        parts = se.split(",")

        return {
            "mode": parts[1],
            "ugvMode": parts[2],

            "movement": parts[3],

            "alert": parts[4] == "1",

            "command": parts[5],

            "leftEncoder": int(parts[6]),
            "rightEncoder": int(parts[7])
        }

    except Exception as e:
        print("parse_se error:", e)

        return {
            "mode": None,
            "ugvMode": None,
            "movement": None,
            "alert": False,
            "command": None,
            "leftEncoder": 0,
            "rightEncoder": 0
        }