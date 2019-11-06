import { env } from 'utils/util';
import TSocket from "utils/TSockect";
import Confirm from 'popup/Confirm';

let socket = new TSocket({
	'connectionUrl': window.websocketurl,
	'token': window.token,
	'publicKey': window.publicKey
});
export default socket;

socket.connect();

let dispatcher = new Laya.EventDispatcher();

socket.on = function(type,listener,args,caller) {
	return dispatcher.on(type,caller,listener,args);
};
socket.once = function(type,listener,args,caller) {
	return dispatcher.once(type,caller,listener,args);
};
socket.off = function(type,listener,onceOnly,caller) {
	return dispatcher.off(type,caller,listener,args);
};
socket.send = function() {
	return TSocket.prototype.send.apply(socket, arguments);
};

socket.onData = (cmd, rep) => {
	switch (cmd) {
		case "conn::error":
			let res = rep.res;
			if (res && res.code == "1003") {
				socket.primus.off("end", sparkEnd);
				socket.primus.end();
				if (GM && GM.userLogged) GM.userLogged = false;
				Confirm.getInstance().popup("您已在其它地点登录", {
					align: "center",
					close: ()=> location.reload()
				});
			}
			break;
		case "error":
			Log.error(cmd, rep);
			break;
		default:
			dispatcher.event(cmd, [rep]);
			break;
	}
};

socket.primus.on("end", sparkEnd);

function sparkEnd() {
	Confirm.getInstance().popup("您的网络已经断开", {
		align: "center",
		close: ()=> location.reload()
	});
}

if (env !== 'product') window.DEVIO = socket;