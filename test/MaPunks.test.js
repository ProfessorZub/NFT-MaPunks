const MaPunks = artifacts.require("./MaPunks")

require('chai')
	.use(require('chai-as-promised'))
	.should()

//const EVM_REVERT = 'VM Exception while processing transaction: revert'	// message obsolete?

contract('MaPunks', ([deployer, user]) => {

	const NAME = 'MaPunks'
	const SYMBOL = 'MP'
	const COST = 0
	const MAX_SUPPLY = 50

	// URI from collection uploaded to IPFS
	const IPFS_IMAGE_METADATA_URI = 'ipfs://QmUpN5haGa7BzndRNJNSByCBt87bEK6nZPgFsudoV8EFTB'
	// TODO: Do you have URI for hidden metadata?
	const IPFS_HIDDEN_IMAGE_METADATA_URI = 'ipfs://IPFS-HIDDEN-METADATA-CID/hidden.json'

	let maPunks

	describe('Deployment', () => {

		let milliseconds = 120000  //  TODO: adjust this to desired delay for mint date from time of deployment
		let result, timeDeployed

		beforeEach(async () => {
			const NFT_MINT_DATE = (Date.now() + milliseconds).toString().slice(0, 10)

			maPunks = await MaPunks.new(
				NAME,
				SYMBOL,
				COST,
				MAX_SUPPLY,
				NFT_MINT_DATE,
				IPFS_IMAGE_METADATA_URI,
				IPFS_HIDDEN_IMAGE_METADATA_URI
			)

			timeDeployed = NFT_MINT_DATE - Number(milliseconds.toString().slice(0,3))
		})

		it('Returns the contract name', async() => {
		result = await maPunks.name()
		result.should.equal(NAME)
		})

		it('Returns the symbol', async () => {
			result = await maPunks.symbol()
			result.should.equal(SYMBOL)
		})

		it('Returns the cost to mint', async () => {
			result = await maPunks.cost()
			result.toString().should.equal(COST.toString())
		})

		it('Returns the max supply', async () => {
			result = await maPunks.maxSupply()
			result.toString().should.equal(MAX_SUPPLY.toString())
		})

		it('Returns the max mint amount', async () => {
			result = await maPunks.maxMintAmount()
			result.toString().should.equal('1')
		})	

		it('Returns the time deployed', async () => {
			result = await maPunks.timeDeployed()
			
			if (result > 0) {
				assert.isTrue(true)
			} else {
				console.log(result)
				assert.isTrue(false)
			}
		})

		it('Returns the amount of seconds from deployment to minting allowed', async () => {
	        let buffer = 2
	        let target = Number(milliseconds.toString().slice(0, 3))
	        result = await maPunks.allowMintingAfter()
	        result = Number(result)

	        // NOTE: Sometimes the seconds may be off by 1, As long as the seconds are 
	        // between the buffer zone, we'll pass the test
	        if (result > (target - buffer) && result <= target) {
	            assert.isTrue(true)
	        } else {
	            assert.isTrue(false)
	        }
	    })

		 it('Returns how many seconds left until minting allowed', async () => {
            let buffer = 2
            let target = Number(milliseconds.toString().slice(0, 3))
            result = await maPunks.getSecondsUntilMinting()
            result = Number(result)

            // NOTE: Sometimes the seconds may be off by 1, As long as the seconds are 
            // between the buffer zone, we'll pass the test
            if (result > (target - buffer) && result <= target) {
                assert.isTrue(true)
            } else {
                assert.isTrue(false)
            }
        })

		 it('Returns current pause state', async () => {
	        result = await maPunks.isPaused()
	        result.toString().should.equal('false')
	    })

	 it('Returns current reveal state', async () => {
	        result = await maPunks.isRevealed()
	        result.toString().should.equal('true')
	 	})
	})

	describe('Minting', () => {
		describe('Success', () => {

			let result

			beforeEach(async () => {
				const NFT_MINT_DATE = Date.now().toString().slice(0, 10)

				maPunks = await MaPunks.new(
					NAME,
					SYMBOL,
					COST,
					MAX_SUPPLY,
					NFT_MINT_DATE,
					IPFS_IMAGE_METADATA_URI,
					IPFS_HIDDEN_IMAGE_METADATA_URI
				)

				result = await maPunks.mint(1, {from: user, value: web3.utils.toWei('0', 'ether')})
			})
			
			it('Returns the address of the minter', async () => {
                let event = result.logs[0].args
                event.to.should.equal(user)
            })

            it('Updates the total supply', async () => {
                result = await maPunks.totalSupply()
                result.toString().should.equal('1')
            })

            it('Returns IPFS URI', async () => {
                result = await maPunks.tokenURI(1)
                result.should.equal(`${IPFS_IMAGE_METADATA_URI}1.json`)
            })

            it('Returns how many a minter owns', async () => {
                result = await maPunks.balanceOf(user)
                result.toString().should.equal('1')
            })

            it('Returns the IDs of minted NFTs', async () => {
                result = await maPunks.walletOfOwner(user)
                result.length.should.equal(1)
                result[0].toString().should.equal('1')
            })

		})

		describe('Failure', () => {
			

            let result

            beforeEach(async () => {
                // Some date in the future
                const NFT_MINT_DATE = new Date("May 26, 2030 18:00:00").getTime().toString().slice(0, 10)

                maPunks = await MaPunks.new(
                    NAME,
                    SYMBOL,
                    COST,
                    MAX_SUPPLY,
                    NFT_MINT_DATE,
                    IPFS_IMAGE_METADATA_URI,
                    IPFS_HIDDEN_IMAGE_METADATA_URI,
                )
            })

            it('Attempt to mint before mint date', async () => {
                await maPunks.mint(1, { from: user, value: web3.utils.toWei('0', 'ether') }).should.be.rejected
            })
		})
	})

	describe('Updating Contract State', () => {
		describe('Success', () => {

			let result

            beforeEach(async () => {
                const NFT_MINT_DATE = Date.now().toString().slice(0, 10)

                maPunks = await MaPunks.new(
                    NAME,
                    SYMBOL,
                    COST,
                    MAX_SUPPLY,
                    NFT_MINT_DATE,
                    IPFS_IMAGE_METADATA_URI,
                    IPFS_HIDDEN_IMAGE_METADATA_URI,
                )
            })

            it('Sets the cost', async () => {
                let cost = web3.utils.toWei('1', 'ether')

                await maPunks.setCost(cost, { from: deployer })
                result = await maPunks.cost()
                result.toString().should.equal(cost)
            })

            it('Sets the pause state', async () => {
                let isPaused = true // Opposite of the default contract state
              
                await maPunks.setIsPaused(isPaused, { from: deployer })
                result = await maPunks.isPaused()
                result.toString().should.equal(isPaused.toString())
            })

            it('Sets the reveal state', async () => {
                let isRevealed = false // Opposite of the default contract state
            
                await maPunks.setIsRevealed(isRevealed, { from: deployer })
                result = await maPunks.isRevealed()
                result.toString().should.equal(isRevealed.toString())
            })

            it('Sets the max batch mint amount', async () => {
                let amount = 5 // Different from the default contract state

                await maPunks.setmaxMintAmount(5, { from: deployer })
                result = await maPunks.maxMintAmount()
                result.toString().should.equal(amount.toString())
            })

            it('Sets the IPFS not revealed URI', async () => {
                let uri = 'ipfs://IPFS-NEW-IMAGE-METADATA-CID/' // Different from the default contract state

                await maPunks.setNotRevealedURI(uri, { from: deployer })
                result = await maPunks.notRevealedUri()
                result.toString().should.equal(uri)
            })

            it('Sets the base extension', async () => {
                let extension = '.example' // Different from the default contract state

                await maPunks.setBaseExtension('.example', { from: deployer })
                result = await maPunks.baseExtension()
                result.toString().should.equal(extension)
            })
		})
		// TODO: describe failure. Try to mint more than maxMintAmount (either here or in Mint describe as an additional failure condition)
		// ...
	})
})