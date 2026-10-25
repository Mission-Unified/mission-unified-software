import pygame
import asyncio
from app.core.state_manager import state

class PS4Controller:
    def __init__(self, send_command):
        pygame.init()
        pygame.joystick.init()

        self.connected = False
        self.send = send_command

        if pygame.joystick.get_count() == 0:
            print("No controller found")
            return

        self.joystick = pygame.joystick.Joystick(0)
        self.joystick.init()

        self.connected = True
        print("Controller:", self.joystick.get_name())

    async def listen(self):
        if not self.connected:
            print("Controller not connected → skipping input loop")
            return

        self.last_cmd = None

        while True:
            pygame.event.pump()

            axis_y = self.joystick.get_axis(1)
            axis_x = self.joystick.get_axis(0)

            cmd = "CTRL:S"

            if axis_y < -0.5:
                cmd = "CTRL:F"
            elif axis_y > 0.5:
                cmd = "CTRL:B"
            elif axis_x < -0.5:
                cmd = "CTRL:L"
            elif axis_x > 0.5:
                cmd = "CTRL:R"

            # prevent spam
            if cmd != self.last_cmd:
                await self.send(cmd)
                self.last_cmd = cmd
            
            if self.joystick.get_button(1):  # Circle
                await self.send("UGV_MODE:MANUAL")

            if self.joystick.get_button(2):  # Square
                await self.send("UGV_MODE:AUTO")

            if self.joystick.get_button(3):  # Triangle
                await self.send("MODE:UAV")

            if self.joystick.get_button(0):  # Cross
                await self.send("MODE:UGV")
                
            await asyncio.sleep(0.1)