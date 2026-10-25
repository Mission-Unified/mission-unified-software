import asyncio
import base64
import os
import cv2
import torch
import time
import math
from datetime import datetime, timezone

from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

from app.api.websocket import broadcast_vision
from app.services.geolocation_service import GeolocationService
from app.core.state_manager import state
# ---------------- CONFIG ----------------

PIXEL_TO_METER = 0.05
DIRECTION_THRESHOLD = 3

MODEL_NAME = "yolo11n.pt"
# Video arrives from the RunCam WiFiLink 2 over its own wifi network. 192.168.1.10 is
# the module's default address and root/12345 its default login, both published by
# RunCam, so change them on the device before flying on a shared network.
# Set the STREAM_SOURCE environment variable to use a file, another camera, or a
# local webcam index instead of editing this line.
STREAM_SOURCE = os.environ.get("STREAM_SOURCE", "rtsp://root:12345@192.168.1.10/stream=0")

IMG_SIZE = 320
FRAME_WIDTH = 640
FRAME_HEIGHT = 360

CONF = 0.35
JPEG_QUALITY = 60

# Run YOLO every frame
DETECTION_INTERVAL = 1

ALLOWED_CLASSES = [0, 1, 2, 3, 5, 7]


# ---------------- INIT ----------------

model = YOLO(MODEL_NAME)

USE_CUDA = torch.cuda.is_available()

DEVICE = 0 if USE_CUDA else "cpu"

print("CUDA:", USE_CUDA)

if USE_CUDA:
    print("GPU:", torch.cuda.get_device_name(0))
    model.to("cuda")
    model.model.half()
    print("✅ YOLO running on CUDA")
else:
    print("⚠️ YOLO running on CPU")


# FP16 acceleration
USE_HALF = USE_CUDA


# Warmup GPU
if USE_CUDA:
    dummy = torch.zeros(
        (1, 3, IMG_SIZE, IMG_SIZE),
        device="cuda"
    )

    with torch.inference_mode():
        model(
            dummy,
            verbose=False
        )

    torch.cuda.empty_cache()

    print("✅ CUDA warmup complete")


# ---------------- DEEPSORT + RE-ID ----------------

tracker = DeepSort(
    max_age=60,
    n_init=5,
    max_iou_distance=0.6,

    # Lightweight Re-ID
    embedder="mobilenet",
    bgr=True,
    embedder_gpu=USE_CUDA,

    # Appearance matching
    max_cosine_distance=0.25,

    # Keep appearance memory
    nn_budget=200
)


class VisionService:

    def __init__(self):
        self.running = False
        self.track_history = {}
        self.geo = GeolocationService()

    async def start(self):

        self.running = True

        # a bare number means a locally attached camera, anything else is a path or URL
        source = int(STREAM_SOURCE) if STREAM_SOURCE.isdigit() else STREAM_SOURCE
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            print("❌ Cannot open video stream")
            return

        print("✅ Vision Service Started")

        frame_count = 0

        last_fps_time = time.time()
        fps_counter = 0
        fps = 0

        cached_detections = []
        class_names = model.names

        infer_ms = 0.0

        while self.running:

            ret, frame = cap.read()

            if not ret:
                print("🔁 Restarting video...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = cv2.resize(
                frame,
                (FRAME_WIDTH, FRAME_HEIGHT),
                interpolation=cv2.INTER_LINEAR
            )

            frame_count += 1

            # ----------------------------------
            # YOLO DETECTION
            # ----------------------------------

            if frame_count % DETECTION_INTERVAL == 0:

                start = time.perf_counter()

                with torch.inference_mode():

                    results = model.predict(
                        source=frame,
                        imgsz=IMG_SIZE,
                        device=DEVICE,
                        conf=CONF,
                        verbose=False
                    )[0]

                infer_ms = (
                    time.perf_counter() - start
                ) * 1000

                print(
                    f"YOLO: {infer_ms:.1f}ms | "
                    f"Detections: {len(results.boxes)} | "
                    f"GPU:{USE_CUDA}"
                )

                cached_detections = []

                if results.boxes is not None:

                    boxes = results.boxes.xyxy.cpu().numpy()
                    confs = results.boxes.conf.cpu().numpy()
                    classes = (
                        results.boxes.cls.cpu()
                        .numpy()
                        .astype(int)
                    )

                    for box, conf, cls in zip(
                        boxes,
                        confs,
                        classes
                    ):

                        if cls not in ALLOWED_CLASSES:
                            continue

                        x1, y1, x2, y2 = map(int, box)

                        cached_detections.append(
                            (
                                [x1, y1, x2 - x1, y2 - y1],
                                float(conf),
                                class_names[cls]
                            )
                        )

            # ----------------------------------
            # TRACKING + RE-ID
            # ----------------------------------

            tracks = tracker.update_tracks(
                cached_detections,
                frame=frame
            )

            objects = []

            for tr in tracks:
            
                telemetry = state.telemetry

                if not tr.is_confirmed():
                    continue

                l, t, r, b = map(int, tr.to_ltrb())

                conf = getattr(tr, "det_conf", None)

                cls = getattr(
                    tr,
                    "det_class",
                    "unknown"
                )

                center_x = (l + r) / 2
                center_y = (t + b) / 2

                geo = self.geo.compute(
                    center_x,
                    center_y,
                    telemetry
                )

                if geo is None:
                    geo = {
                        "latitude": None,
                        "longitude": None,
                        "groundDistance_m": None,
                        "bearing_deg": None,
                        "localizationError_m": None,
                    }

                velocity_px_s = 0.0
                velocity_mps = 0.0
                direction = "STATIONARY"

                current_time = time.time()

                if tr.track_id in self.track_history:

                    prev = self.track_history[tr.track_id]

                    dx = center_x - prev["x"]
                    dy = center_y - prev["y"]

                    dt = max(
                        current_time - prev["time"],
                        0.001
                    )

                    pixel_distance = math.sqrt(
                        dx * dx + dy * dy
                    )

                    velocity_px_s = pixel_distance / dt

                    velocity_mps = (
                        pixel_distance *
                        PIXEL_TO_METER
                    ) / dt

                    direction = self.get_direction(
                        dx,
                        dy
                    )

                self.track_history[tr.track_id] = {
                    "x": center_x,
                    "y": center_y,
                    "time": current_time
                }

                embedding_distance = getattr(
                    tr,
                    "cosine_distance",
                    None
                )

                reid_confidence = self.get_reid_confidence(
                    tr
                )
                
                objects.append({
                    "id": str(tr.track_id),
                    "trackId": str(tr.track_id),

                    "class": str(cls),

                    "confidence": (
                        float(conf)
                        if conf is not None
                        else 0.0
                    ),

                    "bbox": [l, t, r, b],

                    "latitude": geo["latitude"],

                    "longitude": geo["longitude"],

                    "groundDistance_m": geo["groundDistance_m"],

                    "bearing_deg": geo["bearing_deg"],

                    "localizationError_m": geo["localizationError_m"],

                    "timestamp": datetime.now(timezone.utc).isoformat(),

                    "trackAge": getattr(tr, "age", 0),

                    "hits": getattr(tr, "hits", 0),

                    "timeSinceUpdate": getattr(
                        tr,
                        "time_since_update",
                        0
                    ),

                    "velocityPxPerSec": round(
                        velocity_px_s,
                        2
                    ),

                    "velocity": round(
                        velocity_mps,
                        2
                    ),

                    "velocityUnit": "m/s",

                    "direction": direction,

                    "embeddingDistance": (
                        round(embedding_distance, 4)
                        if embedding_distance is not None
                        else None
                    ),

                    "reidConfidence": reid_confidence,
                })

            active_tracks = len(objects)

            lost_tracks = sum(
                1
                for t in tracker.tracker.tracks
                if t.time_since_update > 0
            )

            trackingStats = {
                "activeTracks": active_tracks,
                "lostTracks": lost_tracks,
                "reidEnabled": True,
                "detectionInterval": DETECTION_INTERVAL,
            }
            # ----------------------------------
            # JPEG ENCODE
            # ----------------------------------

            success, buffer = cv2.imencode(
                ".jpg",
                frame,
                [
                    cv2.IMWRITE_JPEG_QUALITY,
                    JPEG_QUALITY
                ]
            )

            if not success:
                continue

            frame_b64 = base64.b64encode(
                buffer
            ).decode("utf-8")

            # ----------------------------------
            # FPS CALCULATION
            # ----------------------------------

            fps_counter += 1

            elapsed = (
                time.time()
                - last_fps_time
            )

            if elapsed >= 1.0:

                fps = fps_counter

                fps_counter = 0
                last_fps_time = time.time()

                print(
                    f"FPS: {fps} | "
                    f"Objects: {len(objects)}"
                )

            # ----------------------------------
            # SEND TO DASHBOARD
            # ----------------------------------

            payload = {
                "timestamp": datetime.now(timezone.utc).isoformat(),

                "objects": objects,
                "count": len(objects),

                "trackingStats": trackingStats,

                "width": FRAME_WIDTH,
                "height": FRAME_HEIGHT,

                "fps": fps,
                "inference_ms": round(infer_ms, 1),

                "frame": frame_b64,
            }

            await broadcast_vision(
                payload
            )

            await asyncio.sleep(0)

        cap.release()

    def get_direction(self, dx, dy):

        horizontal = ""
        vertical = ""

        if dx > DIRECTION_THRESHOLD:
            horizontal = "EAST"
        elif dx < -DIRECTION_THRESHOLD:
            horizontal = "WEST"

        if dy > DIRECTION_THRESHOLD:
            vertical = "SOUTH"
        elif dy < -DIRECTION_THRESHOLD:
            vertical = "NORTH"

        if not horizontal and not vertical:
            return "STATIONARY"

        if horizontal and vertical:
            return f"{vertical}-{horizontal}"

        return horizontal or vertical


    def get_reid_confidence(self, track):

        cosine_distance = getattr(
            track,
            "cosine_distance",
            None
        )

        if cosine_distance is not None:
            return round(
                max(0.0, min(1.0, 1.0 - cosine_distance)),
                3
            )

        hits = getattr(track, "hits", 0)

        return round(
            min(hits / 20.0, 1.0),
            3
        )

    def stop(self):
        self.running = False