
import SenseManager from "utils/SenseManager";
import socket from "ctrl/socket";

import TipLoadding from "popup/TipLoadding";
import { PopupCofig } from "utils/decorators";
import { PubSub } from "ctrl/playCtrl";
import { createBackOut } from "utils/util";

const { Stage, Sprite, Event, Handler, LocalStorage, Browser, Tween, Dialog, DialogManager, Ease } = Laya;

export default class CompSetting {

	static init() {
		let stage = Laya.stage;
		Dialog.manager.popupEffectHandler = new Handler(Dialog.manager, function(dialog) {
			dialog.scale(1, 1);
			dialog.alpha = 1;
			Tween.from(dialog, {
				x: stage.width / 2,
				y: stage.height / 2,
				scaleX: 0.5,
				scaleY: 0.5,
				alpha: 0
			}, 550, createBackOut(2), Handler.create(this, this.doOpen, [dialog]));
		});
		Dialog.manager.closeEffectHandler = new Handler(Dialog.manager, function(dialog, type) {
			Tween.to(dialog, {
				x: stage.width / 2,
				y: stage.height / 2,
				scaleX: 0.5,
				scaleY: 0.5,
				alpha: 0
			}, 300, Ease.sineIn, Handler.create(this, this.doClose, [dialog, type]));
		});
		Dialog.manager._centerDialog = function(dialog) {
			dialog.pivot(dialog.width / 2, dialog.height / 2);
			dialog.x = Math.round(((Laya.stage.width - dialog.width) >> 1) + dialog.pivotX);
			dialog.y = Math.round(((Laya.stage.height - dialog.height) >> 1) + dialog.pivotY);
		};

		SenseManager.onloadding = function() {
			let dialogManager = Laya.Dialog.manager;
			for (var i = dialogManager.numChildren - 1; i > -1; i--) {
				var item = dialogManager.getChildAt(i);
				if (item && !item.isConfirm && item.close != null) {
					dialogManager.doClose(item);
				}
			}
		};

		SenseManager.checkNext = function() {
			return socket.online;
		};

		PopupCofig.onloadding = () => TipLoadding.getInstance().show();
		PopupCofig.onloaded = () => TipLoadding.getInstance().hide();
	}

}