import logging

def handle_flying_state_changed(event, scheduler, drone_motion_state, motion_state_changed, Emergency):
    try:
        raw_state = str(event.args["state"])
        new_state = raw_state.split('.')[-1].lower()
        if drone_motion_state != new_state:
            drone_motion_state = new_state
            motion_state_changed = True
            logging.debug(f"Flying state changed to: {drone_motion_state}")
        if new_state == "emergency":
            Emergency = True
            logging.error("Emergency state detected, aborting flight")
    except Exception as e:
        logging.error(f"Error in flying state handler: {str(e)}")
    return drone_motion_state, motion_state_changed, Emergency
