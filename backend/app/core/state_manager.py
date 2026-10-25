class State:
    def __init__(self):
        self.telemetry = {}
        self.vision = {}

    def update_telemetry(self, data):
        self.telemetry = data

    def update_vision(self, data):
        self.vision = data

    def get_all(self):
        return {
            "telemetry": self.telemetry
        }

state = State()