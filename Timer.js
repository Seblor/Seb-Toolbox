class Timer {
    constructor() {
        this._times = new Map();
    }

    start (label) {
        this._times.set(label, Date.now());
    }
    
    end (label) {
        try {
            var time = this._times.get(label);
            if (!time) {
                throw new Error('No such label: ' + label);
            }
            var duration = Date.now() - time;
            return duration;
        } catch (error) {
            return -1;
        }
    }
};

module.exports = Timer;