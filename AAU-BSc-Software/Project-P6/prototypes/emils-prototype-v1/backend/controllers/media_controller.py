import olympe
import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import DRONE_IP

class MediaDroneController:
    def __init__(self, drone_ip=DRONE_IP):
        self.drone_ip = drone_ip
        self.drone = olympe.Drone(self.drone_ip)
        
    def get_media_info(self, media_id=None):
        """Get information about media files on the drone"""
        try:
            logger.debug(f"Attempting to connect to drone at {self.drone_ip}")
            self.drone.connect()
            
            logger.debug("Creating Media object")
            media = olympe.Media(hostname=self.drone_ip)
            
            try:
                logger.debug(f"Fetching media info for media_id: {media_id}")
                media_info = media.media_info(media_id)
                
                # Handle empty result
                if media_info is None:
                    logger.info("No media found")
                    return []
                    
                # Convert media info to serializable format
                if isinstance(media_info, list):
                    result = [self._serialize_media_info(m) for m in media_info]
                else:
                    result = self._serialize_media_info(media_info)
                    
                logger.debug(f"Successfully retrieved media info: {result}")
                return result
                
            except Exception as e:
                logger.error(f"Error getting media info: {str(e)}")
                raise Exception(f"Failed to get media info: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error in get_media_info: {str(e)}")
            raise
            
        finally:
            try:
                logger.debug("Shutting down media connection")
                media.shutdown()
            except Exception as e:
                logger.error(f"Error shutting down media: {str(e)}")
            
            try:
                logger.debug("Disconnecting from drone")
                self.drone.disconnect()
            except Exception as e:
                logger.error(f"Error disconnecting from drone: {str(e)}")
            
    def get_resource_info(self, media_id=None, resource_id=None):
        """Get information about specific resources on the drone"""
        self.drone.connect()
        media = olympe.Media(hostname=self.drone_ip)
        
        try:
            resource_info = media.resource_info(
                media_id=media_id,
                resource_id=resource_id,
                with_md5=True
            )
            
            # Convert resource info to serializable format
            if isinstance(resource_info, list):
                result = [self._serialize_resource_info(r) for r in resource_info]
            else:
                result = self._serialize_resource_info(resource_info)
                
            return result
        finally:
            media.shutdown()
            self.drone.disconnect()
            
    def _serialize_media_info(self, media_info):
        """Convert MediaInfo object to dictionary with safe access"""
        try:
            return {
                'media_id': getattr(media_info, 'media_id', None),
                'type': str(getattr(media_info, 'type', '')),
                'title': getattr(media_info, 'title', None),
                'datetime': getattr(media_info, 'datetime', None),
                'size': getattr(media_info, 'size', 0),
                'duration': getattr(media_info, 'duration', 0),
                'run_id': getattr(media_info, 'run_id', None),
                'custom_id': getattr(media_info, 'custom_id', None),
                'thumbnail': getattr(media_info, 'thumbnail', None),
                'replay_url': getattr(media_info, 'replay_url', None),
                'thermal': getattr(media_info, 'thermal', False)
            }
        except Exception as e:
            logger.error(f"Error serializing media info: {str(e)}")
            raise

    def _serialize_resource_info(self, resource_info):
        """Convert ResourceInfo object to dictionary"""
        return {
            'media_id': resource_info.media_id,
            'resource_id': resource_info.resource_id,
            'type': str(resource_info.type),
            'format': str(resource_info.format) if resource_info.format else None,
            'size': resource_info.size,
            'duration': resource_info.duration,
            'url': resource_info.url,
            'width': resource_info.width,
            'height': resource_info.height,
            'thermal': resource_info.thermal,
            'md5': resource_info.md5
        }
