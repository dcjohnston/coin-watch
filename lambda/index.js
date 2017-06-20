/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');

const APP_ID = 'CoinWatcher';
const coinMarketCap = 'https://api.coinmarketcap.com/v1/ticker/';

const reportMessage = (currency, quoteCurrency, price, movement) => {
    return `${currency} is currently at ${price} ${quoteCurrency}.\
    It has moved ${movement} percent over the past 24 hours.`
}

const askCoinMarketCap = (context, currency) => {
    return request(coinMarketCap + currency, (err, resp) => {
        const data = JSON.parse(resp.body)[0];
        const message = reportMessage(
            data.name, 'USD', data.price_usd, data.percent_change_24h
        );
        context.emit(':tell', message);
    });
}

const coins = [
    ['ethereum', 'eeth', 'ETH'],
    ['bitcoin', 'BTC'],
    ['augur', 'AUG', 'aug'],
    ['siacoin', 'sya', 'SC'],
    ['mysterium', 'MYST', 'mist'],
    ['golem-network-tokens', 'golem', 'GNT']
];

const switchBlock = coins.reduce((switchBlock, currency) => {
    switchBlock[currency[0]] = (context) => {
        askCoinMarketCap(context, currency[0]);
    }
    currency.slice(1).forEach((c) => {
        switchBlock[c] = switchBlock[currency[0]];
    });
    return switchBlock;
}, {});

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetCoin');
    },
    'GetCoin': function () {
        const coin = this.event.request.intent.slots.Coin.value;
        switchBlock[coin](this);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled': function () {
        this.emit(':tell', this.t('Sorry, I didn\'t get that.'))
    }
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
