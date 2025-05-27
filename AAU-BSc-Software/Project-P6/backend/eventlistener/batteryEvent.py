import logging

def handle_battery_state_changed(event, scheduler, battery_percent, battery_percent_changed):
    try:
        new_percent = event.args["percent"]

        if battery_percent != new_percent:
            battery_percent = new_percent
            battery_percent_changed = True
            logging.debug(f"Battery percent changed to: {battery_percent}%")

    except Exception as e:
        logging.error(f"Error in battery state handler: {str(e)}")
    return battery_percent, battery_percent_changed
