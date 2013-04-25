var Handset = function () {
    this.speaker_element = document.getElementById('receiver');
    this.emote_element = document.getElementById('phonebox');
};
Handset.prototype.speaker = function (part_of_speech) {
    this.speaker_element.innerHTML = part_of_speech;
    if (part_of_speech == "*silence*") {
        this.emote_element.style.backgroundColor = "grey";
        this.emote_element.style.color = "black";
    } else {
        this.emote_element.style.backgroundColor = "black";
        this.emote_element.style.color = "white";
    }

};
Handset.prototype.wait_for_call = function () {
    this.emote_element.style.backgroundColor = "white";
    this.emote_element.style.color = "black";    
    this.speaker('');
}
Handset.prototype.off_the_hook = function () {
    this.emote_element.style.backgroundColor = "blue";
    this.emote_element.style.color = "white";    
    this.speaker_element.innerHTML = '*beep beep*';   
}

var Ringer = function () {
    this.ringer_element = document.getElementById('phonebox');
};
Ringer.prototype.start_ringing = function (value) {
    var self = this;
    var ring_state = false;
    this.interval_id = setInterval(function () {
        if (ring_state) {
            self.ringer_element.style.backgroundColor = "orange";
        } else {
            self.ringer_element.style.backgroundColor = "red";
        }
        ring_state = !ring_state;
    }, 100);
    this.ringer_element.style.backgroundColor = "green";
};
Ringer.prototype.stop_ringing = function () {
    this.ringer_element.style.backgroundColor = "grey";
    clearInterval(this.interval_id);
};

var EventHandler = function () {

};
EventHandler.prototype.events = {};
EventHandler.prototype.fire_event = function (event_id) {
    if (this.events[event_id] === undefined) {
        return false;
    }
    for (var i = 0, num_events = this.events[event_id].length; i < num_events; i++) {
        var scope = this.events[event_id][i].in_scope;
        if (scope === undefined) {
            scope = this;
        }
        this.events[event_id][i].do_this.call(scope);
    }
};
EventHandler.prototype.bind_event = function (id, action, scope) {
    if (this.events[id] === undefined) {
        return false;
    }
    this.events[id].push({
        do_this: action,
        in_scope: scope
    });
};

var PhoneboxControl = function () {
    var self = this;

    this.events = {
        off_hook: [],
        on_hook: []
    };

    this.off_hook = false;
    this.control_element = document.getElementById('control');
    this.control_element.addEventListener('click', function () {
        self.control_pressed.call(self);
    }, false);

    this.bind_event('off_hook', function () {
        this.update_control_text('hang up?');
    }, this);

    this.bind_event('on_hook', function () {
        this.update_control_text('pick up the phone');
    }, this);
}
PhoneboxControl.prototype = new EventHandler();
PhoneboxControl.prototype.update_control_text = function (control_text) {
    this.control_element.innerHTML = control_text;
};
PhoneboxControl.prototype.control_pressed = function () {
    this.off_hook = this.off_hook ? false : true;
    this.fire_event(this.off_hook ? 'off_hook' : 'on_hook');
};

var Phonebox = function () {
    this.call_in_progress = false;
    this.call_incoming = false;
    this.dial_tone = false;

    this.ringer = new Ringer();
    this.handset = new Handset();
    this.control = new PhoneboxControl();

    this.events = {
        call_answered: []
    };

    this.control.bind_event('off_hook', function () {
        if (this.call_incoming) {
            this.call_incoming = false;
            this.ringer.stop_ringing();
            this.handset.speaker('*silence*');
            this.fire_event('call_answered');
        } else {
            this.dial_tone = true;  
            this.handset.off_the_hook();
        }
    }, this);
    
    this.control.bind_event('on_hook', function () {
        if (this.call_in_progress) {
            this.call_in_progress = false;
            this.handset.wait_for_call();    
        } else {
            this.dial_tone = false;   
            this.handset.wait_for_call();
        }
    }, this);

    this.bind_event('call_answered', function () {
        this.call_in_progress = true;
    }, this);
};
Phonebox.prototype = new EventHandler();
Phonebox.prototype.place_incoming_call = function () {
    if (!this.off_hook) {
        this.call_incoming = true;
        this.ringer.start_ringing();
        this.handset.speaker('*ring ring*');
    } else {
        return false;
    }
};
Phonebox.prototype.listen_to = function (part_of_speech) {
    if (this.call_in_progress) {
        this.handset.speaker(part_of_speech);
    } else {
        return false;
    }
};

var Actor = function () {

};
Actor.prototype.voicebox = function (words, interval) {

    if (this.medium === undefined) {
        return false;
    }
    if (interval === undefined) {
        interval = 1000;
    }

    var index = 0;
    var num_words = words.length;
    var self = this;
    var interval_id = setInterval(function () {
        if (index < num_words) {
            self.medium.listen_to(words[index]);
            index++;
        } else {
            self.medium.listen_to("*silence*");
            clearInterval(interval_id);
        }
    }, interval);

};
Actor.prototype.speak = function (sentence, medium) {
    this.medium = medium;
    var words = sentence.split(" ");
    this.voicebox(words);
};

var Director = function () {
    this.scenes = [];
};
Director.prototype.action = function () {
    for (var i = 0, num_scenes = this.scenes.length; i < num_scenes; i++) {
        this.scenes[i].run();
    }
};

var Scene = function () {

};
Scene.prototype.run = function () {
    this.set_scene();
    this.action();
};

var SceneOne = function () {

};
SceneOne.prototype = new Scene();
SceneOne.prototype.set_scene = function () {
    this.phonebox = new Phonebox();
    this.actor = new Actor();
};
SceneOne.prototype.action = function () {
    var self = this;

    this.phonebox.bind_event('call_answered', function () {
        self.actor.speak("hello case", self.phonebox);
    }, this);

    this.phonebox.place_incoming_call();


};

var director = new Director();
director.scenes.push(new SceneOne());
director.action();
