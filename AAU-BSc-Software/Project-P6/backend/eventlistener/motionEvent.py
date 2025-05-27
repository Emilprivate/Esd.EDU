import logging

def handle_motion_state_changed(event, scheduler, drone_motion_state, motion_state_changed):
    try:
        raw_state = str(event.args["state"])
        new_state = raw_state.split('.')[-1].lower()

        if drone_motion_state != new_state:
            drone_motion_state = new_state
            motion_state_changed = True
            logging.debug(f"Motion state changed to: {drone_motion_state}")

    except Exception as e:
        logging.error(f"Error in motion state handler: {str(e)}")
    return drone_motion_state, motion_state_changed
