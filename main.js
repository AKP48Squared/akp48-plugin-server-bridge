'use strict';

class ServerBridge extends global.AKP48.pluginTypes.MessageHandler {
  constructor(AKP48) {
    super(AKP48, 'ServerBridge');
  }

  load() {
    this.perms = [
      'AKP48.owner',
      'AKP48.op'
    ];

    if(!this._config.channels) {
      this._config = {
        channels: {}
      };
      this._config.channels[`${this._AKP48.getUUID()}|#exampleChannel`] = [`${this._AKP48.getUUID()}|#exampleChannel2`];
      this._AKP48.saveConfig(this._config, 'ServerBridge');
    }

    var self = this;

    this._AKP48.on('fullMsg', (ctx) => {
      self.handleFull(ctx);
    });

    this._AKP48.on('logMsg', (ctx) => {
      ctx.setCustomData('server-bridge-sending', true);
      //handle message on next tick, to let the event queue finish first.
      process.nextTick(() => {
        self.handleFull(ctx);
      });
    });
  }
}

ServerBridge.prototype.handleFull = function (ctx) {
  if(this._config.channels[`${ctx.instanceId()}|${ctx.to()}`]) {
    var chans = this._config.channels[`${ctx.instanceId()}|${ctx.to()}`];
    for (let chan of chans) {
      var c = chan.split('|');
      if(c.length !== 2) { return; }
      var pref = `<${ctx.nick()}> `;
      if(ctx.getCustomData('server-bridge-sending')) {
        pref = `<${ctx.myNick()}> `;
      }

      var sendCtx = new this._AKP48.Context({
        instance: {_id: c[0], _name: 'ServerBridge'}, //TODO: Actually get the true instance here?
        instanceType: 'ServerBridge',
        nick: 'ServerBridge',
        text: `[${ctx.to()}] ${pref}${ctx.text()}`,
        to: c[1],
        user: `ServerBridge`,
        commandDelimiters: '',
        myNick: 'ServerBridge',
        permissions: []
      });

      sendCtx.setCustomData('noPrefix', true);

      this._AKP48.sendMessage(sendCtx);
    }
  }
};

ServerBridge.prototype.handleCommand = function (context) {
  global.logger.silly(`${this.name}: Received command.`);

  var good = false;

  for (let perm of context.permissions()) {
    if(this.perms.includes(perm)) {
      good = true;
      break;
    }
  }

  if(!good) { global.logger.silly(`${this.name}: Dropping command; no permission.`); return; }

  switch(context.command().toLowerCase()) {
    case 'addbridge':
      return this.addBridge(context);
    case 'rmbridge':
      return this.rmBridge(context);
    default:
      return;
  }
};

ServerBridge.prototype.addBridge = function (context) {
  global.logger.silly(`${this.name}: Handling addBridge.`);

  var chan1 = context.to();
  var svr1 = context.instanceId();
  var chan2 = context.rawArgs()[0];
  var svr2 = context.rawArgs()[1] || context.instanceId();

  //we already have this bridge. don't re-add.
  if(this._config.channels[`${svr1}|${chan1}`] && this._config.channels[`${svr1}|${chan1}`].includes(`${svr2}|${chan2}`)) {
    return `That bridge already exists!`;
  }

  if(!this._config.channels[`${svr1}|${chan1}`]) {
    this._config.channels[`${svr1}|${chan1}`] = [];
  }

  this._config.channels[`${svr1}|${chan1}`].push(`${svr2}|${chan2}`);

  this._AKP48.saveConfig(this._config, 'ServerBridge');

  return `Added bridge between ${svr1}|${chan1} and ${svr2}|${chan2}.`;
};

ServerBridge.prototype.rmBridge = function (context) {
  global.logger.silly(`${this.name}: Handling rmBridge.`);

  var chan1 = context.to();
  var svr1 = context.instanceId();
  var chan2 = context.rawArgs()[0];
  var svr2 = context.rawArgs()[1] || context.instanceId();
  var changed = false;

  if(!this._config.channels[`${svr1}|${chan1}`]) {
    return `That bridge does not exist!`;
  }

  var index = this._config.channels[`${svr1}|${chan1}`].indexOf(`${svr2}|${chan2}`);

  while(index > -1) {
    this._config.channels[`${svr1}|${chan1}`].splice(index, 1);
    index = this._config.channels[`${svr1}|${chan1}`].indexOf(`${svr2}|${chan2}`);
    changed = true;
  }

  if(changed) {
    this._AKP48.saveConfig(this._config, 'ServerBridge');
    return `Removed bridge between ${svr1}|${chan1} and ${svr2}|${chan2}.`;
  } else {
    return `No bridges between those channels were found!`;
  }
};

module.exports = ServerBridge;
