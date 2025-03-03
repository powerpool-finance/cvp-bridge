const fs = require('fs');

const baseExcessContracts = ['Imports', 'test']
const excessContractsByPath = {
  'contracts/Cvp': baseExcessContracts,
};

Object.keys(excessContractsByPath).forEach(partialPath => {
  const fullPath = `artifacts/solidity-json/${partialPath}.sol.json`;
  if (!fs.existsSync(fullPath)) {
    return;
  }
  const solidityJson = JSON.parse(fs.readFileSync(fullPath, {encoding: 'utf8'}));

  const excessContracts = excessContractsByPath[partialPath];
  Object.keys(solidityJson.sources).forEach((source) => {
    if (excessContracts.some(excessContractName => source.includes(excessContractName))) {
      delete solidityJson.sources[source];
    }
  });

  fs.writeFileSync(fullPath, JSON.stringify(solidityJson, null, ' '));
  console.log(fullPath, 'size:', fs.statSync(fullPath).size);
})
