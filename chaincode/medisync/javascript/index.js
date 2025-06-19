'use strict';

const ProdusenContract = require('./lib/produsenContract');
const PbfContract = require('./lib/pbfContract');
const ApotekContract = require('./lib/apotekContract');
const KonsumenContract = require('./lib/konsumenContract');

module.exports.contracts = [
    ProdusenContract,
    PbfContract,
    ApotekContract,
    KonsumenContract
];