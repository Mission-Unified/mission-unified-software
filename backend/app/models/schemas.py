from pydantic import BaseModel
from typing import Optional


# ---------------- FC ----------------

class FlightTelemetry(BaseModel):
    latitude: float
    longitude: float

    gpsAltitude: float
    speed: float

    satellites: int
    hdop: float

    pitch: float
    roll: float
    yaw: float

    temperature: float
    pressure: float

    barometerAltitude: float

    distanceLeft: int
    distanceFront: int
    distanceRight: int


# ---------------- EIB ----------------

class EnvironmentTelemetry(BaseModel):
    temperature: Optional[float]
    humidity: Optional[float]

    irLeft: int
    irRight: int

    voltage: float
    batteryPercent: int


# ---------------- SE ----------------

class StatusTelemetry(BaseModel):
    mode: str
    ugvMode: str

    movement: str

    alert: bool

    command: str

    leftEncoder: int
    rightEncoder: int


# ---------------- LINK ----------------

class LinkTelemetry(BaseModel):
    rssi: int
    snr: float


# ---------------- ROOT ----------------

class Telemetry(BaseModel):
    flight: FlightTelemetry
    environment: EnvironmentTelemetry
    status: StatusTelemetry
    link: LinkTelemetry