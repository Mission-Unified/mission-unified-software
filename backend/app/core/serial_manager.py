import serial
import threading
import asyncio
import json
import socket
import time
import random
import math

import app.config


class SerialManager:


    def __init__(
        self,
        port=app.config.SERIAL_PORT,
        baud=app.config.SERIAL_BAUD
    ):

        self.running = True
        self.callback = None


        # NodeMCU TCP FC storage
        self.node_fc = None


        # Last serial telemetry
        self.serial_data = None

        # =============================
        # Fake telemetry simulation
        # =============================
        self.fake_time = 0

        # placeholder start point for simulated telemetry, not a real test site
        self.fake_lat = 10.6000
        self.fake_lon = 7.4000

        self.fake_heading = 90.0
        self.fake_speed = 0.0

        self.fake_altitude = 4.5

        self.fake_pitch = 0.0
        self.fake_roll = 0.0
        self.fake_yaw = 90.0

        self.fake_temp = 31.5
        self.fake_pressure = 100945

        self.fake_battery = 100.0

        self.fake_left = 55
        self.fake_front = 130
        self.fake_right = 60


        try:

            self.ser = serial.Serial(
                port,
                baud,
                timeout=1
            )

            print("[SERIAL] Connected")


        except Exception as e:

            print(
                "[SERIAL] NOT CONNECTED:",
                e
            )

            self.ser = None




    def set_callback(self, callback):

        self.callback = callback





    def start(self):

        threading.Thread(
            target=self.read_loop,
            daemon=True
        ).start()


        threading.Thread(
            target=self.tcp_receiver,
            daemon=True
        ).start()


        print(
            "[SYSTEM] Serial + TCP started"
        )





    # ==================================================
    # NODEMCU TCP SERVER
    # ==================================================

    def tcp_receiver(self):

        server = socket.socket(
            socket.AF_INET,
            socket.SOCK_STREAM
        )


        server.setsockopt(
            socket.SOL_SOCKET,
            socket.SO_REUSEADDR,
            1
        )


        server.bind(
            (
                "0.0.0.0",
                8765
            )
        )


        server.listen(1)


        print(
            "[TCP] Listening on 8765"
        )



        while self.running:


            conn, addr = server.accept()


            print(
                "[TCP] NodeMCU connected:",
                addr
            )


            buffer = ""


            while self.running:


                try:


                    data = conn.recv(1024)


                    if not data:
                        break



                    buffer += data.decode()



                    while "\n" in buffer:


                        line, buffer = buffer.split(
                            "\n",
                            1
                        )


                        line=line.strip()


                        if not line:
                            continue



                        try:


                            packet=json.loads(line)



                            if "fc" in packet:


                                self.node_fc = packet["fc"]


                                print(
                                    "[NODEMCU FC]",
                                    self.node_fc
                                )



                        except Exception as e:

                            print(
                                "[TCP JSON ERROR]",
                                e
                            )



                except Exception as e:


                    print(
                        "[TCP ERROR]",
                        e
                    )

                    break



            conn.close()


            print(
                "[TCP] NodeMCU disconnected"
            )






    # ==================================================
    # SERIAL LOOP
    # ==================================================

    def read_loop(self):


        while self.running:



            # ==========================
            # NO SERIAL FALLBACK
            # ==========================

            if not self.ser:


                fake = self.generate_fake_data()



                # Replace fake FC with NodeMCU FC

                if self.node_fc:

                    fake["fc"] = self.node_fc



                if self.callback:


                    asyncio.run(

                        self.callback(
                            json.dumps(fake)
                        )

                    )



                time.sleep(1)

                continue





            # ==========================
            # SERIAL CONNECTED
            # ==========================


            if not self.ser.in_waiting:


                # No serial data
                # still send NodeMCU telemetry

                if self.node_fc:


                    data = {

                        "fc": self.node_fc,

                        "eib":
                            "EIB,0,0,0,0,0,0",

                        "se":
                            "SE,UGV,MANUAL,STOP,0,NONE,0,0",

                        "link":
                            {
                                "rssi":-60,
                                "snr":10
                            }

                    }


                    if self.callback:


                        asyncio.run(

                            self.callback(
                                json.dumps(data)
                            )

                        )



                time.sleep(1)

                continue





            try:


                raw = self.ser.readline()



                line = raw.decode(
                    "utf-8",
                    errors="ignore"
                ).strip()



                if line:

                    self.handle_line(line)



            except Exception as e:


                print(
                    "[SERIAL ERROR]",
                    e
                )






    # ==================================================
    # SERIAL JSON HANDLER
    # ==================================================

    def handle_line(self,line):


        print(
            "[SERIAL RX]",
            line
        )


        try:

            data=json.loads(line)


        except:


            return



        self.serial_data = data



        # NodeMCU FC overrides everything

        if self.node_fc:

            data["fc"] = self.node_fc



        if self.callback:


            asyncio.run(

                self.callback(
                    json.dumps(data)
                )

            )






    # ==================================================
    # FAKE DATA
    # ==================================================

    def generate_fake_data(self):

        self.fake_time += 1

        t = self.fake_time

        # ---------------------------------
        # Vehicle state
        # ---------------------------------

        states = [
            ("AUTO", "FORWARD"),
            ("AUTO", "LEFT"),
            ("AUTO", "RIGHT"),
            ("AUTO", "STOP"),
            ("MANUAL", "FORWARD"),
        ]

        mode, motion = states[(t // 20) % len(states)]

        # ---------------------------------
        # Speed
        # ---------------------------------

        if motion == "STOP":
            self.fake_speed = max(
                0,
                self.fake_speed - 1
            )
        else:
            target = 8 + 4 * math.sin(t / 12)
            self.fake_speed += (
                    target - self.fake_speed
                ) * 0.2

            # ---------------------------------
            # Heading
            # ---------------------------------

            if motion == "LEFT":
                self.fake_heading -= 2

            elif motion == "RIGHT":
                self.fake_heading += 2

            self.fake_heading %= 360

            # ---------------------------------
            # GPS movement
            # ---------------------------------

            distance = self.fake_speed * 0.0000012

            rad = math.radians(self.fake_heading)

            self.fake_lat += distance * math.cos(rad)
            self.fake_lon += distance * math.sin(rad)

            # ---------------------------------
            # Altitude
            # ---------------------------------

            self.fake_altitude = (
                5
                + math.sin(t / 18) * 0.8
                + random.uniform(-0.15, 0.15)
            )

            # ---------------------------------
            # Aircraft attitude
            # ---------------------------------

            self.fake_pitch = (
                math.sin(t / 8) * 6
                + random.uniform(-0.5, 0.5)
            )

            self.fake_roll = (
                math.cos(t / 10) * 8
                + random.uniform(-0.5, 0.5)
            )

            self.fake_yaw = self.fake_heading

            # ---------------------------------
            # Battery
            # ---------------------------------

            self.fake_battery = max(
                20,
                self.fake_battery - 0.01
            )

            # ---------------------------------
            # Temperature
            # ---------------------------------

            self.fake_temp = (
                31
                + math.sin(t / 120)
                + random.uniform(-0.2, 0.2)
            )

            # ---------------------------------
            # Pressure
            # ---------------------------------

            self.fake_pressure = (
                100945
                + random.randint(-10, 10)
            )

            # ---------------------------------
            # Obstacle sensors
            # ---------------------------------

            self.fake_front = int(
                110
                + 35 * math.sin(t / 6)
                + random.randint(-5, 5)
            )

            self.fake_left = int(
                55
                + 15 * math.sin(t / 9)
                + random.randint(-4, 4)
            )

            self.fake_right = int(
                60
                + 18 * math.cos(t / 8)
                + random.randint(-4, 4)
            )

            self.fake_front = max(15, self.fake_front)
            self.fake_left = max(10, self.fake_left)
            self.fake_right = max(10, self.fake_right)

            # ---------------------------------
            # Environment
            # ---------------------------------

            humidity = round(
                70
                + 5 * math.sin(t / 20)
                + random.uniform(-1, 1),
                1
            )

            co2 = int(
                400
                + 20 * math.sin(t / 14)
                + random.randint(-5, 5)
            )

            gas = int(
                390
                + 15 * math.cos(t / 10)
                + random.randint(-5, 5)
            )

            voltage = round(
                12.6
                * (self.fake_battery / 100),
                2
            )

            # ---------------------------------
            # Link quality
            # ---------------------------------

            rssi = int(
                -62
                - abs(8 * math.sin(t / 25))
                + random.randint(-2, 2)
            )

            snr = round(
                10
                + 2 * math.sin(t / 15)
                + random.uniform(-0.5, 0.5),
                1
            )

            return {

                "fc":
                    f"FC,"
                    f"LT={self.fake_lat:.6f},"
                    f"LG={self.fake_lon:.6f},"
                    f"A={self.fake_altitude:.1f},"
                    f"S={self.fake_speed:.1f},"
                    f"ST=10,"
                    f"HD={self.fake_heading:.1f},"
                    f"P={self.fake_pitch:.1f},"
                    f"R={self.fake_roll:.1f},"
                    f"Y={self.fake_yaw:.1f},"
                    f"T={self.fake_temp:.1f},"
                    f"PR={self.fake_pressure},"
                    f"BA={self.fake_battery:.1f},"
                    f"DL={self.fake_left},"
                    f"DF={self.fake_front},"
                    f"DR={self.fake_right}",

                "eib":
                    f"EIB,"
                    f"{self.fake_temp:.1f},"
                    f"{humidity:.1f},"
                    f"{co2},"
                    f"{gas},"
                    f"{voltage:.2f},"
                    f"{int(self.fake_battery)}",

                "se":
                    f"SE,"
                    f"UGV,"
                    f"{mode},"
                    f"{motion},"
                    f"0,"
                    f"F,"
                    f"{random.randint(1200,1260)},"
                    f"{random.randint(1200,1260)}",

                "link": {
                    "rssi": rssi,
                    "snr": snr
                }
            }





    # ==================================================
    # COMMAND SEND
    # ==================================================

    def send(self,cmd):


        if not self.ser:


            print(
                "[SERIAL MOCK TX]",
                cmd
            )

            return



        if not cmd.endswith("\n"):

            cmd+="\n"



        self.ser.write(
            cmd.encode()
        )



        print(
            "[SERIAL TX]",
            cmd.strip()
        )





    def stop(self):

        self.running=False


        if self.ser:

            self.ser.close()