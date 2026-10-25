from app.core.state_manager import state

class TelemetryService:

    @staticmethod
    def build(payload):
        # payload already parsed in main
        return payload

    @staticmethod
    def get():
        return state.telemetry