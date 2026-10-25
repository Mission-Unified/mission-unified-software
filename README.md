# Mission Unified — ground station software

Ground station for a UAV-UGV surveillance platform: a quadcopter bolted to a two-wheel
chassis that drives and flies without folding or docking. This repository holds the
software that talks to it — a Python service that reads telemetry over a serial link,
runs detection and tracking on the video feed, turns each detection into a ground
coordinate, and a React dashboard that shows all of it live.

Built for a B.Eng final-year project at the Air Force Institute of Technology, Kaduna.
The build itself is documented in
[MISSION UNIFIED | The Engineering Documentary](https://www.youtube.com/playlist?list=PLYnxBdsCVqNE).

![The vision page: detections with identity-stable tracking](docs/dashboard-vision.jpg)

![The telemetry page: battery, voltage, temperature, humidity and link quality](docs/dashboard-telemetry.png)

## What it does

- Reads telemetry from the vehicle over serial, one JSON line per frame, and parses the
  flight controller, environment and status blocks out of it.
- Runs YOLO detection and DeepSORT tracking on the video feed, so an object keeps the same
  identity from frame to frame.
- Converts a detection's pixel position to a latitude and longitude, using the camera
  matrix, the camera's mounting angles and the platform's attitude and altitude.
- Pushes telemetry and annotated frames to the browser over two websockets.
- Accepts commands back, from the dashboard or from a PS4 controller.

## Layout

| Path | What lives there |
|---|---|
| `backend/app/main.py` | FastAPI app, serial reader, telemetry broadcast |
| `backend/app/core/` | Serial port handling, telemetry parsing, shared state, command dispatch |
| `backend/app/services/vision_service.py` | YOLO detection, DeepSORT tracking, frame publishing |
| `backend/app/services/geolocation_service.py` | Pixel to ground coordinate conversion |
| `backend/app/config/geolocation.py` | Camera matrix, distortion coefficients, mount angles |
| `backend/app/api/` | `POST /command`, and the `/ws/telemetry` and `/ws/vision` sockets |
| `backend/app/input/controller.py` | PS4 controller input |
| `frontend/src/pages/` | Home, Overview, Telemetry, Vision, Sensors, Mission, Logs, Settings |

## Running it

You need Python 3.10 or later and Node 20 or later. An NVIDIA GPU is optional but the
vision pipeline is far happier with one.

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

It serves on `http://127.0.0.1:8000`.

Frontend, in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

It serves on `http://localhost:3000`.

## Running it without the vehicle

Set `VITE_MOCK_DATA=true` in `frontend/.env` and the dashboard runs on generated telemetry,
with no serial link attached.

The vision pipeline reads from the path in `STREAM_SOURCE` at the top of
`backend/app/services/vision_service.py`. Test footage is not in this repository, so point
it at your own video file or at a camera index before starting the backend. Drop a clip in
`backend/videos/` if you want to keep the original layout.

## Two things to change for your own hardware

**Camera calibration.** `backend/app/config/geolocation.py` carries the camera matrix,
distortion coefficients and mount angles measured for this build's camera. Every ground
coordinate the system produces depends on them. Use your own calibration or the
localization will be confidently wrong.

**Telemetry format.** The parser in `backend/app/core/parser.py` expects the field layout
this vehicle's flight controller sends. A different controller means rewriting that file.

## Model weights

None are stored here. `yolo11n.pt` is fetched on first run. Set `MODEL_NAME` in
`vision_service.py` to use a different checkpoint.

## Licence

The code in this repository is MIT licensed — see [LICENSE](LICENSE).

Two dependencies carry their own terms, and neither ships inside this repository:

- **Ultralytics**, which provides YOLO, is AGPL-3.0. Installing it and running this code is
  fine. If you build on it and distribute the result, read that licence first, because it
  reaches further than MIT does. Ultralytics sells a commercial licence for cases where it
  does not suit.
- **deep-sort-realtime** is MIT.

## Credits

Built by John Obaloluwa Ayodele and the Mission Unified team, Department of Aerospace
Engineering, Faculty of Air Engineering, Air Force Institute of Technology, Kaduna.
Supervised by Engr Rexcharles Enyinna Donatus.

Project overview, photographs and the documentary:
[Mission-Unified/mission-unified](https://github.com/Mission-Unified/mission-unified).
