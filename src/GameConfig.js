	/**
	*游戏初始化配置
	*/
	//class GameConfig
	var GameConfig=(function(){
		function GameConfig(){};
		Laya.class(GameConfig,'GameConfig');
		GameConfig.width=1136;
		GameConfig.height=640;
		GameConfig.scaleMode="showall";
		GameConfig.screenMode="none";
		GameConfig.alignV="top";
		GameConfig.alignH="left";
		GameConfig.startScene= ui.fragment.FooterUI;
		GameConfig.sceneRoot= "";
		GameConfig.debug=false;
		GameConfig.stat=false;
		return GameConfig;
	})()