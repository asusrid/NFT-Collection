import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {

  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider  = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
  
      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());

    } catch (error) {
      console.log(error);
    }
  };

  const presaleMint = async () => {

    setLoading(true);
    try {
      const signer  = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
  
      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      });
      await tx.wait();

      window.alert("Succesfully minted NFT!!");

    } catch (error) {
      console.error(error);
    }
    setLoading(false);

  };
  
  const publicMint = async () => {
    setLoading(true);
    try {
      const signer  = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
  
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01")
      });
      await tx.wait();

      window.alert("Succesfully minted NFT!!");

    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      console.log("getOwner");
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if(owner === userAddress) {
        setIsOwner(true);
      }

    } catch (error) {
      console.log(error);
    }
  };

  const startPresale = async () => {

    setLoading(true);
    try {

      const signer  = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      console.log(nftContract);
      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);

    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

      // this will be a BigNumber as it is uint256
      // unit in seconds
      const presaleEndTime = nftContract.presaleEndTime();
      const currentTimeInSeconds = Date.now() / 1000;

      // we have to use the func lt instead of < because of BigNumber
      const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));

      setPresaleEnded(hasPresaleEnded);

    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    // we need to gain access to the provider/signer from Metamask
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const preSaleStarted = await checkIfPresaleStarted();

    if(preSaleStarted) {
      await checkIfPresaleEnded();
    }

    await getNumMintedTokens();

    // monitor every 5 secs in real time the number of minted tokens
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5 * 1000);

    // monitor every 5 secs in real time the number of minted tokens
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000);

  };

  const getProviderOrSigner = async (needSigner = false) => {

    // this will open metamask pop up
    // provider - when you want to read data from the blockchain
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    

    // if the user is not in rinkeby, tell them to switch to it
    const { chainId } = await web3Provider.getNetwork();
    if (chainId != 4) {
      window.alert("Please switch to the Rinkeby network!");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      console.log("signer");
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  // exec when site loads (renders)
  useEffect(() => {

    if (!walletConnected) {

      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false
      });

      onPageLoad();
    }

  }, [walletConnected]);


  function renderBody() {

    if(loading) {
      return (
        <span className={styles.description}>
          Loading...
        </span>
      );
    }    

    if(!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (isOwner && !presaleStarted) {
      // start presale
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      // presale hasnt started yet, come back later
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Come back later!
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      // allow users to mint presale
      // they need to be in whitelist 
      return (
        <div>
          <span className={styles.description}>
            Presale has started! If you are in the whitelist, you can start minting!
          </span>
          <button onClick={presaleMint} className={styles.button}>
            Presale Mint
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      // allow users to take part in public sale
      return (
        <div>
          <span className={styles.description}>
            Presale has ended! You can mint NFT in public sale.
          </span>
          <button onClick={publicMint} className={styles.button}>
            Public Mint
          </button>
        </div>
      );
    }
  }


  return (
    <div>
      <Head>
        <title>NFT Collection project</title>
      </Head>

      <div className={styles.main}>     
        <span className={styles.description}>
          {numTokensMinted}/20 have been minted already!
        </span>
        {renderBody()}
      </div>
    </div>
  );
}
