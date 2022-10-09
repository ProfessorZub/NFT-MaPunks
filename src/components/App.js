import { useState, useEffect } from 'react'
import { Row, Col, Spinner } from 'react-bootstrap'
import Countdown from 'react-countdown'
import Web3 from 'web3'

// Import images and CSS
import '../App.css'
import openseaIMG from '../images/socials/opensea.svg'
import showcaseIMG from '../images/socials/showcase.png'

// Import Components
import Navbar from './Navbar'

// Import ABI and configuration file
import MaPunks from '../abis/MaPunks.json'
import config from '../config.json'

function App() {

	// Set up state variables
	const [web3, setWeb3] = useState(null)
	const [maPunks, setMaPunks] = useState(null)
	const [supplyAvailable, setSupplyAvailable] = useState(0)

	const [account, setAccount] = useState(null)
	const [networkId, setNetworkId] = useState(null)
	const [ownerOf, setOwnerOf] = useState([])

	const [explorerURL, setExplorerURL] = useState('https://etherscan.io')
	const [openseaURL, setOpenseaURL] = useState('https://opensea.io')

	const [isMinting, setIsMinting] = useState(false)
	const [isError, setIsError] = useState(false)
	const [message, setMessage] = useState(null)

	const [currentTime, setCurrentTime] = useState(new Date().getTime())
	console.log({currentTime})
	const [revealTime, setRevealTime] = useState(0)

	const [counter, setCounter] = useState(7)
	const [isCycling, setIsCycling] = useState(false)

	// *** Functions
	//
	// Load NFT contract and access relevant variables

	const loadBlockchainData = async (_web3, _account, _networkId) => {
		try {
			// Load NFT contract from the current network as it could be deployed to multiple ones
			const maPunks = new _web3.eth.Contract(MaPunks.abi, MaPunks.networks[_networkId].address)
			setMaPunks(maPunks)

			const maxSupply = await maPunks.methods.maxSupply().call()
			const totalSupply = await maPunks.methods.totalSupply().call()
			setSupplyAvailable(maxSupply - totalSupply)		// totalSupply increases as NFTs are minted

			const allowMintingAfter = await maPunks.methods.allowMintingAfter().call()
			const timeDeployed = await maPunks.methods.timeDeployed().call()
			// TODO: check the format of the time is correct.
			setRevealTime((Number(timeDeployed) + Number(allowMintingAfter)).toString() + '000')  // convert miliseconds to seconds?
			console.log({revealTime}) 

			if (_account) {
				const ownerOf = await maPunks.methods.walletOfOwner(_account).call()
				setOwnerOf(ownerOf)
			} else {
				setOwnerOf([])
			} 

		} catch (error) {
			setIsError(true)
			setMessage('Contract not deployed on current network, please select valid network in Metamask.')
		}
	}

	// Gain access  to the blockchain
	const loadWeb3 = async () => {
		if (typeof window.ethereum !== 'undefined') {
			const web3 = new Web3(window.ethereum)
			setWeb3(web3)
			
			const accounts = await web3.eth.getAccounts()
			if (accounts.length > 0) {
				setAccount(accounts[0])
			} else {
				setMessage('Please connect with Metamask')
			}

			const networkId = await web3.eth.net.getId()
			// 5777 is the network id for the local chain (ganache)
			if (networkId !== 5777) {
				setExplorerURL(config.NETWORKS[networkId].explorerURL)
				setOpenseaURL(config.NETWORKS[networkId].openseaURL)
			}

			// TODO: Gregory's has accounts[0] here but shouldn't be necessay because we have set the state variable account already...
			// Load NFT contract and access relevant variables
			await loadBlockchainData(web3, account, networkId)

			// Handle account changed in Metamask
			window.ethereum.on('accountsChanged', (accounts) => {
				setAccount(accounts[0])
				setMessage(null)
			})

			// Handle chain changed in Metamask
			window.ethereum.on('chainChanged', (chainId) => {
				// reload page. Not pretty but robust
				window.location.reload()
			})

		}
	}

	// Metamask Login/Connect. Called from Navbar on click of connect button
	const web3Handler = async () => {
		if(web3) {
			const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
			setAccount(accounts[0])
		}
	}

	// Mint button handler
	const mintNFTHandler = async () => {
		if (revealTime > new Date().getTime()) {
			window.alert('Minting is not live yet!')
		}

		// Use this to avoid sending transaction and getting EVM revert due to maximum amount of NFTS per address reached.
		// Check contract to see current limit (default: 1)
		if (ownerOf.length > 0) {
			window.alert('You\'ve reached the maximum number of mints!')
		}

		// Mint an NFT
		if (maPunks && account) {
			setIsMinting(true)
			setIsError(false)

			// minting 1 NFT at a time
			await maPunks.methods.mint(1).send({ from: account, value: 100000000000000 })
				.on('confirmation', async () => {
					const maxSupply = await maPunks.methods.maxSupply().call()
					const totalSupply = await maPunks.methods.totalSupply().call()
					setSupplyAvailable(maxSupply - totalSupply)

					const oenerOf = await maPunks.methods.walletOfOwner(account).call()
					setOwnerOf(ownerOf)
				})
				.on('error', (error) => {
					window.alert(error)
					setIsError(true)
				})
		}

		setIsMinting(false)
	}

	// *** Main
	//

	useEffect(()=> {
		loadWeb3()
		// TODO: What is this for?
		//cycleImages()
	}, [account])

	// UI
	return (
		<div>
			<Navbar web3Handler={web3Handler} account={account} explorerURL={explorerURL} />
			<main>
				<section id='welcome'  className='welcome'>
					<Row className='header my-3 p-3 mb-0 pb-0'>
						<Col xs={12} md={12} lg={8} xxl={8}>
							<h1>Ma Punks</h1>
							<p className='sub-header'>Availble on 09 / 29 / 22</p>
						</Col>
						<Col className='flex social-icons'>
							<a
								href={`${openseaURL}/collection/${config.PROJECT_NAME}-v3`}
								target='_blank'
								className='circle flex button'>
								<img src={openseaIMG} alt="Opensea" />
							</a>
						</Col>
					</Row>

					<Row className='flex m-3'>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img
								src={`https://gateway.pinata.cloud/ipfs/QmYxDBt4M798xXafRH2kTaqF2PBNLkubxYuFKPMDLpKEVW/${counter}.png`}
								alt="Punk"
								className='showcase'
							/>
						</Col>
						<Col md={5} lg={4} xl={5} xxl={4}>
							{/*{revealTime !== 0 && <Countdown date={currentTime + (revealTime - currentTime)} className='countdown mx-3' />}*/}
							{revealTime !==0 && <Countdown date={currentTime + 10000} className='countdown mx-3' /> }
							<p className='text'>
								Connect to Goerli test network and mint for free!
							</p>
							<a href="#about" className='button mx-3'>Learn More!</a>
						</Col>
					</Row>
				</section>
				<section id='about' className='about'>
					<Row className='flex m-3'>
						<h2 className='text-center p-3'>About the collection</h2>
						<Col md={5} lg={4} xl={5} xxl={4} className='text-center'>
							<img src={showcaseIMG} alt='Multiple Punks' className='showcase' />
						</Col>
						<Col>
							{isError ? (
								<p>{message}</p>
							) : (
								<div>
									<h3>Mint your NFT in</h3>	
									{revealTime !==0 && <Countdown date={currentTime + 10000} className='countdown mx-3' /> }
									<ul>
										<li>49 (de)generative punks, generated via art generator!</li>
										<li>Free minting on Goerli testnet</li>
										<li>Viewable on Opensea shortly after minting</li>
									</ul>		
								
								{isMinting ? (
									<Spinner animation='border' className='p-3 m-2' />
								) : (
									<button onClick={mintNFTHandler} className='button mint-button mt-3'>Mint</button>
								)}

								</div>
							)}

						</Col>
					</Row>
					<Row style={{ marginTop: "100px" }}>
						
					</Row>
					
				</section>
			</main>
			<footer>
				
			</footer>
		</div>
	)
}

export default App
