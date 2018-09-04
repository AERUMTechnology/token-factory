let contractAt = function(contract, address) {
  return new Promise(function (resolve, reject) {
    contract.at(address).then(function(instance) {
      resolve(instance);
    }).catch(function(error) {
      reject(error);
    });
  });
}

let getEventArg = function(tx, event, arg) {
  for (var i = 0; i < tx.logs.length; i++) {
    var log = tx.logs[i];
    if (log.event == event) {
      return log.args[arg];
    }
  }
  return null;
}

let assertVMError = function(error) {
  if (error.message.search('VM Exception') == -1) console.log(error);
  assert.isAbove(error.message.search('VM Exception'), -1, 'Error should have been caused by EVM');
};

module.exports = {
  contractAt,
  getEventArg,
  assertVMError
};
