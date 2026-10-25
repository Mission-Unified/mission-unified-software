from fastapi import APIRouter
import app.core.command_manager as cm

router = APIRouter()

print("CM MODULE ID =", id(cm))
print("CM VAR =", cm.command_manager)

@router.post("/command")
async def send_command(data: dict):
    cmd = data.get("cmd")
    if not cmd:
        return {
            "status": "error",
            "message": "cmd field missing"
        }
    await cm.command_manager.send_with_retry(cmd)
    return {"status": "ok"}