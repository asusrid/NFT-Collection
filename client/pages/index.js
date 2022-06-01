import styles from '../styles/Home.module.css';
import { providers, Contract } from "ethers";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import Head from "next/head";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants'; 

export default function Home() {

  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();


  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

      const owner = await nftContract.owner();
      const userAddress = signer.getAddress();

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

    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    // we need to gain access to the provider/signer from Metamask
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
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

      connectWallet();
    }

  }, []);





  return (
    <div>
      <Head>
        <title>NFT Collection project</title>
      </Head>

      <div className={styles.main}>
        {!walletConnected ? <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button> : null
        }
        

      </div>
    </div>
  );
}
