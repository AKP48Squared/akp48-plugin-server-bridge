'use strict';

class ServerBridge extends global.AKP48.pluginTypes.MessageHandler {
  constructor(AKP48, config) {
    super('Server Bridge', AKP48);
    var self = this;
    this._config = config;

    this.perms = [
      'AKP48.owner',
      'AKP48.op'
    ];

    if(!this._config) {
      this._config = {
        channels: {}
      };
      this._config.channels[`${this._AKP48.getUUID()}|#exampleChannel`] = [`${this._AKP48.getUUID()}|#exampleChannel2`];
      this._AKP48.saveConfig(this._config, 'server-bridge');
    }

    this._AKP48.on('fullMsg', (text, ctx) => {
      self.handleFull(text, ctx);
    });
    this._AKP48.on('sendMsg', (to, msg, ctx) => {
      ctx.sending = true;
      //put in setTimeout to stop message from sending before whatever AKP48 is responding to.
      setTimeout(() => {
        self.handleFull(msg, ctx);
      }, 100);
    });
  }
}

ServerBridge.prototype.handleFull = function (text, ctx) {
  if(this._config.channels[`${ctx.instanceId}|${ctx.to}`]) {
    var chans = this._config.channels[`${ctx.instanceId}|${ctx.to}`];
    for (let chan of chans) {
      var c = chan.split('|');
      if(c.length !== 2) { return; }
      var pref = `<${ctx.nick}> `;
      if(ctx.sending) {
        pref = '';
      }
      this._AKP48.sendMessage(`[${ctx.to}] ${pref}${text}`, {instanceId: c[0], to: c[1], noPrefix: true});
    }
  }
};

ServerBridge.prototype.handleCommand = function (message, context, res) {
  global.logger.silly(`${this._pluginName}: Received command.`);

  // prepare text.
  context.originalText = context.text;
  var text = context.text.split(' ');
  var command = text[0];
  text.shift();

  context.text = text.join(' ');

  if(command.toLowerCase() === 'addbridge') {
    res(this.addBridge(context));
  }

  if(command.toLowerCase() === 'rmbridge') {
    res(this.rmBridge(context));
  }

  context.text = context.originalText;
};

ServerBridge.prototype.addBridge = function (context) {
  global.logger.silly(`${this._pluginName}: Handling addBridge.`);
  //TODO: permissions check.
  var text = context.text.split(' ');
  var chan1 = context.to;
  var svr1 = context.instanceId;
  var chan2 = text[0];
  var svr2 = text[1] || context.instanceId;
  text.shift();
  text = text.join(' ');

  //we already have this bridge. don't re-add.
  if(this._config.channels[`${svr1}|${chan1}`] && this._config.channels[`${svr1}|${chan1}`].includes(`${svr2}|${chan2}`)) {
    return `That bridge already exists!`;
  }

  if(!this._config.channels[`${svr1}|${chan1}`]) {
    this._config.channels[`${svr1}|${chan1}`] = [];
  }

  this._config.channels[`${svr1}|${chan1}`].push(`${svr2}|${chan2}`);

  this._AKP48.saveConfig(this._config, 'server-bridge');

  return `Added bridge between ${svr1}|${chan1} and ${svr2}|${chan2}.`;
};

ServerBridge.prototype.rmBridge = function (context) {
  global.logger.silly(`${this._pluginName}: Handling rmBridge.`);
  //TODO: permissions check.
  var text = context.text.split(' ');
  var chan1 = context.to;
  var svr1 = context.instanceId;
  var chan2 = text[0];
  var svr2 = text[1] || null;
  var changed = false;

  if(!this._config.channels[`${svr1}|${chan1}`]) {
    return `That bridge does not exist!`;
  }

  var index = this._config.channels[`${svr1}|${chan1}`].indexOf(`${svr2}|${chan2}`);

  while(index > -1) {
    this._config.channels[`${svr1}|${chan1}`].splice(index, 1);
    index = this._config.channels[`${svr1}|${chan1}`].indexOf(`${svr2}|${chan2}`);
  }

  if(changed) {
    this._AKP48.saveConfig(this._config, 'server-bridge');
    return `Removed bridge between ${svr1}|${chan1} and ${svr2}|${chan2}.`;
  } else {
    return `No bridges between those channels were found!`;
  }
};

module.exports = ServerBridge;
module.exports.type = 'MessageHandler';
module.exports.pluginName = 'server-bridge';
