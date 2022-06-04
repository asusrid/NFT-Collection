import styles from '../styles/Home.module.css';
import { providers, Contract } from "ethers";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import Head from "next/head";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants'; 
import { render } from 'express/lib/response';

export default function Home() {

  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();


  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

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

    try {
      const signer  = getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);

    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

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
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

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

  }, []);


  function renderBody() {

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
            Presale has not started yet. come back later!
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
            Presale has started! If you're in the whitelist, you can start minting!
          </span>
          <button className={styles.button}>
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
          <button className={styles.button}>
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
        {renderBody()}
      </div>
    </div>
  );
}
