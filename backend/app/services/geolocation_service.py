import math
import numpy as np

from app.config.geolocation import (
    CAMERA_MATRIX,
    DIST_COEFFS,
    CAMERA_MOUNT_PITCH,
    CAMERA_MOUNT_ROLL,
    CAMERA_MOUNT_YAW,
    GROUND_REFERENCE_FACTOR,
)


class GeolocationService:

    EARTH_RADIUS = 6378137.0
    MAX_DISTANCE_RATIO = 3.0
    MIN_Z_COMPONENT = -0.05

    def __init__(self):

        self.K = CAMERA_MATRIX

        self.dist_coeffs = DIST_COEFFS

        self.mount_pitch = CAMERA_MOUNT_PITCH
        self.mount_roll = CAMERA_MOUNT_ROLL
        self.mount_yaw = CAMERA_MOUNT_YAW

        self.calibration_factor = GROUND_REFERENCE_FACTOR

        self.K_inv = np.linalg.inv(self.K)

        self.R_mount = self.rotation_matrix(
            self.mount_roll,
            self.mount_pitch,
            self.mount_yaw
        )

    # ----------------------------------------------------
    # Rotation Matrix
    # ----------------------------------------------------
    def rotation_matrix(self, roll, pitch, yaw):

        r = math.radians(roll)
        p = math.radians(pitch)
        y = math.radians(yaw)

        Rx = np.array([
            [1, 0, 0],
            [0, math.cos(r), -math.sin(r)],
            [0, math.sin(r), math.cos(r)]
        ])

        Ry = np.array([
            [math.cos(p), 0, math.sin(p)],
            [0, 1, 0],
            [-math.sin(p), 0, math.cos(p)]
        ])

        Rz = np.array([
            [math.cos(y), -math.sin(y), 0],
            [math.sin(y), math.cos(y), 0],
            [0, 0, 1]
        ])

        return Rz @ Ry @ Rx

    # ----------------------------------------------------
    # Main Geolocation
    # ----------------------------------------------------
    def compute(self, u, v, telemetry):

        flight = telemetry.get("flightController", {})

        drone_lat = float(flight.get("latitude", 0.0))
        drone_lon = float(flight.get("longitude", 0.0))

        altitude = float(
            flight.get(
                "gpsAltitude",
                flight.get("barometerAltitude", 0.0)
            )
        )

        pitch = float(flight.get("pitch", 0.0))
        roll = float(flight.get("roll", 0.0))
        yaw = float(flight.get("yaw", 0.0))
        
        if altitude <= 0:
            return None

        # ==================================================
        # STEP 1
        # Pixel -> Camera Ray
        # ==================================================

        pixel = np.array([u, v, 1.0], dtype=np.float32)

        ray_camera = self.K_inv @ pixel

        ray_camera = ray_camera.flatten()

        ray_camera = ray_camera / np.linalg.norm(ray_camera)

        # ==================================================
        # STEP 2
        # Camera -> UAV Body Frame
        # ==================================================

        ray_body = self.R_mount @ ray_camera

        # ==================================================
        # STEP 3
        # UAV Body -> World Frame
        # ==================================================

        R_world = self.rotation_matrix(
            roll,
            pitch,
            yaw
        )

        ray_world = R_world @ ray_body

        # ==================================================
        # STEP 4
        # Ground Plane Intersection
        # ==================================================

        z_component = ray_world[2]

        if abs(z_component) < 0.05:
            return None
        
        t = -altitude / z_component
        
        if t <= 0:
            return None
        
        #print(
        #    f"ALT={altitude:.1f} "
        #    f"Z={z_component:.4f} "
        #    f"T={t:.1f}"
        #)
                
        east = ray_world[0] * t
        north = ray_world[1] * t

        # ==================================================
        # STEP 5
        # Calibration Factor
        # ==================================================

        east *= self.calibration_factor
        north *= self.calibration_factor

        # ==================================================
        # STEP 6
        # ENU Distance + Bearing
        # ==================================================

        # reject near-horizon rays
        if z_component > self.MIN_Z_COMPONENT:
            return None

        distance = math.hypot(east, north)

        # reject unreasonable intersections
        if distance > altitude * self.MAX_DISTANCE_RATIO:
            return None

        bearing = (
            math.degrees(
                math.atan2(east, north)
            ) + 360
        ) % 360

        # ==================================================
        # STEP 7
        # ENU -> WGS84
        # ==================================================

        lat_rad = math.radians(drone_lat)

        d_lat = north / self.EARTH_RADIUS

        d_lon = east / (
            self.EARTH_RADIUS *
            math.cos(lat_rad)
        )

        target_lat = drone_lat + math.degrees(d_lat)

        target_lon = drone_lon + math.degrees(d_lon)

        # ==================================================
        # STEP 8
        # Error Estimate
        # ==================================================

        hdop = float(flight.get("hdop", 1.0))

        localization_error = max(
            1.0,
            hdop * 2.5
        )

        return {

            "latitude": round(target_lat, 7),
            "longitude": round(target_lon, 7),

            "groundDistance_m": round(distance, 2),

            "bearing_deg": round(bearing, 2),

            "localizationError_m": round(
                localization_error,
                2
            ),

            "altitude": altitude,

            "pitch": pitch,
            "roll": roll,
            "yaw": yaw
        }