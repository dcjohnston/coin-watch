/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk');
const request = require('request');

const APP_ID = 'CoinWatcher';
const coinMarketCap = 'https://api.coinmarketcap.com/v1/ticker/';

const launchPrompt = "What coin would you like to check?"
const helpMessage = "How can I help you?";
const helpReprompt = "Sorry, I didn't get that.";

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
    const cb = (context) => {
        askCoinMarketCap(context, currency[0]);
    }
    currency.forEach((c) => {
        switchBlock[c] = switchBlock[c.toLowerCase()] = cb;
    });
    return switchBlock;
}, {});

const handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', launchPrompt);
    },
    'GetCoin': function () {
        const coin = this.event.request.intent.slots.Coin.value;
        if (switchBlock[coin]) {
            return switchBlock[coin](this);
        }
        this.emit('Unhandled');
    },
    'AMAZON.HelpIntent': function () {
        // TODO clean this up
        this.emit(':tell', helpReprompt);
    },
    'Unhandled': function () {
        this.emit(':tell', 'Sorry, I didn\'t get that.');
    }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
