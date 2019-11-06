
import SenseManager from "utils/SenseManager";
import { subscribeStore, setStoreState } from "ctrl/playCtrl";

const { Handler, Event } = Laya;

export default class Sound extends Laya.SoundManager {

	static initial() {
		this.setMusicVolume(0.5);
		this.autoStopMusic = false;
		subscribeStore("voiceOn", data=> {
			this.muted = !data;
        }, this);

        if (GM && GM.muteAudio)  setStoreState({ voiceOn: !GM.muteAudio.getMuteState() });
	}
	
	static play(name, loop) {
		let url = `audio/${name}.mp3`;
		if (/bg$/.test(name) || /bg\d+$/.test(name)) {
			this.playMusic(url, 0);
		} else {
			this.playSound(url, loop||1);
		}
	}

	static stop(name) {
		let url = `audio/${name}.mp3`;
		if (/bg$/.test(name) || /bg\d+$/.test(name)) {
			this.stopMusic();
		} else {
			this.stopSound(url);
		}
	}


}