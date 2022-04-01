import { loadTree } from './merkle';
import { scale } from './utils';
import { soliditySha3 } from 'web3-utils';
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { argv } = require('yargs');
const { config } = require('./config');

const globCwd = path.resolve(__dirname, '../' + config.reportsDirectory);

const filenamesOfTotals = glob.sync('./**/' + config.reportFilename, {
    cwd: globCwd,
});

const { recipient, decimals, balance } = argv;

const reports = filenamesOfTotals.map((fileName) => [
    parseInt(fileName.split('/')[1]), // weekNumber
    JSON.parse(fs.readFileSync(path.resolve(globCwd, fileName)).toString()),
]);

// console.log(recipient, decimals, balance)
console.log(config.reportFilename);

const proofs: any[] = [];

reports.forEach(([week, report]) => {
    if (week === 95) {
        const merkleTree = loadTree(report, decimals || 18);

        const scaledBalance = scale(balance, decimals || 18);
        const leaf = soliditySha3(recipient, scaledBalance.toString());

        proofs.push({
            address: recipient,
            claim_amount: scaledBalance,
            hex_proof: merkleTree.getHexProof(leaf),
        });
    }
});

if (argv.outfile) {
    const jsonString = JSON.stringify(proofs, null, 4);
    console.log(jsonString);

    fs.writeFileSync(argv.outfile, jsonString);
}
