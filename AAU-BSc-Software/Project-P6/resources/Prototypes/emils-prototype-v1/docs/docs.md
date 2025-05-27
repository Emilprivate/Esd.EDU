Olympe API Reference Documentation
class olympe.Drone

Generic Parrot drone controller class

This class should be able to connect to any Parrot ANAFI drone model when connected directly to the drone (not through a SkyController).

For ANAFI Ai, this class is only usable when the “Direct Connection” mode is enabled on the drone.

See AnafiAi and SkyController4 for more information.

__init__(*args, **kwds)

connect(**kwds)

    Make all step to make the connection between the device and the controller

    Parameters:

            timeout – the global connection timeout in seconds (including the retried connection attempt duration when retry > 1)

            retry – the number of connection attempts (default to 1)

    Return type:

        bool

disconnect(*, timeout=5)

    Disconnects current device (if any) Blocks until it is done or abandoned

    Return type:

        bool

connection_state()

    Returns the state of the connection to the drone

    Return type:

        bool

__call__(expectations)

    This method can be used to:

            send command messages and waiting for their associated expectations

            monitor spontaneous drone event messages

            check the state of the drone

    It asynchronously process arsdk command and event message and expectations.

    Please refer to the Olympe User Guide for more information.

    Parameters:

        expectations – An SDK message expectation expression
    Return type:

        ArsdkExpectationBase

    Please refer to the Olympe user guide for more information.

get_state(message)

    Returns the drone current state for the event message given in parameter

    Parameters:

        message (ArsdkMessage) – an event message type
    Returns:

        an ordered dictionary containing the arguments of the last received event message that matches the message ID provided in parameter

check_state(message, *args, **kwds)

    Returns True if the drone state associated to the given message is already reached. Otherwise, returns False

query_state(query)

    Query the drone current state return a dictionary of every drone state whose message name contains the query string :return: dictionary of drone state :param: query, the string to search for in the message received from the drone.

subscribe(*args, **kwds)

    See: subscribe()

unsubscribe(subscriber)

    Unsubscribe a previously registered subscriber

    Parameters:

        subscriber (Subscriber) – the subscriber previously returned by subscribe()

start_piloting()

    Start interface to send piloting commands

    Return type:

        bool

piloting(roll, pitch, yaw, gaz, piloting_time)

    Send manual piloting commands to the drone. This function is a non-blocking.

    Parameters:

            roll (int) – roll consign for the drone (must be in [-100:100])

            pitch (int) – pitch consign for the drone (must be in [-100:100])

            yaw (int) – yaw consign for the drone (must be in [-100:100])

            gaz (int) – gaz consign for the drone (must be in [-100:100])

            piloting_time (float) – The time of the piloting command

    Return type:

        bool

stop_piloting()

    Stop interface to send piloting commands

    Return type:

        bool

property media: Media

property mission

property streaming

class olympe.Anafi

    Bases: Drone

    ANAFI controller class.

    This class should be used when you’re trying to connect to an ANAFI drone directly and not through a SkyController.

    When connecting Olympe to an ANAFI through a SkyController 3. You must use the SkyController3 class instead.

class olympe.AnafiAi

    Bases: Drone

    ANAFI Ai controller class.

    This class is only usable when the “Direct Connection” mode is enabled. By default, ANAFI Ai is only reachable from Olympe through a SkyController 4.

    When connecting Olympe to an ANAFI Ai through a SkyController 4. You must use the SkyController4 class instead.

class olympe.AnafiUSA

    Bases: Drone

    ANAFI USA controller class.

    This class should be used when you’re trying to connect to an ANAFI USA drone directly and not through a SkyController.

    When connecting Olympe to an ANAFI USA through a SkyController USA or a SkyController 4 Black. You must use the SkyControllerUSA or SkyController4Black classes respectively.

class olympe.SkyController3

    Bases: SkyControllerNet

    SkyController 3 controller class

    This class should be used to connect to ANAFI drones through a SkyController 3. Use the Anafi class instead when connecting to a drone directly.

class olympe.SkyController4

Bases: SkyControllerMuxCellular

SkyController 4 controller class

This class should be used to connect to ANAFI Ai drones through a SkyController 4. Use the AnafiAi class instead when connecting to a drone directly (the Direct connection mode should have been enabled on the drone in this case).

    property cellular: Cellular

            Cellular API.

class olympe.SkyController4Black

    Bases: SkyControllerMux

    SkyController 4 Black controller class

    This class should be used to connect to ANAFI USA drones through a SkyController 4 Black. Use the AnafiUSA class instead when connecting to a drone directly.

class olympe.SkyControllerUSA

    Bases: SkyControllerNet

    SkyController USA controller class

    This class should be used to connect to ANAFI USA drones through a SkyController USA. Use the AnafiUSA class instead when connecting to a drone directly.

class olympe.SkyController

Bases: SkyControllerMuxCellular

Generic SkyController controller class

This class can be used to connect to any SkyController SDK API but should be avoided to access other APIs (media, streaming and cellular pairing APIs).

    __init__(*args, cellular_autoconfigure: bool = False, user_apc_token: str | None = None, **kwds)

    Parameters:

            cellular_autoconfigure – True to run Cellular.configure() automatically when Cellular.user_apc_token is set and the SkyController is connected, False otherwise. (defaults to False)

            user_apc_token – User APC token to use for the cellular configuration; set Cellular.user_apc_token. If None and cellular_autoconfigure is True, the drone will be paired with a new anonymous APC token that will be automatically assigned to Cellular.user_apc_token when the SkyController is connected to the drone. If not None force cellular_autoconfigure to True and sets Cellular.user_apc_token. (defaults to None)

    See also

    Cellular.pair() to pair the drone with an user APC token. Cellular.configure() to configure the cellular.

connect(**kwds)

    Make all step to make the connection between the device and the controller

    Parameters:

            timeout – the global connection timeout in seconds (including the retried connection attempt duration when retry > 1)

            retry – the number of connection attempts (default to 1)

    Return type:

        bool

disconnect(*, timeout=5)

    Disconnects current device (if any) Blocks until it is done or abandoned

    Return type:

        bool

connection_state()

    Returns the state of the connection to the drone

    Return type:

        bool

__call__(expectations)

    This method can be used to:

            send command messages and waiting for their associated expectations

            monitor spontaneous drone event messages

            check the state of the drone

    It asynchronously process arsdk command and event message and expectations.

    Please refer to the Olympe User Guide for more information.

    Parameters:

        expectations – An SDK message expectation expression
    Return type:

        ArsdkExpectationBase

    Please refer to the Olympe user guide for more information.

get_state(message)

    Returns the drone current state for the event message given in parameter

    Parameters:

        message (ArsdkMessage) – an event message type
    Returns:

        an ordered dictionary containing the arguments of the last received event message that matches the message ID provided in parameter

check_state(message, *args, **kwds)

    Returns True if the drone state associated to the given message is already reached. Otherwise, returns False

query_state(query)

    Query the drone current state return a dictionary of every drone state whose message name contains the query string :return: dictionary of drone state :param: query, the string to search for in the message received from the drone.

subscribe(*args, **kwds)

    See: subscribe()

unsubscribe(subscriber)

    Unsubscribe a previously registered subscriber

    Parameters:

        subscriber (Subscriber) – the subscriber previously returned by subscribe()

start_piloting()

    Start interface to send piloting commands

    Return type:

        bool

piloting(roll, pitch, yaw, gaz, piloting_time)

    Send manual piloting commands to the drone. This function is a non-blocking.

    Parameters:

            roll (int) – roll consign for the drone (must be in [-100:100])

            pitch (int) – pitch consign for the drone (must be in [-100:100])

            yaw (int) – yaw consign for the drone (must be in [-100:100])

            gaz (int) – gaz consign for the drone (must be in [-100:100])

            piloting_time (float) – The time of the piloting command

    Return type:

        bool

stop_piloting()

    Stop interface to send piloting commands

    Return type:

        bool

property cellular: Cellular

    Cellular API.

property media: Media

property mission

property streaming

class olympe.EventListener

EventListener base class

This class implements the visitor pattern and is meant to be overridden to dispatch drone event messages to the correct class method.

To start/stop listening to event messages EventListener.subscribe() EventListener.unsubscribe() methods should be called. Alternatively, this class can be used as a context manager.

Example:

import olympe
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveBy
from olympe.messages.ardrone3.PilotingState import (
    PositionChanged,
    AlertStateChanged,
    FlyingStateChanged,
    NavigateHomeStateChanged,
)

class FlightListener(olympe.EventListener):

    @olympe.listen_event(FlyingStateChanged() | AlertStateChanged() |
        NavigateHomeStateChanged())
    def onStateChanged(self, event, scheduler):
        print("{} = {}".format(event.message.name, event.args["state"]))

    @olympe.listen_event(PositionChanged())
    def onPositionChanged(self, event, scheduler):
        print(
            "latitude = {latitude} longitude = {longitude} altitude = {altitude}".format(
                **event.args
            )
        )


drone = olympe.Drone("10.202.0.1")
with FlightListener(drone):
    drone.connect()
    drone(
        FlyingStateChanged(state="hovering")
        | (TakeOff() & FlyingStateChanged(state="hovering"))
    ).wait()
    drone(moveBy(10, 0, 0, 0)).wait()
    drone(Landing()).wait()
    drone(FlyingStateChanged(state="landed")).wait()
    drone.disconnect()

__init__(*contexts, timeout=10)

    Parameters:

            scheduler – an olympe.Drone or an olympe.expectations.Scheduler object for which this listener will subscribe to event messages.

            timeout – the listener callbacks timeout in seconds

subscribe()

    Start to listen to the scheduler event messages

unsubscribe()

        Stop from listening scheduler event messages

class olympe.Pdraw

__init__(name: str | None = None, device_name: str | None = None, buffer_queue_size: int = 8, pdraw_thread_loop: Loop | None = None, controller: ControllerBase | None = None)

    Parameters:

            name – (optional) pdraw client name (used by Olympe logs)

            device_name – (optional) the drone device name (used by Olympe logs)

            buffer_queue_size – (optional) video buffer queue size (defaults to 8)

            pdraw_thread_loop – (optional) Thread where run pdraw if ‘None’ a new thread is created

            controller – (optional) Controller owner of the pdraw instance

play(url: str | None = None, *, address: str | None = None, port: int | None = None, media_name: str = 'Front camera', resource_name: str = 'live', timeout: float | None = 5)

    Play a video

    By default, open and play a live video streaming session available from rtsp://192.168.42.1/live where “192.168.42.1” is the default IP address of a physical (Anafi) drone. The default is equivalent to Pdraw.play(url=”rtsp://192.168.42.1/live”)

    For a the live video streaming from a simulated drone, you have to specify the default simulated drone IP address (10.202.0.1) instead: Pdraw.play(url=”rtsp://10.202.0.1/live”).

    The url parameter can also point to a local file example: Pdraw.play(url=”file://~/Videos/100000010001.MP4”).

    Parameters:

            url – rtsp or local file video URL

            media_name – name of the media/track (defaults to “DefaultVideo”). If the provided media name is not available from the requested video stream, the default media is selected instead.

pause()

    Pause the currently playing video

resume(timeout=5)

    Resumes the currently paused video

stop(timeout=5)

    Stops the video stream

set_output_files(video=None, metadata=None, info=None)

    Records the video stream session to the disk

        video: path to the video stream mp4 recording file

        metadata: path to the video stream metadata json output file

        info: path to video stream frames info json output file

    This function MUST NOT be called when a video streaming session is active. Setting a file parameter to None disables the recording for the related stream part.

set_callbacks(h264_cb=None, h264_avcc_cb=None, h264_bytestream_cb=None, raw_cb=None, start_cb=None, end_cb=None, flush_h264_cb=None, flush_raw_cb=None)

    Set the callback functions that will be called when a new video stream frame is available, when the video stream starts/ends or when the video buffer needs to get flushed.

    Video frame callbacks

        h264_cb is associated to the H264 encoded video (AVCC) stream

        h264_avcc_cb is associated to the H264 encoded video (AVCC) stream

        h264_bytestream_cb is associated to the H264 encoded video

            (ByteStream) stream

        raw_cb is associated to the decoded video stream

    Each video frame callback function takes an VideoFrame() parameter whose lifetime ends after the callback execution. If this video frame is passed to another thread, its internal reference count need to be incremented first by calling ref(). In this case, once the frame is no longer needed, its reference count needs to be decremented so that this video frame can be returned to memory pool.

    Video flush callbacks

        flush_h264_cb is associated to the H264 encoded video stream

        flush_raw_cb is associated to the decoded video stream

    Video flush callback functions are called when a video stream reclaim all its associated video buffer. Every frame that has been referenced

    Start/End callbacks

    The start_cb/end_cb callback functions are called when the video stream start/ends. They don’t accept any parameter.

    The return value of all these callback functions are ignored. If a callback is not desired, leave the parameter to its default value or set it to None explicitly.

get_session_metadata()

    Returns a dictionary of video stream session metadata

property state: PdrawState

    Return the current Pdraw state

    Return type:

        PdrawState

wait(state: PdrawState, timeout: float | None = None) → bool

    Wait for the provided Pdraw state

    This function returns True when the requested state is reached or False if the timeout duration is reached.

    If the requested state is already reached, this function returns True immediately.

    This function may block indefinitely when called without a timeout value.

    Parameters:

        timeout – the timeout duration in seconds or None (the default)

close()

        Close a playing or paused video stream session

        Deprecated function warning:: this function is deprecated, please use Pdraw.stop instead

class olympe.PdrawRenderer

init(*, pdraw, media_id=0, hud_type=None)

    This method is called from the Renderer base class constructor (__init__) after the OpenGL context has been created. and may be overridden in subclass to perform some custom initialization

stop()

        Stops this renderer and close its associated window

class olympe.Cellular

Controller Cellular API class Controller mixin providing the cellular pairing.

pair(user_apc_token: str | None = None, timeout: float | None = None) → str

    Pairs a user APC token with the currently connected Drone.

    Parameters:

            user_apc_token – User APC token to pair with the drone. If None, another anonymous APC token will be generated. (defaults to None)

            timeout – the timeout in seconds or None for infinite timeout (the default)

    Raises:

            HTTPError – in case of failure.

            TimeoutError – in case of timeout.

    Returns:

        the user APC token paired with the Drone.

configure(user_apc_token: str | None = None, timeout: float | None = None)

    Configures the cellular connection using a user APC token.

    Parameters:

            user_apc_token – User APC token to used for the cellular connection. If not None, user_apc_token is set as user_apc_token. If None, user_apc_token will be used (the default).

            timeout – the timeout in seconds or None for infinite timeout (the default)

    Raises:

            HTTPError – in case of failure.

            TimeoutError – in case of timeout.

property autoconfigure: bool

    True if the automatic cellular configuration is enabled, False otherwise.

property user_apc_token: str | None

        Current user APC token used.

class olympe.Media

Drone Media API class

This class automatically connects to the drone web media interface (REST and websocket API) and synchronizes the drone media information in a background thread.

Media info:

        media_info(),

        resource_info(),

        list_media(),

        list_resources(),

        indexing_state())

Media monitoring with the Subscriber/listener API:

        subscribe()

        unsubscribe()

See usage example in doc/examples/media.py

__init__(hostname=None, version=1, name=None, device_name=None, scheduler=None, download_dir=None, integrity_check=None)

connect(*, timeout=5, **kwds)

disconnect(*, timeout=5)

shutdown()

    Properly close and stop the websocket connection and the media API background thread

media_info(media_id=None)

    Returns a media info object if media_id is None or a list of all available media info otherwise.

    Return type:

        list(MediaInfo) or MediaInfo

resource_info(media_id=None, resource_id=None, with_md5=False, with_signature=False, timeout=None)

    Returns a list resources info associated to a media_id or a specific resource info associated to a resource_id. This function raises a ValueError if media_id and resource_id are both left to None.

    Return type:

        list(ResourceInfo) or ResourceInfo

list_media()

    Returns a list of all available media id

list_resources(media_id=None)

    Returns a list of all available resource id if media_id is None or a list of resource id associated to the given media_id otherwise.

property indexing_state

    Returns the current media indexing state :rtype IndexingState:

__call__(expectations)

    Olympe expectation DSL handler

subscribe(*args, **kwds)

    See: subscribe()

unsubscribe(subscriber)

        Unsubscribe a previously registered subscriber

        Parameters:

            subscriber (Subscriber) – the subscriber previously returned by subscribe()

class olympe.MediaInfo

    Namedtuple class MediaInfo(media_id, type, title, datetime, boot_date, flight_date, size, run_id, custom_id, resources, duration, thumbnail, gps, video_mode, photo_mode, panorama_type, expected_count, replay_url, thermal)

        media_id (str): unique id of the media

        type ( MediaType): type of the media

        title (str): title of the media

        datetime (str) :iso8601 datetime of the media

        boot_date (str) :iso8601 datetime of the drone boot

        flight_date (str) :iso8601 datetime of the flight

        size (int): size (in bytes) of the media (total size of all its resources)

        duration (int): duration (in milliseconds) of the video media (total duration of all its resources)

        run_id (str): run id of the media

        thumbnail (str): relative url to be used in a GET request to download the media thumbnail (if available)

        gps (GPS): gps coordinates of the media (if available)

        photo_mode (PhotoMode): photo mode of the media (if available and media is a photo)

        panorama_type (panorama_type enum): panorama type of the media (if available, media is a photo and photo_mode is panorama)

        expected_count (int): expected number of resources in the media ( if available, media is a photo and photo_mode is panorama)

        replay_url (str): media rtsp replay url (prefixed by rtsp://drone.ip.address:rtsp_port/)

        resources (list( ResourceInfo )): resource list of the media

        thermal (bool): media includes resources with thermal metadata (if value is true)

class olympe.ResourceInfo

    Namedtuple class ResourceInfo(media_id, resource_id, type, path, format, datetime, size, url, width, height, duration, thumbnail, preview, signature, gps, video_mode, replay_url, thermal, md5, storage, download_path, download_md5_path, thumbnail_download_path, thumbnail_download_md5_path)

        media_id (str): unique id of the media

        resource_id (str): unique id of the resource

        type ( MediaType): type of the resource

        path (str): path to the resource on the file system, relative to the storage root path

        format ( ResourceFormat): format of the resource

        datetime (str): iso8601 datetime of the media

        size (int): size (in bytes) of the media (total size of all its resources)

        duration (int): duration (in milliseconds) of the video media (total duration of all its resources)

        url (str): relative url to be used in a GET request to download the resource

        thumbnail (str): relative url to be used in a GET request to download the resource thumbnail (if available)

        preview (str): elative url to be used in a GET request to download the resource preview (if available)

        signature (str): resource signature (optional)

        gps (GPS): gps coordinates of the media (if available)

        width (int): width (in pixels) of the resource

        height (int): height (in pixels) of the resource

        replay_url (str): media rtsp replay url (prefixed by rtsp://drone.ip.address:rtsp_port/)

        thermal (bool): media includes resources with thermal metadata (if value is true)

        md5 (str): media md5 checksum (if resource is photo)

        video_mode (str): video mode of the resource (if available and resource is a video)

        storage (str): storage where the resource is located

class olympe.media.MediaType

An enumeration.

photo = 'PHOTO'

video = 'VIDEO'

class olympe.media.PhotoMode

An enumeration.

bracketing = 'BRACKETING'

burst = 'BURST'

gpslapse = 'GPSLAPSE'

panorama = 'PANORAMA'

single = 'SINGLE'

timelapse = 'TIMELAPSE'

class olympe.media.IndexingState

An enumeration.

indexed = 'INDEXED'

indexing = 'INDEXING'

not_indexed = 'NOT_INDEXED'

class olympe.media.GPS

Namedtuple class GPS(latitude, longitude, altitude)

altitude

    Alias for field number 2

latitude

    Alias for field number 0

longitude

        Alias for field number 1

class olympe.VideoFrame

ref()

    This function increments the reference counter of the underlying buffer(s)

unref()

    This function decrements the reference counter of the underlying buffer(s)

info()

    Returns a dictionary of video frame info

vmeta()

    Returns a 2-tuple (VMetaFrameType, dictionary of video frame metadata)

as_ctypes_pointer()

    This function return a 2-tuple (frame_pointer, frame_size) where frame_pointer is a ctypes pointer and frame_size the frame size in bytes.

    See: https://docs.python.org/3/library/ctypes.html

as_ndarray()

        This function returns an non-owning numpy 1D (h264) or 2D (YUV) array on this video frame

class olympe.PdrawState

An enumeration.

Created = 1

Closing = 2

Closed = 3

Opening = 5

Opened = 6

Playing = 7

Paused = 8

Error = 9

class olympe.MissionController

from_path(url_or_path: Path | str, feature_name_from_file=False)

        Creates and returns an olympe.Mission object from a local path or an URL to an AirSDK mission archive.

class olympe.Mission

install(allow_downgrade=None, is_default=None, timeout=30, **kwds)

    Install this mission onto the remote drone. The drone must be rebooted before this mission becomes available.

messages

    Returns a dictionary of mission (non-protobuf) messages usable with the Olympe DSL API.

enums

    Returns a dictionary of mission enums usable with the Olympe DSL API.

wait_ready(timeout=None)

    Wait for this mission to become ready to communicate with the drone. This method waits for the associated drone to send this mission instance recipient ID.

send(proto_message, service_name, msg_num, proto_args=None, recipient_id=None, quiet=False)

    Send an AirSDK mission custom protobuf message to the drone.

    Parameters:

            proto_message – An AirSDK protocol buffer message

            service_name – the associated custom message service

            msg_num – the associated custom message number

            proto_args – an optional mapping of arguments to merge into the protocol buffer message

            recipient_id – specify or override the associated recipient ID

            quiet – optional boolean flag to decrease log verbosity (defaults to False)

subscribe(callback, service_name=None, msg_num=None, recipient_id=None)

        Subscribe a callback function to every event messages associated to this mission.

        See: subscribe()

class olympe.Expectation(future=None)

abstract received_events()

    Returns a collection of events that have matched at least one of the messages ID monitored by this expectation.

abstract matched_events()

    Returns a collection of events that have matched this expectation (or a child expectation)

abstract unmatched_events()

    Returns a collection of events object that are still expected

explain()

        Returns a debug string that explain this expectation current state.

olympe.log.update_config(update, on_update=None)

Update (recursively) the current logging configuration dictionary.