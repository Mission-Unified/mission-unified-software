from fastapi import FastAPI, WebSocket
import asyncio, json
import app.core.command_manager as cm

from app.core.serial_manager import SerialManager
from app.core.command_manager import init_command_manager
from app.core.parser import *
from app.core.state_manager import state
from app.api.websocket import *
from app.api.routes import router
from app.input.controller import PS4Controller
from app.services.vision_service import VisionService
from fastapi.middleware.cors import CORSMiddleware

# ---------------- SERIAL HANDLER ----------------
async def handle_serial(line):
    try:
        data = json.loads(line)
    except Exception:
        return

    try:
        parsed = {
            "flightController": parse_fc(data.get("fc", "")),
            "environment": parse_eib(data.get("eib", "")),
            "status": parse_se(data.get("se", "")),
            "link": data.get("link", {})
        }

        state.update_telemetry(parsed)
        if command_manager:
            command_manager.update_status(
                parsed["status"]
            )

        state.update_telemetry(parsed)
        await broadcast_telemetry({
            "telemetry": parsed
        })

    except Exception as e:
        print("Telemetry Parse Error:", e)

# ---------------- APP INIT ----------------
vision_service = VisionService()
app = FastAPI()
app.include_router(router)

serial = SerialManager()
serial.start()

command_manager = init_command_manager(serial)
print("MAIN CMD MANAGER =", command_manager)
print("CM MODULE ID =", id(cm))
print("CM VAR =", cm.command_manager)

# 🔥 NOW THIS WORKS
serial.set_callback(handle_serial)


# ---------------- WEBSOCKETS ----------------
@app.websocket("/ws/telemetry")
async def ws_telemetry(ws: WebSocket):
    print(">>> TELEMETRY WS CONNECT ATTEMPT")
    await connect_telemetry(ws)

@app.websocket("/ws/vision")
async def ws_vision(ws: WebSocket):
    print(">>> VISION WS CONNECT ATTEMPT")
    await connect_vision(ws)

@app.get("/test")
async def test():
    await broadcast_telemetry({
        "telemetry": {
            "battery": {"voltage": 12.5},
            "status": {"ugvMode": "MANUAL"}
        }
    })

    return {"ok": True}

@app.get("/vision-test")
async def vision_test():

    await broadcast_vision({
        "target": "person",
        "confidence": 0.92,
        "x": 320,
        "y": 180
    })

    return {"ok": True}

# ---------------- STARTUP ----------------
@app.on_event("startup")
async def startup():
    controller = PS4Controller(command_manager.send)
    asyncio.create_task(controller.listen())

    asyncio.create_task(vision_service.start())

for r in app.routes:
    print(type(r))

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)