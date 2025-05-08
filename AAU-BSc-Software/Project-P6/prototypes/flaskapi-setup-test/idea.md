Switch socket for standard Flask project.
Have 5 API endpoints
** @POST /connect **: This initializes a connection to the server using SSE (Server Side Events)
** @POST /connect_drone **: This connects the drone
** @POST /disconnect_drone **: This disconnects the drone
** @POST /create_route **: This calculates the route from the given parameters
** @POST /execute_flight **: This executes the flight

When we initialize the SSE connection with the frontend, we can send all data through that

What if we initialize the EventListener to run in background, but when we execute a flight we stop all background tasks and handle the EventListener in the flight executor.