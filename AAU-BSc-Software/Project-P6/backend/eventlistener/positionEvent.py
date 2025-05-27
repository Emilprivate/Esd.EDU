import math
import logging

def handle_position_changed(event, scheduler, gps_data, DRONE_READY, gps_data_changed):
    try:
        lat = event.args["latitude"]
        lon = event.args["longitude"]
        alt = event.args["altitude"]

        valid = (
            isinstance(lat, (int, float)) and
            isinstance(lon, (int, float)) and
            isinstance(alt, (int, float)) and
            math.isfinite(lat) and
            math.isfinite(lon) and
            math.isfinite(alt) and
            -90 <= lat <= 90 and
            -180 <= lon <= 180 and
            -100 <= alt <= 10000
        )

        if not valid or (lat == 500 and lon == 500 and alt == 500):
            DRONE_READY = False
            logging.debug("Invalid GPS coordinates received")
            return gps_data, DRONE_READY, gps_data_changed

        if (gps_data["latitude"] != lat or 
            gps_data["longitude"] != lon or 
            gps_data["altitude"] != alt):

            gps_data["latitude"] = lat
            gps_data["longitude"] = lon
            gps_data["altitude"] = alt
            DRONE_READY = True
            gps_data_changed = True
            logging.debug(f"Updated GPS data: lat={lat:.6f}, lon={lon:.6f}, alt={alt:.2f}")

    except Exception as e:
        logging.error(f"Error in position changed handler: {str(e)}")
    return gps_data, DRONE_READY, gps_data_changed
