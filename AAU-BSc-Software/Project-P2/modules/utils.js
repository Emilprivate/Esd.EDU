export { updateFPSCounter}

//https://www.growingwiththeweb.com/2017/12/fast-simple-js-fps-counter.html
let fpsCounter = {
    startTime: 0,
    frameNumber: 0,
    getFPS: function() {
        this.frameNumber++;
        let d = new Date().getTime(),
            currentTime = (d - this.startTime) / 1000,
            result = Math.floor(this.frameNumber / currentTime);
        if (currentTime > 1) {
        this.startTime = new Date().getTime();
        this.frameNumber = 0;
        }
        return result;
    }
};

function updateFPSCounter() {
    let fps = fpsCounter.getFPS();
    document.querySelector("#framerateCount").textContent = fps + "fps";
}