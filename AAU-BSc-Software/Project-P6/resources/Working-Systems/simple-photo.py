import olympe
import time
import os
from olympe.messages.ardrone3.Piloting import TakeOff, Landing
from olympe.messages.ardrone3.PilotingState import FlyingStateChanged
from olympe.messages.camera import set_camera_mode, set_photo_mode, take_photo, photo_progress
from olympe.enums.camera import camera_mode, photo_mode, photo_format, photo_file_format
from olympe.media import download_media
from olympe.messages.gimbal import set_target

DRONE_IP = "192.168.53.1"
PHOTO_DIR = "photos"

class PhotoListener(olympe.EventListener):
    def __init__(self, drone):
        super().__init__(drone)
        self._drone = drone

    @olympe.listen_event(photo_progress(_policy='wait'))
    def on_photo_progress(self, event, scheduler):
        print(f"Photo event received: {event.args}")
        result = event.args.get('result')
        if hasattr(result, "name") and result.name == 'photo_saved':
            media_id = event.args['media_id']
            drone = self._drone
            os.makedirs(PHOTO_DIR, exist_ok=True)
            drone.media.download_dir = PHOTO_DIR
            print(f"Downloading photo with media_id: {media_id}")
            drone(download_media(media_id)).wait()

def simple_take_photo():
    drone = olympe.Drone(DRONE_IP)
    listener = PhotoListener(drone)
    listener.__enter__()
    drone.connect()
    try:
        # Rotate gimbal downward before takeoff, check expectation
        gimbal_down = drone(set_target(
            gimbal_id=0,
            control_mode="position",
            yaw_frame_of_reference="none",
            yaw=0.0,
            pitch_frame_of_reference="absolute",
            pitch=-90.0,
            roll_frame_of_reference="none",
            roll=0.0,
            _timeout=5
        )).wait()
        if gimbal_down.success():
            print("Gimbal set to -90° (downward) successfully.")
        elif gimbal_down.timedout():
            print("Gimbal set to -90° timed out.")
        else:
            print("Gimbal set to -90° failed.")

        time.sleep(5)

        # Take off and proceed
        drone(TakeOff() >> FlyingStateChanged(state="hovering", _timeout=10)).wait()
        drone(set_camera_mode(cam_id=0, value=camera_mode.photo)).wait()
        drone(set_photo_mode(
            cam_id=0,
            mode=photo_mode.single,
            format=photo_format.rectilinear,
            file_format=photo_file_format.jpeg,
            burst=0,
            bracketing=0,
            capture_interval=0.0
        )).wait()
        time.sleep(1)
        drone(take_photo(cam_id=0)).wait()
        time.sleep(4)  # Give time for the photo to be saved and downloaded
        drone(take_photo(cam_id=0)).wait()
        time.sleep(5)  # Give time for the photo to be saved and downloaded
        drone(Landing() >> FlyingStateChanged(state="landed", _timeout=10)).wait()

        # Rotate gimbal back to 0 after landing, check expectation
        gimbal_up = drone(set_target(
            gimbal_id=0,
            control_mode="position",
            yaw_frame_of_reference="none",
            yaw=0.0,
            pitch_frame_of_reference="absolute",
            pitch=0.0,
            roll_frame_of_reference="none",
            roll=0.0,
            _timeout=5
        )).wait()
        if gimbal_up.success():
            print("Gimbal reset to 0° (forward) successfully.")
        elif gimbal_up.timedout():
            print("Gimbal reset to 0° timed out.")
        else:
            print("Gimbal reset to 0° failed.")
    finally:
        listener.__exit__(None, None, None)
        drone.disconnect()

if __name__ == "__main__":
    simple_take_photo()
