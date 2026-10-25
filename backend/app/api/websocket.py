from fastapi import WebSocket, WebSocketDisconnect

from fastapi import WebSocket

from app.core.state_manager import state

telemetry_clients = []
vision_clients = []

async def connect_telemetry(ws):
    await ws.accept()

    telemetry_clients.append(ws)

    if state.telemetry:
        await ws.send_json({
            "telemetry": state.telemetry
        })

    print("Telemetry client connected")

    try:
        while True:
            await ws.receive_text()
    except:
        telemetry_clients.remove(ws)
        print("Telemetry client disconnected")

async def connect_vision(ws: WebSocket):
    await ws.accept()
    vision_clients.append(ws)

    try:
        while True:
            await ws.receive_text()
    except:
        vision_clients.remove(ws)

async def broadcast_telemetry(data):

    dead = []

    for ws in telemetry_clients:
        try:
            await ws.send_json(data)
        except:
            dead.append(ws)

    for ws in dead:
        telemetry_clients.remove(ws)

async def broadcast_vision(data):

    dead = []

    for ws in vision_clients:
        try:
            await ws.send_json(data)
        except:
            dead.append(ws)

    for ws in dead:
        vision_clients.remove(ws)