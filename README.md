# Mission Unified: ground station software

This is the software behind a UAV-UGV surveillance platform, a quadcopter bolted to a
two-wheel chassis that drives and flies without folding or docking. A Python service reads
telemetry over a serial link, runs detection and tracking on the video feed, turns each
detection into a ground coordinate, and a React dashboard shows all of it live.

Built for a B.Eng final-year project at the Air Force Institute of Technology, Kaduna. The
build itself is filmed in
[MISSION UNIFIED | The Engineering Documentary](https://www.youtube.com/playlist?list=PLYnxBdsCVqNE).

![The vision page: detections with identity-stable tracking](docs/dashboard-vision.jpg)

![The telemetry page: battery, voltage, temperature, humidity and link quality](docs/dashboard-telemetry.png)

## What it does

Telemetry comes in over serial, one JSON line per frame, and gets split into flight
controller, environment and status blocks. Video comes in over the RunCam WiFiLink 2. YOLO
finds objects in each frame and DeepSORT keeps an identity on them, so a target that moves
across the frame stays the same target. For each detection, the pixel position is converted
to a latitude and longitude using the camera matrix, the camera's mounting angles and the
platform's attitude and altitude. Telemetry and annotated frames go out to the browser over
two websockets, and commands come back from the dashboard or a PS4 controller.

## Layout

| Path | What lives there |
|---|---|
| `backend/app/main.py` | FastAPI app, serial reader, telemetry broadcast |
| `backend/app/core/` | Serial handling, telemetry parsing, shared state, command dispatch |
| `backend/app/services/vision_service.py` | Detection, tracking, frame publishing |
| `backend/app/services/geolocation_service.py` | Pixel to ground coordinate conversion |
| `backend/app/config/geolocation.py` | Camera matrix, distortion coefficients, mount angles |
| `backend/app/api/` | `POST /command`, plus the `/ws/telemetry` and `/ws/vision` sockets |
| `backend/app/input/controller.py` | PS4 controller input |
| `frontend/src/pages/` | Home, Overview, Telemetry, Vision, Sensors, Mission, Logs, Settings |

## Running it

Python 3.10 or later, Node 20 or later. A CUDA GPU is optional, though the vision pipeline
is much happier with one.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

That serves on `http://127.0.0.1:8000`. In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

That serves on `http://localhost:3000`.

## Video source

The vision pipeline reads from the RunCam WiFiLink 2 by default, at
`rtsp://root:12345@192.168.1.10/stream=0`. That address and login are RunCam's published
defaults, documented in
[their RTSP guide](https://support.runcam.com/hc/en-us/articles/33979059651991-How-to-set-RTSP-stream-for-WiFiLink-2),
so change the password on the module if it ever shares a network with anything you care
about.

Point it somewhere else with an environment variable, no code edit needed:

```bash
STREAM_SOURCE="my-test-clip.mp4" python run.py   # a file
STREAM_SOURCE=0 python run.py                    # a webcam attached to the laptop
```

## Running it without the vehicle

Set `VITE_MOCK_DATA=true` in `frontend/.env` and the dashboard runs on generated telemetry
with nothing plugged in. Pair that with a video file in `STREAM_SOURCE` and the whole stack
runs on a desk.

## Two things to change for your own hardware

The camera calibration in `backend/app/config/geolocation.py` holds the camera matrix,
distortion coefficients and mounting angles measured for this build's camera. Every
coordinate the system produces depends on those numbers. Use your own, or the localization
will be confidently wrong.

The parser in `backend/app/core/parser.py` expects the field layout this vehicle's flight
controller sends. A different controller means rewriting that file.

## Model weights

None are stored here. `yolo11n.pt` downloads on first run. Change `MODEL_NAME` in
`vision_service.py` for a different checkpoint.

## Licence

The code is MIT licensed, see [LICENSE](LICENSE).

Two dependencies carry their own terms and neither ships inside this repository.
Ultralytics, which provides YOLO, is AGPL-3.0: installing it and running this code is fine,
but if you build on this and distribute the result, read that licence first, because it
reaches further than MIT does. Ultralytics sells a commercial licence for cases where it
does not suit. deep-sort-realtime is MIT.

## Credits

Built by John Obaloluwa Ayodele and the Mission Unified team, Department of Aerospace
Engineering, Faculty of Air Engineering, Air Force Institute of Technology, Kaduna.
Supervised by Engr Rexcharles Enyinna Donatus.

Project overview, photographs and the documentary:
[Mission-Unified/mission-unified](https://github.com/Mission-Unified/mission-unified).
