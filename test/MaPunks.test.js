const MaPunks = artifacts.require("./MaPunks")

require('chai')
	.use(require('chai-as-promised'))
	.should()

const EVM_REVERT = 'VM Exception while processing transaction: revert'

contract('MaPunks', ([deployer, user])) => {

	const NAME = 'MaPunks'
	const SYMBOL = 'MP'
	const COST = 0.001
	const MAX_SUPPLY = 50

	// URI from collection uploaded to IPFS
	const IPFS_IMAGE_METADATA_URI = 'ipfs://QmUpN5haGa7BzndRNJNSByCBt87bEK6nZPgFsudoV8EFTB'
	// Do you have URI for hidden metadata?
	// const IPFS_HIDDEN_IMAGE_METADATA_URI = 'ipfs://IPFS-HIDDEN-METADATA-CID/hidden.json
}