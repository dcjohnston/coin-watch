/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk'),
    request = require('request'),
    APP_ID = 'CoinWatcher',
    coinMarketCap = 'https://api.coinmarketcap.com/v1/ticker/';

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
const audibleCoins = coins.reduce((list, coin, i) => {
    if (i === coins.length - 1) {
        list.push('and ' + coin[0]);
    } else {
        list.push(coin[0]);
    }
    return list;
}, []).join(', ');

const switchBlock = coins.reduce((switchBlock, currency) => {
    const cb = (context) => {
        askCoinMarketCap(context, currency[0]);
    }
    currency.forEach((c) => {
        switchBlock[c] = switchBlock[c.toLowerCase()] = cb;
    });
    return switchBlock;
}, {});

const launchPrompt = "What coin would you like to check?";
const helpPrompt = "Coin Watch is a crypto currency price tracker. \
    You can ask for the current price of a supported coin. \
    You will receive the current price and 24 hour trend of the asset. \
    For example, you could say: 'What\'s the current price of bitcoin?', or, \
    'Give me an update on mysterium.' What coin would you like to check?";
const helpReprompt = `Sorry, I didn't get that. Supported coins are ${audibleCoins}. \
    Each coin also has supported abbreviations like BTC for bitcoin, and ETH for \
    ethereum. What coin would you like to check?`;

const handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', launchPrompt);
    },
    'GetCoin': function () {
        const coin = this.event.request.intent.slots.Coin.value;
        if (switchBlock[coin]) {
            switchBlock[coin](this);
        } else if (coin === 'help') {
            this.emit('AMAZON.HelpIntent');
        } else {
            this.emit('Unhandled');
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpPrompt, helpReprompt);
    },
    'Unhandled': function () {
        this.emit(':ask', helpReprompt);
    }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
