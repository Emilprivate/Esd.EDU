import os
from olympe.media import download_media

def handle_photo_progress(event, scheduler, drone, photo_queue):
    print(f"Photo event received: {event.args}")
    result = event.args.get('result')
    if hasattr(result, "name") and result.name == 'photo_saved':
        media_id = event.args['media_id']
        if drone is not None:
            os.makedirs("photos", exist_ok=True)
            print(f"Local path: {os.path.abspath('photos')}")
            drone.media.download_dir = "photos"
            print(f"Downloading photo with media_id: {media_id}")
            # Download the media and get the MediaInfo object
            media_download = drone(download_media(media_id)).wait()
            # Log filenames of all resources in this media
            try:
                media_info = drone.media.media_info(media_id)
                if media_info and hasattr(media_info, "resources"):
                    for resource in media_info.resources.values():
                        # Prefer resource.path, fallback to url
                        filename = os.path.basename(resource.path) if resource.path else os.path.basename(resource.url)
                        print(f"Downloaded photo filename: {filename}")
                        # Add filename to the photo queue for background processing
                        photo_queue.put(filename)
            except Exception as e:
                print(f"Could not log photo filenames: {e}")
        else:
            print(f"Drone is none, cannot download photo with media_id: {media_id}")
