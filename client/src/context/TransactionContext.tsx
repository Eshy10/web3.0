import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

declare var window: any;

type TransactionContextType = {
    currentAccount: string;
    connectWallet: () => void;
    // getEthereumContract: () => ethers.Contract;
}

export const TransactionContext = React.createContext({} as TransactionContextType);

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

type TransactionProviderProps = {
  children: React.ReactNode;
};

export const TransactionProvider = ({ children }: TransactionProviderProps) => {
    const [currentAccount, setCurrentAccount] = useState<string>('');


  const checkIsWalletConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        console.log(accounts[0]);
      } else {
        alert("Please connect metamask!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object");
    }
  };

  useEffect(() => {
    checkIsWalletConnected();
  }, []);
  

  return (
    <TransactionContext.Provider value={{currentAccount, connectWallet}}>
      {children}
    </TransactionContext.Provider>
  );
};

