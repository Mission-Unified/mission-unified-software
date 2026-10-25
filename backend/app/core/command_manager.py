import asyncio

class CommandManager:
    def __init__(self, serial):
        self.serial = serial
        self.lock = asyncio.Lock()

        self.last_status = {}

    def update_status(self, status):
        self.last_status = status

    async def send(self, cmd: str):
        async with self.lock:
            self.serial.send(cmd)

    async def send_with_verify(
        self,
        cmd: str,
        expected=None,
        retries=3,
        timeout=2.0
    ):
        async with self.lock:

            for attempt in range(retries):

                print(
                    f"[CMD] {cmd} "
                    f"(attempt {attempt+1}/{retries})"
                )

                self.serial.send(cmd)

                try:
                    await asyncio.wait_for(
                        self.wait_for_state(expected),
                        timeout
                    )

                    print("[CONFIRMED]")
                    return True

                except asyncio.TimeoutError:
                    print("[RETRY]")

            print("[FAILED]")
            return False

    async def wait_for_state(self, expected):

        if expected is None:
            return True

        while True:

            matched = True

            for k, v in expected.items():
                if self.last_status.get(k) != v:
                    matched = False
                    break

            if matched:
                return True

            await asyncio.sleep(0.05)


command_manager = None


def init_command_manager(serial):
    global command_manager

    command_manager = CommandManager(serial)

    return command_manager