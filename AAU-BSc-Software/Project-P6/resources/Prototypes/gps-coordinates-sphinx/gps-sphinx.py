import olympe
import json
import datetime
import os
import logging
import time
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveBy
from olympe.messages.ardrone3.PilotingState import (
    PositionChanged,
    FlyingStateChanged,
    AlertStateChanged,
    NavigateHomeStateChanged,
)

# ========= CONFIGURATION ==========
DRONE_CONTROLLER = olympe.Drone("10.202.0.1")
LOGGING_ENABLED = True

# ========= LOGGING SETUP ==========
if LOGGING_ENABLED:
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    log_filename = f"log_{timestamp}.txt"
    log_filepath = os.path.join(log_dir, log_filename)

    logger = logging.getLogger('drone_logger')
    logger.setLevel(logging.INFO)

    file_handler = logging.FileHandler(log_filepath)
    file_handler.setLevel(logging.INFO)

    formatter = logging.Formatter('%(message)s')
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)

# ========== DRONE CONTROL ==========
class FlightListener(olympe.EventListener):

    @olympe.listen_event(FlyingStateChanged(_policy='wait') | AlertStateChanged() |
        NavigateHomeStateChanged())
    def onStateChanged(self, event, scheduler):
        if not LOGGING_ENABLED:
            return

        event_time = datetime.datetime.now().isoformat()
        state_enum = event.args.get("state")
        state_data = {
            "timestamp": event_time,
            "event": event.message.name,
            "state": state_enum.name if state_enum else "N/A"
        }
        logger.info(f"{event.message.name.upper()} at {event_time}:")
        logger.info(json.dumps(state_data, indent=2))
        logger.info("----------------------------------")


    @olympe.listen_event(PositionChanged(_policy='wait'))
    def onPositionChanged(self, event, scheduler):
        if not LOGGING_ENABLED:
            return

        event_time = datetime.datetime.now().isoformat()
        position_data = {
            "timestamp": event_time,
            "latitude": event.args["latitude"],
            "longitude": event.args["longitude"],
            "altitude": event.args["altitude"],
        }
        logger.info(f"GPS position at {event_time}:")
        logger.info(json.dumps(position_data, indent=2))
        logger.info("----------------------------------")

# ========= MAIN PROGRAM ==========
try:
    with FlightListener(DRONE_CONTROLLER):
        DRONE_CONTROLLER.connect()

        DRONE_CONTROLLER(
            FlyingStateChanged(state="hovering")
            | (TakeOff() & FlyingStateChanged(state="hovering"))
        ).wait()

        DRONE_CONTROLLER(moveBy(1, 0, 0, 0)).wait()

        DRONE_CONTROLLER(Landing()).wait()

        DRONE_CONTROLLER(FlyingStateChanged(state="landed")).wait()

        DRONE_CONTROLLER.disconnect()

except Exception as e:
    if LOGGING_ENABLED:
        logger.error(f"An error occurred: {e}")

    try:
        if DRONE_CONTROLLER.connected:
            logger.error("Error occurred, attempting emergency landing...")
            DRONE_CONTROLLER(FlyingStateChanged(state="landing") | Landing()).wait(timeout=5)
            logger.info("Emergency landing attempt finished.")
    except Exception as landing_exception:
        logger.error(f"Could not perform emergency landing: {landing_exception}")
    finally:
        if DRONE_CONTROLLER.connected:
            DRONE_CONTROLLER.disconnect()
    raise

finally:
    if LOGGING_ENABLED:
        print(f"Log saved to: {log_filepath}")
    else:
        print("Logging was disabled.")